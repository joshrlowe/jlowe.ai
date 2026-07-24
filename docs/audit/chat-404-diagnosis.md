# Diagnosis: `/api/chat` returns 404 through CloudFront (dev)

**Stage 2.3 (Velocity).** Investigation + draft patch. No infra/Terraform applied, no
deploy, no merge.

## TL;DR

The `/api/chat` behavior routes to a Lambda **Function URL** protected by CloudFront
**Origin Access Control (OAC)**. AWS's OAC-for-Lambda contract requires the *viewer*
to send the request body's SHA-256 in an **`x-amz-content-sha256`** header on every
`POST`/`PUT` — "Lambda doesn't support unsigned payloads." The browser client
(`apps/web/src/components/chat/stream.ts`) sends the POST **without** that header, so
the Function URL rejects the SigV4 signature with **403**. A distribution-wide
`custom_error_response` then **remaps 403 → 404** and serves `/404.html`, which is why
the symptom presents as "404 for every method" instead of 403.

- **Confidence:** High on the mechanism (AWS docs + code both explicit); the
  *specific* 403 reason (payload-hash mismatch vs. another OAC edge case) is
  **UNVERIFIED** because no CloudWatch/access logs exist yet. **Do step 0 first.**

## Request-path trace

Browser `POST /api/chat` (JSON body)
→ CloudFront distribution `aws_cloudfront_distribution.site`
→ ordered cache behavior `path_pattern = "/api/chat*"`
  (`infra/terraform/modules/cdn/main.tf:310-320`)
  - `target_origin_id = "lambda-chat-${env}"`, all methods allowed,
    `Managed-CachingDisabled`, `Managed-AllViewerExceptHostHeader`, `compress = false`.
→ origin `lambda-chat-${env}` = the Function URL host
  (`main.tf:257-267`, host from `module.chat.function_url_host`,
  `infra/terraform/envs/main.tf:18`)
  - signed by OAC `aws_cloudfront_origin_access_control.chat`
    (`origin_type = "lambda"`, `signing_behavior = "always"`, `sigv4`) (`main.tf:63-68`)
→ Lambda Function URL `aws_lambda_function_url.chat`
  (`authorization_type = "AWS_IAM"`, `invoke_mode = "RESPONSE_STREAM"`)
  (`infra/terraform/modules/chat/main.tf:117-121`)
  - CloudFront invoke permission: `aws_lambda_permission.chat_invoke_url`
    (`lambda:InvokeFunctionUrl`, principal `cloudfront.amazonaws.com`,
    `function_url_auth_type = "AWS_IAM"`, scoped to the distribution ARN)
    (`infra/terraform/modules/cdn/main.tf:354-361`)
→ handler `services/chat/src/handler.ts` (never reached — see below).

## Evidence

### Confirmed from code

1. **The client sends no payload hash.** `stream.ts` POSTs with only
   `content-type: application/json` and `body: JSON.stringify(req)` — no
   `x-amz-content-sha256` header. (`apps/web/src/components/chat/stream.ts:32-37`,
   pre-patch.)

2. **The origin is an OAC-signed Lambda Function URL requiring IAM auth.**
   - OAC: `origin_access_control_origin_type = "lambda"`, `signing_behavior = "always"`
     (`infra/terraform/modules/cdn/main.tf:63-68`).
   - Function URL: `authorization_type = "AWS_IAM"`
     (`infra/terraform/modules/chat/main.tf:117-121`).

3. **The 403→404 mask.** `custom_error_response` on the distribution remaps both
   `403 → 404` (serving `/404.html`) and `404 → 404`
   (`infra/terraform/modules/cdn/main.tf:324-335`). These were written for the
   private-S3 origin ("OAC'd private bucket returns 403 for missing keys") but apply
   **distribution-wide**, including to the `/api/chat*` behavior. Any 403 the Function
   URL returns is therefore surfaced to the viewer as **404** — exactly the reported
   symptom, and the reason 403 vs. 404 can't be told apart from the client.

4. **No Lambda logs is consistent with an auth-layer rejection.** The Function URL
   validates the SigV4 signature *before* invoking the function. A signature failure
   returns 403 without ever running `handler.ts`, so nothing is written to
   `/aws/lambda/jlowe-ai-chat-dev` (`infra/terraform/modules/chat/main.tf:80-83`).
   The audit's "no CloudWatch logs exist yet" corroborates a pre-invocation 403 rather
   than an application error.

### Confirmed from AWS documentation

From "Restrict access to an AWS Lambda function URL origin"
(CloudFront Developer Guide), the **Important** callout:

> If you use `PUT` or `POST` methods with your Lambda function URL, your users must
> compute the SHA256 of the body and include the payload hash value of the request
> body in the `x-amz-content-sha256` header when sending the request to CloudFront.
> **Lambda doesn't support unsigned payloads.**

CloudFront OAC signs the request but does **not** compute the body hash for you; it
takes `x-amz-content-sha256` from the viewer request and folds it into the SigV4
signature it sends to the origin. Lambda re-hashes the received body and compares. No
header ⇒ signature/payload mismatch ⇒ **403** at the Function URL. The doc's own
example client explicitly sets this header for POSTs.

Supporting config facts (why the header will actually reach the signer / origin
intact):
- `Managed-AllViewerExceptHostHeader` forwards all viewer headers except Host, so a
  viewer-supplied `x-amz-content-sha256` is available to OAC and forwarded to the
  origin (`infra/terraform/modules/cdn/main.tf:318`).
- `compress = false` on this behavior means CloudFront doesn't re-encode the body, so
  the bytes CloudFront hashes/forwards match what the client hashed
  (`infra/terraform/modules/cdn/main.tf:316`).

### Ruled out / looks correct

- **Path routing.** `/api/chat*` matches `POST /api/chat`; the `url-rewrite`
  CloudFront function is on the *default* behavior only, so `/api/chat` is not
  rewritten to `.../index.html` (`infra/terraform/modules/cdn/main.tf:278-281,
  306-320`; `functions/url-rewrite.js`).
- **Invoke permission.** `aws_lambda_permission.chat_invoke_url` matches the AWS
  runbook (principal, action, `function_url_auth_type`, distribution-ARN condition)
  (`infra/terraform/modules/cdn/main.tf:354-361`).
- **Origin protocol.** `https-only`, TLSv1.2 — consistent with a Function URL
  (`main.tf:261-266`).
- **Handler.** `handler.ts` never 404s; it always opens a 200 stream and fails open.
  A 404 cannot originate from application code — further evidence the request never
  reaches it.

## Why the leading client-side hypothesis is (probably) the real one

The prior audit's hypothesis — missing/incorrect `x-amz-content-sha256` on the POST —
is **directly supported** by the AWS "Important" note and by the code (the header is
absent). The one nuance the audit got slightly wrong: it isn't that the client signs
the request (OAC/CloudFront does the SigV4 signing); it's that the client must supply
the *body hash* so CloudFront can sign it. The fix still lands in the client.

The Terraform/OAC config itself looks **correct** for the OAC-for-Lambda pattern, so
this is primarily a **client-side** fix, not an IaC change. The one IaC wart worth
fixing regardless is the 403→404 masking (below), which is what made this hard to
diagnose.

## Fix plan (prioritized)

### Step 0 — make it observable FIRST (do before trusting any fix)

Nothing here can be *confirmed* without runtime signal. Before/while applying the
client patch:

1. **Enable CloudFront standard access logging** (or real-time logs) on the dev
   distribution so edge response codes for `/api/chat` are visible. This is what lets
   us see the true **403** currently hidden behind the 404 remap. *(Terraform change —
   described, not applied here: add a `logging_config` block / v2 access-log config to
   `aws_cloudfront_distribution.site`.)*
2. **Confirm the Lambda log group is empty for the failing requests.** An empty
   `/aws/lambda/jlowe-ai-chat-dev` during a repro confirms the request dies at the
   Function URL auth layer (pre-invocation), i.e. a signature/permission 403 — not an
   app error.
3. **Temporarily stop masking the chat origin's status.** The distribution-wide
   `custom_error_response` (403→404) makes the failure indistinguishable from a
   genuine 404. Scope error mapping so it does **not** swallow `/api/chat*` responses.
   Options (Terraform, not applied here):
   - restrict `custom_error_response` intent to the S3 origin by moving error
     presentation there, or
   - accept the mask only after logging (step 1) is in place.
   Even a one-off `curl -i` against the Function URL host via a signed request would
   reveal the 403 body/headers the viewer never sees.

### Step 1 — client patch (DRAFT, UNVERIFIED — in this PR)

Add `x-amz-content-sha256: <hex SHA-256 of the JSON body>` to the POST in
`stream.ts`, computed with `crypto.subtle.digest`. Implemented on this branch; the
unit test asserts the header equals the hash of the exact body bytes. Marked UNVERIFIED
because it can only be confirmed once step 0's logging shows the edge response flip from
403→200 (currently masked as 404). Web Crypto `subtle` requires a secure context —
fine on `https://dev.jlowe.ai`.

### Step 2 — verify end-to-end

With logging on and the mask lifted: repro from the browser, confirm
- CloudFront access log shows `POST /api/chat` → **200**,
- the Lambda log group now shows an invocation,
- the assistant reply streams in the UI.
If a 403 persists with the header present, the residual suspects (need logs to
distinguish) are: OAC/permission propagation lag, an `Authorization`-header override
interaction, or the Function URL host var (`module.chat.function_url_host`) drifting
from the deployed function.

### Step 3 — harden the error mapping (Terraform, follow-up)

Regardless of root cause, permanently prevent the `/api/chat*` behavior from having its
origin status rewritten by the S3-oriented `custom_error_response`, so future auth/5xx
failures on the chat path surface honestly instead of as a generic 404.

## What can't be confirmed without runtime logs

- That the current 403 is specifically a **payload-hash** rejection (vs. another OAC
  cause). The AWS doc + missing header make it the leading cause, but only a signed
  repro / access log proves it.
- Whether the invoke **permission** and OAC signature have fully propagated to edge.
- Whether `module.chat.function_url_host` matches the currently deployed Function URL
  (the deploy-chat workflow owns code out-of-band; a stale/recreated URL would also
  land as a masked 4xx).

## Files referenced

- `apps/web/src/components/chat/stream.ts` — client transport (patched here).
- `apps/web/src/components/chat/stream.test.ts` — asserts the new header (updated here).
- `infra/terraform/modules/cdn/main.tf` — `/api/chat*` behavior, chat OAC, origin,
  invoke permission, `custom_error_response` (the 403→404 mask).
- `infra/terraform/modules/chat/main.tf` — Lambda, IAM-auth Function URL, log group.
- `infra/terraform/envs/main.tf` — wires `chat_function_url_host` into the cdn module.
- `services/chat/src/handler.ts` — the streaming handler (never reached on failure).

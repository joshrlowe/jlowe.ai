#!/usr/bin/env bash
# One-time, idempotent bootstrap of the two resources Terraform cannot manage
# for itself: the S3 state bucket (Terraform can't host its own backend) and
# the GitHub OIDC provider (kept out of TF state so `terraform destroy` of any
# stack can never sever CI's auth). Everything else is Terraform.
#
# Safe to re-run. Requires AWS creds for account 509399626117 (us-east-1).
set -euo pipefail

ACCOUNT_ID="509399626117"
REGION="us-east-1"
BUCKET="jlowe-ai-terraform-state-${ACCOUNT_ID}"
OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

caller="$(aws sts get-caller-identity --query Account --output text)"
if [[ "${caller}" != "${ACCOUNT_ID}" ]]; then
  echo "ERROR: wrong AWS account (${caller}); expected ${ACCOUNT_ID}" >&2
  exit 1
fi

# --- Terraform state bucket -------------------------------------------------
if ! aws s3api head-bucket --bucket "${BUCKET}" 2>/dev/null; then
  # us-east-1 must NOT pass a LocationConstraint.
  aws s3api create-bucket --bucket "${BUCKET}" --region "${REGION}"
  echo "created s3://${BUCKET}"
else
  echo "s3://${BUCKET} already exists"
fi

# The following puts are natively idempotent.
aws s3api put-bucket-versioning --bucket "${BUCKET}" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption --bucket "${BUCKET}" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api put-public-access-block --bucket "${BUCKET}" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-lifecycle-configuration --bucket "${BUCKET}" \
  --lifecycle-configuration '{"Rules":[
    {"ID":"expire-noncurrent","Status":"Enabled","Filter":{},
     "NoncurrentVersionExpiration":{"NoncurrentDays":90}},
    {"ID":"abort-mpu","Status":"Enabled","Filter":{},
     "AbortIncompleteMultipartUpload":{"DaysAfterInitiation":7}}
  ]}'

aws s3api put-bucket-policy --bucket "${BUCKET}" --policy "{
  \"Version\":\"2012-10-17\",
  \"Statement\":[{
    \"Sid\":\"DenyInsecureTransport\",\"Effect\":\"Deny\",\"Principal\":\"*\",
    \"Action\":\"s3:*\",
    \"Resource\":[\"arn:aws:s3:::${BUCKET}\",\"arn:aws:s3:::${BUCKET}/*\"],
    \"Condition\":{\"Bool\":{\"aws:SecureTransport\":\"false\"}}
  }]
}"
echo "state bucket configured (versioning, SSE-S3, public-access-block, TLS-only, lifecycle)"

# --- GitHub OIDC provider ---------------------------------------------------
# ThumbprintList is intentionally omitted: it is optional per the IAM API; IAM
# auto-retrieves it and AWS validates GitHub's JWKS TLS against its trusted-CA
# library regardless.
if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "${OIDC_ARN}" >/dev/null 2>&1; then
  aws iam create-open-id-connect-provider \
    --url "https://token.actions.githubusercontent.com" \
    --client-id-list "sts.amazonaws.com"
  echo "created OIDC provider ${OIDC_ARN}"
else
  echo "OIDC provider already exists"
fi

echo "bootstrap complete."

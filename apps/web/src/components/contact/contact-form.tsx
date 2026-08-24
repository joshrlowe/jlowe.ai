"use client";

import {
  CircleCheckIcon,
  LoaderCircleIcon,
  SendHorizontalIcon,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EMAIL } from "@/data/site";

import {
  CONTACT_LIMITS,
  submitContact,
  validateContact,
  type ContactErrors,
  type ContactField,
  type ContactFields,
} from "./submit";

const EMPTY: ContactFields = { name: "", email: "", message: "", company: "" };

/** Field order — also the order the first invalid field is focused in. */
const FIELD_ORDER: readonly ContactField[] = ["name", "email", "message"];

const GENERIC_ERROR =
  "Something went wrong sending that. Please try again, or email me directly.";

/**
 * Join the ids a control is described by, dropping the absent ones. Not `cn` —
 * that is tailwind-merge, which is entitled to rewrite what it thinks are class
 * names.
 */
function describedBy(
  ...ids: (string | false | undefined)[]
): string | undefined {
  const present = ids.filter((value): value is string => Boolean(value));
  return present.length > 0 ? present.join(" ") : undefined;
}

type Status = "idle" | "pending" | "success" | "error";

/**
 * The real contact form. `apps/web` is a static export with no server, so this
 * POSTs to `/api/contact` — a Lambda behind a same-origin CloudFront behavior —
 * exactly as the chat dock does.
 *
 * Accessibility contract, deliberate and load-bearing:
 *  - Every control has a real `<label for>`; nothing relies on a placeholder.
 *  - Errors are wired with `aria-describedby` + `aria-invalid`, and the hint and
 *    error ids are combined so a field keeps its hint while it is in error.
 *  - Submitting with errors moves focus to the first invalid field, so a
 *    keyboard or screen-reader user is taken to the problem rather than told
 *    about it somewhere off-screen.
 *  - The submit status lives in a polite live region; the send failure is an
 *    `alert` because it interrupts a task the visitor believed was finished.
 *  - Success swaps the form for a confirmation panel that takes focus, so the
 *    outcome is announced instead of silently replacing the page beneath the
 *    cursor.
 *  - The only animation is the pending spinner, behind `motion-safe:` (the
 *    global reduced-motion floor in globals.css would neutralise it anyway;
 *    this makes the intent local and explicit).
 */
export function ContactForm() {
  const id = useId();
  const [fields, setFields] = useState<ContactFields>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort an in-flight submit if the page navigates away mid-request.
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const fieldId = (field: ContactField) => `${id}-${field}`;
  const errorId = (field: ContactField) => `${id}-${field}-error`;
  const hintId = (field: ContactField) => `${id}-${field}-hint`;

  const setField = useCallback((field: ContactField, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    // Clear a field's error as soon as it is edited: keeping a stale complaint
    // on screen while someone fixes it is just noise.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  function focusFirstError(found: ContactErrors) {
    const first = FIELD_ORDER.find((field) => found[field]);
    if (!first) return;
    formRef.current
      ?.querySelector<HTMLElement>(`#${CSS.escape(fieldId(first))}`)
      ?.focus();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending") return;

    const found = validateContact(fields);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      setStatus("error");
      setSendError(null);
      focusFirstError(found);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("pending");
    setSendError(null);
    try {
      const result = await submitContact(fields, controller.signal);
      if (result.ok) {
        setFields(EMPTY);
        setStatus("success");
      } else {
        setSendError(result.error);
        setStatus("error");
      }
    } catch {
      setSendError(GENERIC_ERROR);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card>
        <CardContent
          ref={successRef}
          tabIndex={-1}
          role="status"
          className="flex flex-col items-start gap-3 outline-none"
        >
          <p className="flex items-center gap-2 font-heading text-base font-medium">
            <CircleCheckIcon aria-hidden className="size-5 text-starlight" />
            Message sent
          </p>
          <p className="text-sm text-muted-foreground">
            Thanks — that landed in my inbox. I usually reply within a couple of
            working days.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setStatus("idle");
              setErrors({});
            }}
          >
            Send another message
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pending = status === "pending";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Send a message</CardTitle>
        <CardDescription>
          Tell me what you are building and I will come back to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
          className="relative space-y-5"
        >
          <div className="space-y-1.5">
            <label
              htmlFor={fieldId("name")}
              className="block text-sm font-medium"
            >
              Name
            </label>
            <Input
              id={fieldId("name")}
              name="name"
              value={fields.name}
              onChange={(e) => setField("name", e.target.value)}
              autoComplete="name"
              maxLength={CONTACT_LIMITS.nameMax}
              disabled={pending}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? errorId("name") : undefined}
            />
            <FieldError id={errorId("name")} message={errors.name} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={fieldId("email")}
              className="block text-sm font-medium"
            >
              Email
            </label>
            <Input
              id={fieldId("email")}
              name="email"
              type="email"
              inputMode="email"
              value={fields.email}
              onChange={(e) => setField("email", e.target.value)}
              autoComplete="email"
              maxLength={CONTACT_LIMITS.emailMax}
              disabled={pending}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy(
                hintId("email"),
                errors.email && errorId("email"),
              )}
            />
            <p id={hintId("email")} className="text-xs text-muted-foreground">
              So I can reply. Nothing else — no list, no forwarding.
            </p>
            <FieldError id={errorId("email")} message={errors.email} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={fieldId("message")}
              className="block text-sm font-medium"
            >
              Message
            </label>
            <Textarea
              id={fieldId("message")}
              name="message"
              rows={6}
              value={fields.message}
              onChange={(e) => setField("message", e.target.value)}
              maxLength={CONTACT_LIMITS.messageMax}
              disabled={pending}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={describedBy(
                hintId("message"),
                errors.message && errorId("message"),
              )}
            />
            <p id={hintId("message")} className="text-xs text-muted-foreground">
              A couple of sentences on the problem is plenty to start.
            </p>
            <FieldError id={errorId("message")} message={errors.message} />
          </div>

          {/*
            Honeypot. Off-screen rather than `display:none` (some bots skip
            hidden inputs), aria-hidden and tabIndex -1 so no assistive tech or
            keyboard user can ever reach it, and never autofilled. A filled value
            makes the backend return a normal 200 without sending anything.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-[9999px] size-0 overflow-hidden"
          >
            <label htmlFor={`${id}-company`}>Company</label>
            <input
              id={`${id}-company`}
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={fields.company}
              onChange={(e) =>
                setFields((prev) => ({ ...prev, company: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? (
                <LoaderCircleIcon
                  aria-hidden
                  className="motion-safe:animate-spin"
                />
              ) : (
                <SendHorizontalIcon aria-hidden />
              )}
              {pending ? "Sending…" : "Send message"}
            </Button>
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {pending ? "Sending your message…" : ""}
            </p>
          </div>

          {sendError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground"
            >
              {sendError}{" "}
              <a
                href={`mailto:${EMAIL}`}
                className="text-starlight underline underline-offset-4"
              >
                {EMAIL}
              </a>
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * A field's error text. Rendered only when there is one — an always-present
 * empty node would leave a dangling `aria-describedby` target.
 */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

---
slug: mailsweep
title: Mailsweep — Gmail cleanup you can undo
kind: project
role: Engineer
stack: [TypeScript, Next.js, Gmail API, BullMQ, PostgreSQL, Claude Haiku]
outcomes:
  - Sender-level cleanup — tens of thousands of messages collapse into a reviewable list of senders
  - Every sweep snapshots prior state per message, so undo restores exactly what was — and no permanent-delete code path exists
  - Deterministic scoring with hard safety rails does the suggesting; an LLM appears only in the consent-gated command bar
visibility: public
---

Mailsweep is sender-level bulk cleanup for Gmail that treats reversibility as
the product invariant. It indexes metadata only — headers and a snippet, never
bodies — groups the mailbox by sender, explains what looks cleanable and why,
and executes reviewed sweeps as invertible label arithmetic. Every action
snapshots each message's prior state, so undo restores it exactly, down to not
un-archiving mail that was already archived before it was trashed.

The intelligence is deliberately layered. A deterministic scorer with hard
rails makes the suggestions — protected senders, anything you have replied to,
and security-looking mail are never suggested, and transactional mail caps at
archive instead of trash. Claude Haiku appears only to compile natural-language
commands into a fixed action schema (the schema is the allowlist), gated
behind explicit consent. Underneath, a quota-budgeted token bucket keeps a
full-mailbox backfill inside Gmail's rate cap, one-click unsubscribes pass
through an SSRF guard that pins DNS-resolved addresses, and a crashed sweep
resumes from its last completed chunk instead of re-applying finished work.

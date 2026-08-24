/**
 * Qualified-leads digest template. Ported from v1
 * `lib/email/templates/qualified-leads.ts`. Subject is PII-free; name/email
 * and transcripts live only in the owner's inbox.
 */

import type { ChatSession, StoredMessage } from "./sessions.js";

export interface RenderedDigest {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function renderTurnHtml(turn: StoredMessage): string {
  const isUser = turn.role === "user";
  const bg = isUser ? "#1a2333" : "#221b13";
  const border = isUser ? "#2d3a52" : "#3a2d1b";
  const label = isUser ? "Visitor" : "Twin";
  const intentBadge =
    isUser && turn.intent
      ? ` <span style="font-size:10px;padding:2px 6px;border-radius:8px;background:#3a3a3a;color:#bbb;margin-left:6px;">${escapeHtml(turn.intent)}</span>`
      : "";
  return `
    <div style="margin:8px 0;padding:10px 12px;background:${bg};border:1px solid ${border};border-radius:8px;">
      <div style="font-size:11px;font-weight:600;color:#888;margin-bottom:6px;">
        ${label}${intentBadge}
      </div>
      <div style="white-space:pre-wrap;color:#e0e0e0;font-size:13px;line-height:1.5;">
        ${escapeHtml(turn.content)}
      </div>
    </div>`.trim();
}

function renderTurnText(turn: StoredMessage): string {
  const tag = turn.role === "user" ? "VISITOR" : "TWIN";
  const intent = turn.role === "user" && turn.intent ? ` [${turn.intent}]` : "";
  return `${tag}${intent}: ${turn.content}`;
}

function renderSessionHtml(s: ChatSession): string {
  const headerBits = [
    s.capturedName ? escapeHtml(s.capturedName) : "(no name)",
    s.capturedEmail ? escapeHtml(s.capturedEmail) : "(no email)",
    `intent: ${escapeHtml(s.topIntent || "—")}`,
  ];
  const turns = s.messages.map(renderTurnHtml).join("\n");
  return `
    <section style="margin:24px 0;padding:16px;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:12px;">
      <header style="margin-bottom:12px;border-bottom:1px solid #2a2a2a;padding-bottom:8px;">
        <div style="font-size:14px;font-weight:600;color:#E85D04;">Session ${escapeHtml(s.sessionId.slice(0, 8))}</div>
        <div style="font-size:12px;color:#999;margin-top:4px;">${headerBits.join(" • ")}</div>
        <div style="font-size:11px;color:#666;margin-top:4px;">${escapeHtml(s.createdAt)}</div>
      </header>
      ${turns}
    </section>`.trim();
}

function renderSessionText(s: ChatSession): string {
  const headerBits = [
    `Session ${s.sessionId.slice(0, 8)}`,
    s.capturedName || "(no name)",
    s.capturedEmail || "(no email)",
    `intent: ${s.topIntent || "—"}`,
    s.createdAt,
  ];
  const turns = s.messages.map(renderTurnText).join("\n\n");
  return `${headerBits.join(" | ")}\n\n${turns}`;
}

export function renderQualifiedLeadsDigest(
  sessions: ChatSession[],
  now: Date = new Date(),
): RenderedDigest {
  const day = formatDate(now.toISOString());
  const n = sessions.length;
  const subject = `Qualified leads — ${day} (${n} session${n === 1 ? "" : "s"})`;
  const html = `<!doctype html>
<html><body style="background:#080808;color:#e0e0e0;font-family:ui-sans-serif,system-ui,sans-serif;padding:24px;">
  <h1 style="font-size:18px;color:#E85D04;">${escapeHtml(subject)}</h1>
  ${sessions.map(renderSessionHtml).join("\n")}
</body></html>`;
  const text = `${subject}\n\n${sessions.map(renderSessionText).join("\n\n----\n\n")}`;
  return { subject, html, text };
}

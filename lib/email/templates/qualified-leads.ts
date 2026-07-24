/**
 * Qualified-leads digest email template.
 *
 * Subject is PII-free ("Qualified leads — YYYY-MM-DD (N sessions)").
 * Body includes captured name/email and full transcripts — those land only
 * in the owner's inbox.
 */

import { getConfig } from "@/lib/config";

interface ChatMessageRowFixture {
  role: string;
  content: string;
  intent?: string | null;
  toolCalls?: unknown;
  createdAt: Date;
}

interface ChatSessionFixture {
  id: string;
  sessionId: string;
  qualified: boolean;
  topIntent: string | null;
  capturedEmail: string | null;
  capturedName: string | null;
  langfuseTraceIds: string[];
  createdAt: Date;
  messages: ChatMessageRowFixture[];
}

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

function langfuseUrlFor(traceId: string): string {
  const cfg = getConfig().langfuse;
  const host = cfg?.host || "https://cloud.langfuse.com";
  return `${host}/trace/${encodeURIComponent(traceId)}`;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function renderTurnHtml(turn: ChatMessageRowFixture): string {
  const isUser = turn.role === "user";
  const bg = isUser ? "#1a2333" : "#221b13";
  const border = isUser ? "#2d3a52" : "#3a2d1b";
  const label = isUser ? "Visitor" : "Vulture";
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

function renderTurnText(turn: ChatMessageRowFixture): string {
  const tag = turn.role === "user" ? "VISITOR" : "VULTURE";
  const intent = turn.role === "user" && turn.intent ? ` [${turn.intent}]` : "";
  return `${tag}${intent}: ${turn.content}`;
}

function renderSessionHtml(s: ChatSessionFixture): string {
  const traceLinks = s.langfuseTraceIds
    .map(
      (id) =>
        `<a href="${langfuseUrlFor(id)}" style="color:#4CC9F0;text-decoration:underline;">${escapeHtml(id.slice(0, 8))}</a>`
    )
    .join(", ");
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
        ${traceLinks ? `<div style="font-size:11px;color:#666;margin-top:4px;">Traces: ${traceLinks}</div>` : ""}
        <div style="font-size:11px;color:#666;margin-top:4px;">${escapeHtml(s.createdAt.toISOString())}</div>
      </header>
      ${turns}
    </section>`.trim();
}

function renderSessionText(s: ChatSessionFixture): string {
  const headerBits = [
    `Session ${s.sessionId.slice(0, 8)}`,
    s.capturedName || "(no name)",
    s.capturedEmail || "(no email)",
    `intent: ${s.topIntent || "—"}`,
    s.createdAt.toISOString(),
  ];
  const traces = s.langfuseTraceIds.length
    ? `Traces: ${s.langfuseTraceIds.map(langfuseUrlFor).join(", ")}\n`
    : "";
  const turns = s.messages.map(renderTurnText).join("\n\n");
  return `${headerBits.join(" | ")}\n${traces}\n${turns}`;
}

export function renderQualifiedLeadsDigest(sessions: ChatSessionFixture[]): RenderedDigest {
  const date = formatDate(new Date());
  const subject = `Qualified leads — ${date} (${sessions.length} session${sessions.length === 1 ? "" : "s"})`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px;background:#000;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <div style="max-width:760px;margin:0 auto;">
    <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">${escapeHtml(subject)}</h1>
    <p style="color:#999;font-size:13px;margin:0 0 24px;">
      ${sessions.length === 0 ? "No qualified sessions in the last 24 hours." : `${sessions.length} qualified session${sessions.length === 1 ? "" : "s"} in the last 24 hours. Captured name/email below.`}
    </p>
    ${sessions.map(renderSessionHtml).join("\n")}
  </div>
</body>
</html>`.trim();

  const text = [
    subject,
    "",
    `${sessions.length} qualified session(s) in the last 24 hours.`,
    "",
    sessions.map(renderSessionText).join("\n\n---\n\n"),
  ].join("\n");

  return { subject, html, text };
}

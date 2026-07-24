/**
 * /admin/comments — moderation review.
 *
 * Three tabs (held / approved / rejected) selected via ?tab=. Default
 * is "held" because that's the actionable bucket. Approve / Reject
 * actions PATCH /api/admin/comments/[id], which mirrors the legacy
 * `approved` boolean and writes an ActivityLog entry.
 */

import { useCallback, useEffect, useState } from "react";
import type { GetServerSidePropsContext } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import AdminLayout from "@/components/admin/AdminLayout";

type Tab = "held" | "approved" | "rejected";
const TABS: Tab[] = ["held", "approved", "rejected"];

interface CommentScores {
  spam: number;
  toxicity: number;
  offTopic: number;
  pii: number;
  summary?: string;
  decisionReason?: string | null;
}

interface CommentRow {
  id: string;
  postId: string;
  authorName: string;
  authorEmail: string | null;
  content: string;
  moderationStatus: Tab;
  moderationScores: CommentScores | null;
  moderationModel: string | null;
  moderatedAt: string | null;
  createdAt: string;
  post: { id: string; title: string; slug: string; topic: string };
}

interface FetchResult {
  tab: Tab;
  items: CommentRow[];
  nextCursor: string | null;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const auth = await requireAuth(context);
  if ("redirect" in auth || "notFound" in auth) return auth;
  const tabRaw = typeof context.query.tab === "string" ? context.query.tab : "held";
  const initialTab: Tab = TABS.includes(tabRaw as Tab) ? (tabRaw as Tab) : "held";
  return { props: { ...("props" in auth ? auth.props : {}), initialTab } };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  // Color thresholds match lib/moderation/policy.ts so admins read the
  // same picture the policy used to make the decision.
  const color =
    value >= 0.8
      ? "var(--color-secondary)" // crimson
      : value >= 0.4
        ? "var(--color-accent)" // gold/amber
        : "var(--color-success)"; // green
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-[var(--color-text-muted)] uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-darker)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-10 text-right tabular-nums text-[var(--color-text-secondary)]">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

interface CommentRowProps {
  comment: CommentRow;
  onChange: (id: string, status: Tab) => Promise<void>;
}

function CommentCard({ comment, onChange }: CommentRowProps) {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);
  const scores = comment.moderationScores;

  const act = async (status: Tab) => {
    setBusy(true);
    try {
      await onChange(comment.id, status);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <div>
        <div className="flex flex-wrap items-baseline gap-2 mb-2 text-xs text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text-primary)]">{comment.authorName}</span>
          {comment.authorEmail && <span>· {comment.authorEmail}</span>}
          <span>·</span>
          <span>{new Date(comment.createdAt).toLocaleString()}</span>
          <span>·</span>
          <Link
            href={`/articles/${comment.post.topic}/${comment.post.slug}`}
            target="_blank"
            className="text-[var(--color-primary)] hover:underline"
          >
            {comment.post.title}
          </Link>
        </div>
        <p className="text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        {scores?.summary && (
          <p className="mt-3 text-sm italic text-[var(--color-text-secondary)]">
            “{scores.summary}”
          </p>
        )}
        {scores?.decisionReason && (
          <p className="mt-2 text-xs text-[var(--color-accent)]">Reason: {scores.decisionReason}</p>
        )}
        {!scores && comment.moderationModel === "error" && (
          <p className="mt-2 text-xs text-[var(--color-secondary-light)]">
            Held — moderation service unavailable when this comment was submitted (fail-open).
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:w-72">
        {scores && (
          <div className="space-y-1.5">
            <ScoreBar label="Spam" value={scores.spam} />
            <ScoreBar label="Toxic" value={scores.toxicity} />
            <ScoreBar label="OffTop" value={scores.offTopic} />
            <ScoreBar label="PII" value={scores.pii} />
          </div>
        )}
        <div className="flex gap-2">
          {comment.moderationStatus !== "approved" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => act("approved")}
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30 hover:bg-[var(--color-success)]/20 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {comment.moderationStatus !== "rejected" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowReason((s) => !s)}
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-secondary)]/10 text-[var(--color-secondary-light)] border border-[var(--color-secondary)]/30 hover:bg-[var(--color-secondary)]/20 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              Reject
            </button>
          )}
          {comment.moderationStatus !== "held" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => act("held")}
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/20 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              Hold
            </button>
          )}
        </div>
        {showReason && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Optional reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)]"
            />
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                await fetch(`/api/admin/comments/${comment.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    moderationStatus: "rejected",
                    reason: reason || undefined,
                  }),
                });
                setShowReason(false);
                setReason("");
                await onChange(comment.id, "rejected");
              }}
              className="px-3 py-2 rounded-lg bg-[var(--color-secondary)] text-white text-sm font-semibold disabled:opacity-50"
            >
              Confirm reject
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

interface PageProps {
  initialTab: Tab;
}

export default function AdminCommentsPage({ initialTab }: PageProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [items, setItems] = useState<CommentRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (which: Tab, append = false, cur?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ tab: which });
      if (cur) qs.set("cursor", cur);
      const res = await fetch(`/api/admin/comments?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as FetchResult;
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const switchTab = (next: Tab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url.toString());
  };

  const handleAction = useCallback(async (id: string, nextStatus: Tab) => {
    // PATCH first; on success, drop the row from the current view
    // because it has just left this tab.
    const res = await fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moderationStatus: nextStatus }),
    });
    if (!res.ok) {
      setError(`Failed to update comment: HTTP ${res.status}`);
      return;
    }
    setItems((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <AdminLayout title="Comments">
      <div className="flex gap-2 mb-8 border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`px-4 py-2 -mb-px border-b-2 transition-colors text-sm font-semibold capitalize ${
              tab === t
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="mb-6 text-sm text-[var(--color-secondary-light)]">{error}</p>}

      {loading && items.length === 0 && <p className="text-[var(--color-text-muted)]">Loading…</p>}

      {!loading && items.length === 0 && (
        <p className="text-[var(--color-text-muted)]">No {tab} comments.</p>
      )}

      <div className="space-y-4">
        {items.map((c) => (
          <CommentCard key={c.id} comment={c} onChange={handleAction} />
        ))}
      </div>

      {cursor && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => load(tab, true, cursor)}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </AdminLayout>
  );
}

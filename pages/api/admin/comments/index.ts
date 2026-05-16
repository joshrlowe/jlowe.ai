/**
 * GET /api/admin/comments?tab=held|approved|rejected&cursor=&limit=
 *
 * Backs the admin moderation review page. Returns the rows for the
 * current tab, ordered by submission time (newest first), keyset-
 * paginated by cursor (the last id of the previous page).
 *
 * 50 rows per page; max 100. Auth required via withAuth.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import prisma from "../../../../lib/prisma";
import { createApiHandler } from "../../../../lib/utils/apiRouteHandler";
import { withAuth } from "../../../../lib/utils/authMiddleware";

const VALID_TABS = ["held", "approved", "rejected"] as const;
type ValidTab = (typeof VALID_TABS)[number];

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const parseLimit = (raw: unknown): number => {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
};

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const tabRaw = (req.query.tab as string | undefined) ?? "held";
  if (!VALID_TABS.includes(tabRaw as ValidTab)) {
    return res.status(400).json({ message: "Invalid tab" });
  }
  const tab = tabRaw as ValidTab;
  const limit = parseLimit(req.query.limit);
  const cursor =
    typeof req.query.cursor === "string" && req.query.cursor.length > 0
      ? req.query.cursor
      : undefined;

  const where: Prisma.CommentWhereInput = { moderationStatus: tab };

  const rows = await prisma.comment.findMany({
    where,
    orderBy: [{ moderatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      post: { select: { id: true, title: true, slug: true, topic: true } },
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  res.json({ tab, items, nextCursor });
};

export default withAuth(createApiHandler({ GET: handleGet }));

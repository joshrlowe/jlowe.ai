/**
 * PATCH /api/admin/comments/[id]
 *
 * Reviewer action on a held comment (or any comment): flip the
 * moderationStatus, mirror the legacy `approved` boolean, stamp
 * `moderatedAt`, and write an ActivityLog row so the audit trail is
 * preserved.
 *
 * Auth required via withAuth.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { createApiHandler } from "../../../../lib/utils/apiRouteHandler";
import { withAuth, getUserIdFromToken } from "../../../../lib/utils/authMiddleware";
import { logActivity } from "../../../../lib/utils/activityLogger";
import type { JWT } from "next-auth/jwt";

const VALID_STATUSES = ["approved", "held", "rejected"] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

const handlePatch = async (req: NextApiRequest, res: NextApiResponse, ...args: unknown[]) => {
  // createApiHandler forwards extra args from the wrapper; withAuth puts
  // the JWT here. Type signatures in lib/utils/apiRouteHandler keep the
  // generic `unknown[]` shape so we narrow on use.
  const token = args[0] as JWT;
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ message: "Missing comment id" });

  const { moderationStatus, reason } = (req.body ?? {}) as {
    moderationStatus?: string;
    reason?: string;
  };

  if (!moderationStatus || !VALID_STATUSES.includes(moderationStatus as ValidStatus)) {
    return res.status(400).json({
      message: `moderationStatus must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  const status = moderationStatus as ValidStatus;

  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { id: true, postId: true, moderationStatus: true },
  });
  if (!existing) {
    return res.status(404).json({ message: "Comment not found" });
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: {
      moderationStatus: status,
      approved: status === "approved",
      moderatedAt: new Date(),
    },
  });

  await logActivity({
    userId: getUserIdFromToken(token),
    entityType: "Comment",
    entityId: id,
    action: "moderation_change",
    field: "moderationStatus",
    oldValue: { value: existing.moderationStatus },
    newValue: { value: status },
    description: reason ?? null,
    metadata: { postId: existing.postId, reason: reason ?? null },
  });

  res.json({ id: updated.id, moderationStatus: updated.moderationStatus });
};

export default withAuth(createApiHandler({ PATCH: handlePatch }));

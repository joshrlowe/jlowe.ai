import prisma from "../prisma";
import { Prisma } from "@prisma/client";

interface ActivityLogEntry {
  userId?: string | null;
  entityType: string;
  entityId: string;
  projectId?: string | null;
  action: string;
  field?: string | null;
  oldValue?: Prisma.InputJsonValue | string | null;
  newValue?: Prisma.InputJsonValue | string | null;
  description?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

function toJsonField(
  value: Prisma.InputJsonValue | string | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (!value) return Prisma.JsonNull;
  if (typeof value === "object") return value;
  return { value };
}

/**
 * Log an activity/change to the activity log
 */
export async function logActivity({
  userId,
  entityType,
  entityId,
  projectId,
  action,
  field,
  oldValue,
  newValue,
  description,
  metadata,
}: ActivityLogEntry): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        entityType,
        entityId,
        projectId: projectId || null,
        action,
        field: field || null,
        oldValue: toJsonField(oldValue),
        newValue: toJsonField(newValue),
        description: description || null,
        metadata: metadata ? metadata : Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}

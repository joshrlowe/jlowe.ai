import prisma from "../prisma.js";

/**
 * Log an activity/change to the activity log
 */
export async function logActivity({ userId, entityType, entityId, projectId, action, field, oldValue, newValue, description, metadata }) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        entityType,
        entityId,
        projectId: projectId || null,
        action,
        field: field || null,
        oldValue: oldValue ? (typeof oldValue === "object" ? oldValue : { value: oldValue }) : null,
        newValue: newValue ? (typeof newValue === "object" ? newValue : { value: newValue }) : null,
        description: description || null,
        metadata: metadata || null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}


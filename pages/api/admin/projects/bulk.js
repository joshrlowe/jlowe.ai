import { getToken } from "next-auth/jwt";
import prisma from "../../../../lib/prisma.js";
import { handleApiError } from "../../../../lib/utils/apiErrorHandler.js";
import { mapProjectStatus } from "../../../../lib/utils/projectStatusMapper.js";
import { logActivity } from "../../../../lib/utils/activityLogger.js";

export default async function handler(req, res) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { action, projectIds, data } = req.body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({ message: "No projects selected" });
    }

    const userId = token.email || "unknown";

    switch (action) {
      case "delete":
        await prisma.project.deleteMany({
          where: { id: { in: projectIds } },
        });
        // Log activity for each project
        for (const projectId of projectIds) {
          await logActivity({
            userId,
            entityType: "Project",
            entityId: projectId,
            projectId,
            action: "delete",
            description: "Bulk deleted project",
          });
        }
        return res.json({ message: `${projectIds.length} project(s) deleted successfully` });

      case "updateStatus":
        if (!data?.status) {
          return res.status(400).json({ message: "Status is required" });
        }
        const mappedStatus = mapProjectStatus(data.status);
        await prisma.project.updateMany({
          where: { id: { in: projectIds } },
          data: { status: mappedStatus },
        });
        // Log activity for each project
        for (const projectId of projectIds) {
          await logActivity({
            userId,
            entityType: "Project",
            entityId: projectId,
            projectId,
            action: "status_change",
            field: "status",
            newValue: { value: data.status },
            description: `Bulk status changed to ${data.status}`,
          });
        }
        return res.json({ message: `${projectIds.length} project(s) updated successfully` });

      case "updateFeatured":
        if (data?.featured === undefined) {
          return res.status(400).json({ message: "Featured value is required" });
        }
        await prisma.project.updateMany({
          where: { id: { in: projectIds } },
          data: { featured: data.featured },
        });
        // Log activity for each project
        for (const projectId of projectIds) {
          await logActivity({
            userId,
            entityType: "Project",
            entityId: projectId,
            projectId,
            action: "update",
            field: "featured",
            newValue: { value: data.featured },
            description: `Bulk featured set to ${data.featured}`,
          });
        }
        return res.json({ message: `${projectIds.length} project(s) updated successfully` });

      default:
        return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    handleApiError(error, res);
  }
}


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

  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: { teamMembers: true },
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      handleApiError(error, res);
    }
  } else if (req.method === "PUT") {
    try {
      // Get existing project to compare changes
      const existingProject = await prisma.project.findUnique({ where: { id } });
      if (!existingProject) {
        return res.status(404).json({ message: "Project not found" });
      }

      const {
        title,
        slug,
        shortDescription,
        longDescription,
        tags,
        techStack,
        links,
        images,
        featured,
        status,
        startDate,
        releaseDate,
        metaTitle,
        metaDescription,
        ogImage,
        teamMembers,
      } = req.body;

      const userId = token.email || "unknown";
      const mappedStatus = status ? mapProjectStatus(status) : undefined;

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (slug !== undefined) updateData.slug = slug;
      if (shortDescription !== undefined) {
        updateData.shortDescription = shortDescription;
        updateData.description = shortDescription; // Legacy field
      }
      if (longDescription !== undefined) updateData.longDescription = longDescription;
      if (tags !== undefined) updateData.tags = tags;
      if (techStack !== undefined) updateData.techStack = techStack;
      if (links !== undefined) updateData.links = links;
      if (images !== undefined) updateData.images = images;
      if (featured !== undefined) updateData.featured = featured;
      if (mappedStatus !== undefined) updateData.status = mappedStatus;
      if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : new Date();
      if (releaseDate !== undefined) updateData.releaseDate = releaseDate ? new Date(releaseDate) : null;
      if (metaTitle !== undefined) updateData.metaTitle = metaTitle || null;
      if (metaDescription !== undefined) updateData.metaDescription = metaDescription || null;
      if (ogImage !== undefined) updateData.ogImage = ogImage || null;

      const project = await prisma.project.update({
        where: { id },
        data: updateData,
        include: { teamMembers: true },
      });

      // Update team members if provided
      if (teamMembers !== undefined) {
        // Delete existing team members
        await prisma.projectTeamMember.deleteMany({ where: { projectId: id } });
        // Create new team members
        if (Array.isArray(teamMembers) && teamMembers.length > 0) {
          await prisma.projectTeamMember.createMany({
            data: teamMembers.map((member) => ({
              projectId: id,
              name: member.name,
              email: member.email || null,
            })),
          });
        }
      }

      // Log activity
      await logActivity({
        userId,
        entityType: "Project",
        entityId: id,
        projectId: id,
        action: "update",
        description: `Project "${project.title}" updated`,
      });

      const updatedProject = await prisma.project.findUnique({
        where: { id },
        include: { teamMembers: true },
      });

      res.json(updatedProject);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({ message: "A project with this slug already exists" });
      }
      handleApiError(error, res);
    }
  } else if (req.method === "DELETE") {
    try {
      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      await prisma.project.delete({
        where: { id },
      });

      // Log activity
      const userId = token.email || "unknown";
      await logActivity({
        userId,
        entityType: "Project",
        entityId: id,
        projectId: id,
        action: "delete",
        description: `Project "${project.title}" deleted`,
      });

      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      handleApiError(error, res);
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}


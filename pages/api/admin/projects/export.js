import prisma from "../../../../lib/prisma.js";
import { handleApiError } from "../../../../lib/utils/apiErrorHandler.js";
import { withAuth } from "../../../../lib/utils/authMiddleware.js";

async function handler(req, res, _token) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { format = "json" } = req.query;

    const projects = await prisma.project.findMany({
      include: { teamMembers: true },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      // Convert to CSV
      const headers = [
        "Title",
        "Slug",
        "Short Description",
        "Status",
        "Featured",
        "Start Date",
        "Release Date",
        "Tags",
        "Tech Stack",
        "GitHub Link",
        "Live Link",
      ];

      const rows = projects.map((project) => {
        const tags = Array.isArray(project.tags) ? project.tags.join("; ") : "";
        const techStack = Array.isArray(project.techStack)
          ? project.techStack.join("; ")
          : "";
        const links =
          project.links && typeof project.links === "object"
            ? project.links
            : {};
        const startDate = project.startDate
          ? new Date(project.startDate).toISOString().split("T")[0]
          : "";
        const releaseDate = project.releaseDate
          ? new Date(project.releaseDate).toISOString().split("T")[0]
          : "";

        return [
          project.title || "",
          project.slug || "",
          (project.shortDescription || "").replace(/\n/g, " "),
          project.status || "",
          project.featured ? "Yes" : "No",
          startDate,
          releaseDate,
          tags,
          techStack,
          links.github || "",
          links.live || "",
        ];
      });

      const csvContent = [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="projects-${new Date().toISOString().split("T")[0]}.csv"`,
      );
      return res.send(csvContent);
    } else {
      // JSON format
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="projects-${new Date().toISOString().split("T")[0]}.json"`,
      );
      return res.json(projects);
    }
  } catch (error) {
    handleApiError(error, res);
  }
}

export default withAuth(handler);

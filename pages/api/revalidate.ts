/**
 * On-demand ISR Revalidation API
 *
 * Triggers page regeneration for statically generated pages
 * when content is updated via the admin panel.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import type { JWT } from "next-auth/jwt";
import { withAuth } from "../../lib/utils/authMiddleware";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  _token: JWT,
): Promise<void> {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const { path } = req.body;

  if (!path) {
    res.status(400).json({ message: "Path is required" });
    return;
  }

  try {
    // Revalidate the specified path
    await res.revalidate(path);

    // Also revalidate related pages
    const pathsToRevalidate: string[] = [path];

    // If revalidating a specific article, also revalidate the articles index
    if (path.startsWith("/articles/") && path !== "/articles") {
      pathsToRevalidate.push("/articles");
    }

    // Revalidate home page as it shows recent articles
    if (path.includes("/articles")) {
      pathsToRevalidate.push("/");
    }

    // Revalidate all paths
    for (const p of pathsToRevalidate) {
      try {
        await res.revalidate(p);
      } catch (e) {
        console.warn(`Failed to revalidate ${p}:`, (e as Error).message);
      }
    }

    res.json({
      revalidated: true,
      paths: pathsToRevalidate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    res.status(500).json({
      message: "Error revalidating",
      error: (error as Error).message,
    });
  }
}

export default withAuth(handler);

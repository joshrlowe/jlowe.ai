/**
 * On-demand ISR Revalidation API
 * 
 * Triggers page regeneration for statically generated pages
 * when content is updated via the admin panel.
 */

import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Check authentication
  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { path } = req.body;

  if (!path) {
    return res.status(400).json({ message: "Path is required" });
  }

  try {
    // Revalidate the specified path
    await res.revalidate(path);
    
    // Also revalidate related pages
    const pathsToRevalidate = [path];
    
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
        // Ignore errors for individual paths
        console.warn(`Failed to revalidate ${p}:`, e.message);
      }
    }

    return res.json({ 
      revalidated: true, 
      paths: pathsToRevalidate,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return res.status(500).json({ 
      message: "Error revalidating", 
      error: error.message 
    });
  }
}


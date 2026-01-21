import { put } from "@vercel/blob";
import { withAuth } from "../../../lib/utils/authMiddleware.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

async function handler(req, res, _token) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { file, filename, type } = req.body;

    if (!file || !filename) {
      return res.status(400).json({ message: "File and filename are required" });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid file type" });
    }

    // Generate unique filename
    const ext = filename.substring(filename.lastIndexOf("."));
    const baseName = filename.substring(0, filename.lastIndexOf("."));
    const uniqueName = `${baseName}-${Date.now()}${ext}`;

    // Decode base64 to buffer
    const base64Data = file.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Upload to Vercel Blob
    const blob = await put(uniqueName, buffer, {
      access: "public",
      contentType: type || "application/octet-stream",
    });

    // Return the Vercel Blob CDN URL
    res.status(200).json({ url: blob.url, filename: uniqueName });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Failed to upload file" });
  }
}

export default withAuth(handler);

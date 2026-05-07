import type { NextApiRequest, NextApiResponse } from "next";
import type { JWT } from "next-auth/jwt";
import { put } from "@vercel/blob";
import { withAuth } from "../../../lib/utils/authMiddleware";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse, _token: JWT) {
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
    if (type && !allowedTypes.includes(type as string)) {
      return res.status(400).json({ message: "Invalid file type" });
    }

    // Generate unique filename
    const ext = (filename as string).substring((filename as string).lastIndexOf("."));
    const baseName = (filename as string).substring(0, (filename as string).lastIndexOf("."));
    const uniqueName = `${baseName}-${Date.now()}${ext}`;

    // Decode base64 to buffer
    const base64Data = (file as string).replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Upload to Vercel Blob
    const blob = await put(uniqueName, buffer, {
      access: "public",
      contentType: (type as string) || "application/octet-stream",
    });

    // Return the Vercel Blob CDN URL
    res.status(200).json({ url: blob.url, filename: uniqueName });
  } catch (error) {
    console.error("Upload error:", error as Error);
    res.status(500).json({ message: "Failed to upload file" });
  }
}

export default withAuth(handler);

import { writeFile, mkdir } from "fs/promises";
import path from "path";
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);
    const uniqueName = `${baseName}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    // Decode base64 and write file
    const base64Data = file.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${uniqueName}`;

    res.status(200).json({ url: publicUrl, filename: uniqueName });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Failed to upload file" });
  }
}

export default withAuth(handler);

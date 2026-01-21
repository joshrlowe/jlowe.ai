/**
 * MediaUpload - Shared component for uploading images/videos
 *
 * Supports both file upload (to Vercel Blob) and URL input.
 * Used across admin pages for cover images, background images, etc.
 */

import { useState, useRef } from "react";
import { toast } from "react-toastify";

// Helper to extract YouTube video ID
function getYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : "";
}

export default function MediaUpload({
  label,
  value,
  onChange,
  accept = "image/jpeg,image/png,image/gif,image/webp",
  type = "image",
  placeholder,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [inputMode, setInputMode] = useState(value ? "url" : "upload");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const response = await fetch("/api/admin/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: reader.result,
              filename: file.name,
              type: file.type,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            onChange(data.url);
            toast.success("File uploaded successfully!");
          } else {
            toast.error(data.message || "Upload failed");
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast.error("Failed to upload file");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File read error:", error);
      toast.error("Failed to read file");
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInputMode("upload")}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              inputMode === "upload"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-bg-darker)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setInputMode("url")}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              inputMode === "url"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-bg-darker)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {inputMode === "upload" ? (
        <div>
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              uploading
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-darker)]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[var(--color-text-muted)]">
                  Uploading...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="w-10 h-10 text-[var(--color-text-muted)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div>
                  <span className="text-[var(--color-primary)] font-medium">
                    Click to upload
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    {" "}or drag and drop
                  </span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {type === "image"
                    ? "PNG, JPG, GIF, WebP up to 10MB"
                    : "MP4, WebM up to 10MB"}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
          placeholder={
            placeholder ||
            (type === "image"
              ? "https://example.com/image.jpg"
              : "https://youtube.com/watch?v=...")
          }
        />
      )}

      {/* Preview */}
      {value && (
        <div className="relative">
          {type === "image" ? (
            <div className="relative rounded-lg overflow-hidden bg-[var(--color-bg-darker)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Preview"
                className="max-h-48 w-auto mx-auto object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-[var(--color-bg-darker)] aspect-video">
              {value.includes("youtube.com") || value.includes("youtu.be") ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(value)}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={value}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}


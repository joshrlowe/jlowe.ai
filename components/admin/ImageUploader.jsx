/**
 * ImageUploader - Multi-image upload component for project galleries
 *
 * Supports both file upload (to Vercel Blob) and URL input.
 * Manages a collection of images with add/remove functionality.
 */

import { useState, useRef } from "react";
import { toast } from "react-toastify";

export default function ImageUploader({
  images = [],
  onChange,
  maxImages = 10,
  label = "Project Images",
}) {
  const [newUrl, setNewUrl] = useState("");
  const [inputMode, setInputMode] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const addImageFromUrl = () => {
    if (newUrl.trim() && images.length < maxImages) {
      onChange([...images, newUrl.trim()]);
      setNewUrl("");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, GIF, and WebP images are allowed");
      return;
    }

    setUploading(true);

    try {
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
            onChange([...images, data.url]);
            toast.success("Image uploaded successfully!");
          } else {
            toast.error(data.message || "Upload failed");
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast.error("Failed to upload image");
        } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File read error:", error);
      toast.error("Failed to read file");
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const isMaxReached = images.length >= maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[var(--color-text-primary)]">
          {label} ({images.length}/{maxImages})
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
        <div
          onClick={() => !uploading && !isMaxReached && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isMaxReached
              ? "border-[var(--color-border)] opacity-50 cursor-not-allowed"
              : uploading
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 cursor-wait"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-darker)] cursor-pointer"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={isMaxReached || uploading}
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
                {isMaxReached
                  ? "Maximum images reached"
                  : "PNG, JPG, GIF, WebP up to 10MB"}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addImageFromUrl())
            }
            placeholder="Enter image URL..."
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
            disabled={isMaxReached}
          />
          <button
            type="button"
            onClick={addImageFromUrl}
            disabled={isMaxReached || !newUrl.trim()}
            className="px-4 py-2 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, index) => {
            const imgUrl = typeof img === "string" ? img : img.url || img.src;
            return (
              <div key={index} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={`Project image ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-[var(--color-border)]"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <svg
                    className="w-3 h-3"
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
            );
          })}
        </div>
      )}
    </div>
  );
}

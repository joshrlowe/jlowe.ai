import { useState } from "react";

export default function ImageUploader({
  images = [],
  onChange,
  maxImages = 10,
}) {
  const [newUrl, setNewUrl] = useState("");

  const addImage = () => {
    if (newUrl.trim() && images.length < maxImages) {
      onChange([...images, newUrl.trim()]);
      setNewUrl("");
    }
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
        Project Images ({images.length}/{maxImages})
      </label>

      <div className="flex gap-2 mb-4">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), addImage())
          }
          placeholder="Enter image URL..."
          className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
          disabled={images.length >= maxImages}
        />
        <button
          type="button"
          onClick={addImage}
          disabled={images.length >= maxImages || !newUrl.trim()}
          className="px-4 py-2 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, index) => {
            const imgUrl = typeof img === "string" ? img : img.url || img.src;
            return (
              <div key={index} className="relative group">
                <img
                  src={imgUrl}
                  alt={`Project image ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-[var(--color-border)]"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

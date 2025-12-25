import { useState, useRef } from "react";
import { Button, Form } from "react-bootstrap";
import { useToast } from "./ToastProvider";

export default function ImageUploader({ images = [], onChange, maxImages = 10 }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > maxImages) {
      showToast(`Maximum ${maxImages} images allowed`, "error");
      return;
    }

    setUploading(true);
    
    // For now, we'll just use URLs (you can implement actual file upload later)
    // This is a placeholder that allows users to enter image URLs
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      type: "file",
    }));

    onChange([...images, ...newImages]);
    setUploading(false);
    showToast("Images added (URL mode - implement actual upload)", "info");
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    showToast("Image removed", "success");
  };

  const addImageUrl = () => {
    const url = prompt("Enter image URL:");
    if (url && url.trim()) {
      if (images.length >= maxImages) {
        showToast(`Maximum ${maxImages} images allowed`, "error");
        return;
      }
      onChange([...images, { url: url.trim(), type: "url" }]);
      showToast("Image URL added", "success");
    }
  };

  return (
    <div>
      <Form.Label className="fw-semibold">Project Images</Form.Label>
      <div className="d-flex gap-2 mb-3">
        <Button
          type="button"
          variant="outline-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
        >
          {uploading ? "Uploading..." : "Upload Images"}
        </Button>
        <Button type="button" variant="outline-secondary" onClick={addImageUrl} disabled={images.length >= maxImages}>
          Add URL
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>
      
      {images.length > 0 && (
        <div className="d-flex flex-wrap gap-3">
          {images.map((image, index) => (
            <div key={index} style={{ position: "relative", width: "150px" }}>
              <img
                src={image.url}
                alt={image.name || `Image ${index + 1}`}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                }}
                onError={(e) => {
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%232c2c2c' width='150' height='150'/%3E%3Ctext fill='%23ffffff' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EInvalid Image%3C/text%3E%3C/svg%3E";
                }}
              />
              <button
                type="button"
                className="btn btn-sm btn-danger"
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                }}
                onClick={() => removeImage(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <Form.Text className="text-muted">
        {images.length}/{maxImages} images ({images.filter((i) => i.type === "file").length} uploaded, {images.filter((i) => i.type === "url").length} URLs)
      </Form.Text>
    </div>
  );
}


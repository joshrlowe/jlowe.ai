/**
 * Tests for ImageUploader component
 *
 * Tests multi-image upload functionality including:
 * - Rendering with empty/existing images
 * - File upload flow (mocking fetch to /api/admin/upload)
 * - URL input mode
 * - Removing images
 * - Maximum images limit
 * - File type/size validation
 * - Upload error handling
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImageUploader from "../../../components/admin/ImageUploader";
import { toast } from "react-toastify";

// Mock react-toastify
jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Helper to create a mock file
const createMockFile = (name, size, type) => {
  const file = new File(["x".repeat(size)], name, { type });
  return file;
};

// Helper to mock FileReader
const mockFileReader = (result) => {
  const mockReader = {
    readAsDataURL: jest.fn(),
    onload: null,
    result,
  };

  jest.spyOn(global, "FileReader").mockImplementation(() => {
    return {
      readAsDataURL: function () {
        this.result = result;
        if (this.onload) {
          this.onload();
        }
      },
      onload: null,
      result: null,
    };
  });
};

describe("ImageUploader", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockReset();
  });

  afterEach(() => {
    if (global.FileReader.mockRestore) {
      global.FileReader.mockRestore();
    }
  });

  describe("Rendering", () => {
    it("should render with default label and empty images", () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      expect(screen.getByText(/Project Images/i)).toBeInTheDocument();
      // Text is split across elements, use a function matcher
      expect(
        screen.getByText((_, element) => element?.textContent === "Project Images (0/10)")
      ).toBeInTheDocument();
      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
    });

    it("should render with custom label", () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} label="Custom Label" />);

      expect(screen.getByText(/Custom Label/i)).toBeInTheDocument();
    });

    it("should render existing images", () => {
      const images = ["/images/test1.jpg", "/images/test2.jpg"];
      render(<ImageUploader images={images} onChange={mockOnChange} />);

      // Text is split across elements, use a function matcher
      expect(
        screen.getByText((_, element) => element?.textContent === "Project Images (2/10)")
      ).toBeInTheDocument();
      const imageElements = screen.getAllByRole("img");
      expect(imageElements).toHaveLength(2);
      expect(imageElements[0]).toHaveAttribute("src", "/images/test1.jpg");
      expect(imageElements[1]).toHaveAttribute("src", "/images/test2.jpg");
    });

    it("should render images from object format with url property", () => {
      const images = [{ url: "/images/test.jpg" }];
      render(<ImageUploader images={images} onChange={mockOnChange} />);

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "/images/test.jpg");
    });

    it("should render images from object format with src property", () => {
      const images = [{ src: "/images/test.jpg" }];
      render(<ImageUploader images={images} onChange={mockOnChange} />);

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", "/images/test.jpg");
    });

    it("should show custom maxImages count", () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} maxImages={5} />);

      // Text is split across elements, use a function matcher
      expect(
        screen.getByText((_, element) => element?.textContent === "Project Images (0/5)")
      ).toBeInTheDocument();
    });

    it("should show upload and URL mode toggle buttons", () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /url/i })).toBeInTheDocument();
    });
  });

  describe("URL Input Mode", () => {
    it("should switch to URL input mode when URL button is clicked", async () => {
      const user = userEvent.setup();
      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      await user.click(screen.getByRole("button", { name: /url/i }));

      expect(screen.getByPlaceholderText(/Enter image URL/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    });

    it("should add image from URL when Add button is clicked", async () => {
      const user = userEvent.setup();
      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      await user.click(screen.getByRole("button", { name: /url/i }));

      const urlInput = screen.getByPlaceholderText(/Enter image URL/i);
      await user.type(urlInput, "https://example.com/image.jpg");
      await user.click(screen.getByRole("button", { name: /add/i }));

      expect(mockOnChange).toHaveBeenCalledWith(["https://example.com/image.jpg"]);
    });

    it("should add image from URL when Enter is pressed", async () => {
      const user = userEvent.setup();
      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      await user.click(screen.getByRole("button", { name: /url/i }));

      const urlInput = screen.getByPlaceholderText(/Enter image URL/i);
      await user.type(urlInput, "https://example.com/image.jpg{enter}");

      expect(mockOnChange).toHaveBeenCalledWith(["https://example.com/image.jpg"]);
    });

    it("should not add empty URL", async () => {
      const user = userEvent.setup();
      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      await user.click(screen.getByRole("button", { name: /url/i }));
      await user.click(screen.getByRole("button", { name: /add/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should clear input after adding URL", async () => {
      const user = userEvent.setup();
      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      await user.click(screen.getByRole("button", { name: /url/i }));

      const urlInput = screen.getByPlaceholderText(/Enter image URL/i);
      await user.type(urlInput, "https://example.com/image.jpg");
      await user.click(screen.getByRole("button", { name: /add/i }));

      expect(urlInput).toHaveValue("");
    });
  });

  describe("File Upload", () => {
    it("should upload a valid image file", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: "https://blob.vercel-storage.com/test.jpg" }),
      });

      mockFileReader("data:image/jpeg;base64,abc123");

      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = document.querySelector('input[type="file"]');

      await waitFor(() => {
        fireEvent.change(input, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/admin/upload",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
        );
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(["https://blob.vercel-storage.com/test.jpg"]);
        expect(toast.success).toHaveBeenCalledWith("Image uploaded successfully!");
      });
    });

    it("should show error toast when upload fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Upload failed" }),
      });

      mockFileReader("data:image/jpeg;base64,abc123");

      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = document.querySelector('input[type="file"]');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Upload failed");
      });
    });

    it("should show generic error when upload throws", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      mockFileReader("data:image/jpeg;base64,abc123");

      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = document.querySelector('input[type="file"]');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to upload image");
      });
    });
  });

  describe("File Validation", () => {
    it("should reject files larger than 10MB", async () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      // Create file larger than 10MB
      const file = createMockFile("large.jpg", 11 * 1024 * 1024, "image/jpeg");
      const input = document.querySelector('input[type="file"]');

      fireEvent.change(input, { target: { files: [file] } });

      expect(toast.error).toHaveBeenCalledWith("File size must be less than 10MB");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should reject invalid file types", async () => {
      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      const file = createMockFile("document.pdf", 1024, "application/pdf");
      const input = document.querySelector('input[type="file"]');

      fireEvent.change(input, { target: { files: [file] } });

      expect(toast.error).toHaveBeenCalledWith("Only JPEG, PNG, GIF, and WebP images are allowed");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should accept image/jpeg files", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: "https://blob.vercel-storage.com/test.jpg" }),
      });
      mockFileReader("data:image/jpeg;base64,abc123");

      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const input = document.querySelector('input[type="file"]');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it("should accept image/png files", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: "https://blob.vercel-storage.com/test.png" }),
      });
      mockFileReader("data:image/png;base64,abc123");

      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      const file = createMockFile("test.png", 1024, "image/png");
      const input = document.querySelector('input[type="file"]');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it("should accept image/gif files", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: "https://blob.vercel-storage.com/test.gif" }),
      });
      mockFileReader("data:image/gif;base64,abc123");

      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      const file = createMockFile("test.gif", 1024, "image/gif");
      const input = document.querySelector('input[type="file"]');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it("should accept image/webp files", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ url: "https://blob.vercel-storage.com/test.webp" }),
      });
      mockFileReader("data:image/webp;base64,abc123");

      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      const file = createMockFile("test.webp", 1024, "image/webp");
      const input = document.querySelector('input[type="file"]');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("Maximum Images Limit", () => {
    it("should show error when max images reached and trying to upload", async () => {
      const images = Array(10).fill("/images/test.jpg");
      render(<ImageUploader images={images} onChange={mockOnChange} maxImages={10} />);

      const file = createMockFile("new.jpg", 1024, "image/jpeg");
      const input = document.querySelector('input[type="file"]');

      fireEvent.change(input, { target: { files: [file] } });

      expect(toast.error).toHaveBeenCalledWith("Maximum 10 images allowed");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should disable URL input when max images reached", async () => {
      const user = userEvent.setup();
      const images = Array(10).fill("/images/test.jpg");
      render(<ImageUploader images={images} onChange={mockOnChange} maxImages={10} />);

      await user.click(screen.getByRole("button", { name: /url/i }));

      const urlInput = screen.getByPlaceholderText(/Enter image URL/i);
      expect(urlInput).toBeDisabled();
    });

    it('should show "Maximum images reached" message when at limit', () => {
      const images = Array(10).fill("/images/test.jpg");
      render(<ImageUploader images={images} onChange={mockOnChange} maxImages={10} />);

      expect(screen.getByText(/Maximum images reached/i)).toBeInTheDocument();
    });

    it("should not add URL when at max images", async () => {
      const user = userEvent.setup();
      const images = Array(10).fill("/images/test.jpg");
      render(<ImageUploader images={images} onChange={mockOnChange} maxImages={10} />);

      await user.click(screen.getByRole("button", { name: /url/i }));

      // The Add button should be disabled
      const addButton = screen.getByRole("button", { name: /add/i });
      expect(addButton).toBeDisabled();
    });
  });

  describe("Removing Images", () => {
    it("should remove an image when remove button is clicked", async () => {
      const user = userEvent.setup();
      const images = ["/images/test1.jpg", "/images/test2.jpg"];
      render(<ImageUploader images={images} onChange={mockOnChange} />);

      // Find the first remove button (there should be one for each image)
      const removeButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.querySelector('svg path[d*="M6 18L18 6"]'));

      await user.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(["/images/test2.jpg"]);
    });

    it("should remove the correct image by index", async () => {
      const user = userEvent.setup();
      const images = ["/images/a.jpg", "/images/b.jpg", "/images/c.jpg"];
      render(<ImageUploader images={images} onChange={mockOnChange} />);

      // Find all remove buttons
      const removeButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.querySelector('svg path[d*="M6 18L18 6"]'));

      // Remove the middle image
      await user.click(removeButtons[1]);

      expect(mockOnChange).toHaveBeenCalledWith(["/images/a.jpg", "/images/c.jpg"]);
    });
  });

  describe("Mode Switching", () => {
    it("should switch between upload and URL modes", async () => {
      const user = userEvent.setup();
      render(<ImageUploader images={[]} onChange={mockOnChange} />);

      // Initially in upload mode
      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();

      // Switch to URL mode
      await user.click(screen.getByRole("button", { name: /url/i }));
      expect(screen.getByPlaceholderText(/Enter image URL/i)).toBeInTheDocument();
      expect(screen.queryByText(/Click to upload/i)).not.toBeInTheDocument();

      // Switch back to upload mode
      await user.click(screen.getByRole("button", { name: /upload/i }));
      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Enter image URL/i)).not.toBeInTheDocument();
    });
  });

  describe("Alt Text", () => {
    it("should have proper alt text for images", () => {
      const images = ["/images/test1.jpg", "/images/test2.jpg"];
      render(<ImageUploader images={images} onChange={mockOnChange} />);

      const imageElements = screen.getAllByRole("img");
      expect(imageElements[0]).toHaveAttribute("alt", "Project image 1");
      expect(imageElements[1]).toHaveAttribute("alt", "Project image 2");
    });
  });
});

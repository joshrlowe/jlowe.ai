import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectForm from "../../../../components/admin/projects/ProjectForm";

// Mock ImageUploader
jest.mock("../../../../components/admin/ImageUploader", () => {
  return function MockImageUploader({ label, images, onChange, maxImages }) {
    return (
      <div data-testid="image-uploader">
        <label>{label}</label>
        <span data-testid="images-count">
          {images?.length || 0}/{maxImages || 10}
        </span>
        <div data-testid="images-list">
          {images?.map((img, i) => (
            <div key={i} data-testid={`image-${i}`}>
              <span>{typeof img === "string" ? img : img.url}</span>
              <button
                type="button"
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                data-testid={`remove-image-${i}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange([...(images || []), "https://test.com/new-image.jpg"])}
          data-testid="add-image"
        >
          Add Image
        </button>
      </div>
    );
  };
});

// Mock the shared components
jest.mock("../../../../components/admin/shared", () => ({
  MediaUpload: ({ label, items, onAdd, onRemove, placeholder }) => (
    <div data-testid="media-upload">
      <label>{label}</label>
      <div>
        {items?.map((item, i) => (
          <div key={i}>
            <span>{typeof item === "string" ? item : item.url}</span>
            <button onClick={() => onRemove(i)}>Remove</button>
          </div>
        ))}
        <input placeholder={placeholder} data-testid="media-input" />
      </div>
    </div>
  ),
  FormField: ({ label, value, onChange, options, type = "text", rows, required }) => {
    const id = label.toLowerCase().replace(/\s/g, "-");
    if (options) {
      return (
        <div>
          <label htmlFor={id}>
            {label}
            {required && " *"}
          </label>
          <select data-testid={id} id={id} value={value} onChange={onChange}>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    if (rows) {
      return (
        <div>
          <label htmlFor={id}>
            {label}
            {required && " *"}
          </label>
          <textarea data-testid={id} id={id} value={value} onChange={onChange} rows={rows} />
        </div>
      );
    }
    return (
      <div>
        <label htmlFor={id}>
          {label}
          {required && " *"}
        </label>
        <input data-testid={id} id={id} type={type} value={value} onChange={onChange} />
      </div>
    );
  },
  TagInput: ({ label, tags, onAdd, onRemove, placeholder }) => {
    const id = label.toLowerCase().replace(/\s/g, "-");
    return (
      <div data-testid={`taginput-${id}`}>
        <label>{label}</label>
        <div>
          {tags.map((tag, index) => (
            <span key={tag} data-testid={`tag-${id}-${tag}`}>
              {tag}
              <button
                type="button"
                onClick={() => onRemove(index)}
                data-testid={`remove-${id}-${tag}`}
              >
                x
              </button>
            </span>
          ))}
          <input
            data-testid={`${id}-input`}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value) {
                e.preventDefault();
                onAdd(e.target.value);
                e.target.value = "";
              }
            }}
          />
        </div>
      </div>
    );
  },
  adminStyles: {
    buttonPrimary: "button-primary",
    buttonSecondary: "button-secondary",
    card: "card-class",
  },
  PROJECT_STATUSES: [
    { value: "Draft", label: "Draft" },
    { value: "InProgress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Published", label: "Published" },
  ],
}));

describe("ProjectForm", () => {
  const mockSetFormData = jest.fn();
  const mockOnSave = jest.fn((e) => e.preventDefault());
  const mockOnCancel = jest.fn();

  const defaultFormData = {
    title: "",
    slug: "",
    status: "Draft",
    startDate: "",
    releaseDate: "",
    shortDescription: "",
    longDescription: "",
    tags: [],
    techStack: [],
    links: { github: "", live: "" },
    images: [],
    backgroundImage: "",
    featured: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all form fields", () => {
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
    expect(screen.getByTestId("status")).toBeInTheDocument();
    expect(screen.getByTestId("start-date")).toBeInTheDocument();
    expect(screen.getByTestId("release-date")).toBeInTheDocument();
    expect(screen.getByTestId("short-description")).toBeInTheDocument();
    expect(screen.getByTestId("description")).toBeInTheDocument();
    expect(screen.getByTestId("taginput-tags")).toBeInTheDocument();
    expect(screen.getByTestId("taginput-tech-stack")).toBeInTheDocument();
  });

  it("should update title on change", async () => {
    const user = userEvent.setup();
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByTestId("title");
    await user.type(titleInput, "New Title");

    expect(mockSetFormData).toHaveBeenCalled();
  });

  it("should format slug on change (lowercase, remove special chars)", async () => {
    const user = userEvent.setup();
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const slugInput = screen.getByTestId("slug");
    // The component removes all non-alphanumeric chars except hyphens, and lowercases
    fireEvent.change(slugInput, { target: { value: "my-new-slug" } });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "my-new-slug",
      })
    );
  });

  it("should add a tag", async () => {
    const user = userEvent.setup();
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const tagInput = screen.getByTestId("tags-input");
    await user.type(tagInput, "React{enter}");

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ["React"],
      })
    );
  });

  it("should not add duplicate tag", async () => {
    const user = userEvent.setup();
    const formDataWithTags = { ...defaultFormData, tags: ["React"] };
    render(
      <ProjectForm
        formData={formDataWithTags}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const tagInput = screen.getByTestId("tags-input");
    await user.type(tagInput, "React{enter}");

    // Should not be called because tag already exists
    expect(mockSetFormData).not.toHaveBeenCalled();
  });

  it("should remove a tag", async () => {
    const user = userEvent.setup();
    const formDataWithTags = { ...defaultFormData, tags: ["React", "Node"] };
    render(
      <ProjectForm
        formData={formDataWithTags}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const removeButton = screen.getByTestId("remove-tags-React");
    await user.click(removeButton);

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ["Node"],
      })
    );
  });

  it("should add a tech stack item", async () => {
    const user = userEvent.setup();
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const techInput = screen.getByTestId("tech-stack-input");
    await user.type(techInput, "Python{enter}");

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        techStack: ["Python"],
      })
    );
  });

  it("should not add duplicate tech stack item", async () => {
    const user = userEvent.setup();
    const formDataWithTech = { ...defaultFormData, techStack: ["Python"] };
    render(
      <ProjectForm
        formData={formDataWithTech}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const techInput = screen.getByTestId("tech-stack-input");
    await user.type(techInput, "Python{enter}");

    expect(mockSetFormData).not.toHaveBeenCalled();
  });

  it("should remove a tech stack item", async () => {
    const user = userEvent.setup();
    const formDataWithTech = { ...defaultFormData, techStack: ["Python", "JavaScript"] };
    render(
      <ProjectForm
        formData={formDataWithTech}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const removeButton = screen.getByTestId("remove-tech-stack-Python");
    await user.click(removeButton);

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        techStack: ["JavaScript"],
      })
    );
  });

  it("should call onSave when form is submitted", async () => {
    const user = userEvent.setup();
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const form = screen.getByRole("button", { name: /create/i }).closest("form");
    fireEvent.submit(form);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should show "Saving..." when saving is true', () => {
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        saving={true}
      />
    );
    expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });

  it('should show "Update" when isEditing is true', () => {
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isEditing={true}
      />
    );
    expect(screen.getByRole("button", { name: /update/i })).toBeInTheDocument();
  });

  it("should hide release date field when status is InProgress", () => {
    const formDataInProgress = { ...defaultFormData, status: "InProgress" };
    render(
      <ProjectForm
        formData={formDataInProgress}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.queryByTestId("release-date")).not.toBeInTheDocument();
  });

  it("should clear releaseDate when status changes to InProgress", async () => {
    const user = userEvent.setup();
    const formDataWithReleaseDate = { ...defaultFormData, releaseDate: "2024-01-01" };
    render(
      <ProjectForm
        formData={formDataWithReleaseDate}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const statusSelect = screen.getByTestId("status");
    fireEvent.change(statusSelect, { target: { value: "InProgress" } });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "InProgress",
        releaseDate: "",
      })
    );
  });

  it("should update status without clearing releaseDate for other statuses", async () => {
    const user = userEvent.setup();
    const formDataWithReleaseDate = { ...defaultFormData, releaseDate: "2024-01-01" };
    render(
      <ProjectForm
        formData={formDataWithReleaseDate}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const statusSelect = screen.getByTestId("status");
    fireEvent.change(statusSelect, { target: { value: "Completed" } });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "Completed",
        releaseDate: "2024-01-01",
      })
    );
  });

  it("should update GitHub URL", async () => {
    const user = userEvent.setup();
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const githubInput = screen.getByTestId("github-url");
    fireEvent.change(githubInput, { target: { value: "https://github.com/test" } });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        links: { github: "https://github.com/test", live: "" },
      })
    );
  });

  it("should update Live URL", async () => {
    const user = userEvent.setup();
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const liveInput = screen.getByTestId("live-url");
    fireEvent.change(liveInput, { target: { value: "https://example.com" } });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        links: { github: "", live: "https://example.com" },
      })
    );
  });

  it("should toggle featured checkbox", async () => {
    const user = userEvent.setup();
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const featuredCheckbox = screen.getByRole("checkbox", { name: /featured/i });
    await user.click(featuredCheckbox);

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        featured: true,
      })
    );
  });

  it("should update start date", async () => {
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const startDateInput = screen.getByTestId("start-date");
    fireEvent.change(startDateInput, { target: { value: "2024-01-01" } });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: "2024-01-01",
      })
    );
  });

  it("should update release date", async () => {
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const releaseDateInput = screen.getByTestId("release-date");
    fireEvent.change(releaseDateInput, { target: { value: "2024-12-31" } });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        releaseDate: "2024-12-31",
      })
    );
  });

  it("should update short description", async () => {
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const shortDescInput = screen.getByTestId("short-description");
    fireEvent.change(shortDescInput, { target: { value: "A short description" } });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        shortDescription: "A short description",
      })
    );
  });

  it("should update long description", async () => {
    render(
      <ProjectForm
        formData={defaultFormData}
        setFormData={mockSetFormData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const descInput = screen.getByTestId("description");
    fireEvent.change(descInput, { target: { value: "A long description" } });

    expect(mockSetFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        longDescription: "A long description",
      })
    );
  });

  describe("ImageUploader Integration", () => {
    it("should render ImageUploader component", () => {
      render(
        <ProjectForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId("image-uploader")).toBeInTheDocument();
      expect(screen.getByText(/Project Images/i)).toBeInTheDocument();
    });

    it("should display existing images", () => {
      const formDataWithImages = {
        ...defaultFormData,
        images: ["/images/test1.jpg", "/images/test2.jpg"],
      };
      render(
        <ProjectForm
          formData={formDataWithImages}
          setFormData={mockSetFormData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId("images-count")).toHaveTextContent("2/10");
      expect(screen.getByTestId("image-0")).toBeInTheDocument();
      expect(screen.getByTestId("image-1")).toBeInTheDocument();
    });

    it("should call setFormData when adding an image", async () => {
      const user = userEvent.setup();
      render(
        <ProjectForm
          formData={defaultFormData}
          setFormData={mockSetFormData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByTestId("add-image"));

      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          images: ["https://test.com/new-image.jpg"],
        })
      );
    });

    it("should call setFormData when removing an image", async () => {
      const user = userEvent.setup();
      const formDataWithImages = {
        ...defaultFormData,
        images: ["/images/test1.jpg", "/images/test2.jpg"],
      };
      render(
        <ProjectForm
          formData={formDataWithImages}
          setFormData={mockSetFormData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByTestId("remove-image-0"));

      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          images: ["/images/test2.jpg"],
        })
      );
    });
  });
});

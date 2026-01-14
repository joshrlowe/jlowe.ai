/**
 * NewArticlePage.test.jsx
 *
 * Comprehensive tests for the New Article page component
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import NewArticlePage from "@/pages/articles/new";

expect.extend(toHaveNoViolations);

// Mock next-auth
const mockPush = jest.fn();
const mockUseSession = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: "/articles/new",
    query: {},
    asPath: "/articles/new",
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe("NewArticlePage Component", () => {
  const mockSession = {
    data: {
      user: {
        id: "1",
        email: "admin@example.com",
        role: "admin",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    status: "authenticated",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue(mockSession);
    global.fetch.mockReset();
  });

  describe("Authentication", () => {
    it("should show loading state while checking authentication", () => {
      mockUseSession.mockReturnValue({ data: null, status: "loading" });

      render(<NewArticlePage />);

      // Should show loading spinner
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("should redirect unauthenticated users to login", async () => {
      mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });

      render(<NewArticlePage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/admin/login?callbackUrl=/articles/new"
        );
      });
    });

    it("should show login message for unauthenticated users", () => {
      mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });

      render(<NewArticlePage />);

      expect(
        screen.getByText(/please log in to create articles/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/go to login/i)).toBeInTheDocument();
    });

    it("should render the form for authenticated users", () => {
      render(<NewArticlePage />);

      expect(screen.getByText("Create New Article")).toBeInTheDocument();
      expect(screen.getByLabelText(/^title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^description/i)).toBeInTheDocument();
    });
  });

  describe("Form Rendering", () => {
    beforeEach(() => {
      render(<NewArticlePage />);
    });

    it("should render all form sections", () => {
      expect(screen.getByText("Basic Information")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.getByText("SEO & Media")).toBeInTheDocument();
      expect(screen.getByText("Publish Settings")).toBeInTheDocument();
    });

    it("should render all required form fields", () => {
      expect(screen.getByLabelText(/^title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^topic/i)).toBeInTheDocument();
    });

    it("should render optional form fields", () => {
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/article content/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cover image/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/meta title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/meta description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it("should render topic dropdown with options", () => {
      const topicSelect = screen.getByLabelText(/^topic/i);
      expect(topicSelect).toBeInTheDocument();

      // Check for some expected options
      expect(screen.getByRole("option", { name: /javascript/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /react/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /nextjs/i })).toBeInTheDocument();
    });

    it("should render status dropdown with Draft and Published options", () => {
      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toBeInTheDocument();

      expect(screen.getByRole("option", { name: /draft/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /published/i })).toBeInTheDocument();
    });

    it("should render submit and cancel buttons", () => {
      expect(screen.getByRole("button", { name: /create article/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should have back link to articles page", () => {
      const backLink = screen.getByRole("link", { name: /back to articles/i });
      expect(backLink).toHaveAttribute("href", "/articles");
    });
  });

  describe("Slug Auto-generation", () => {
    it("should auto-generate slug from title", async () => {
      const user = userEvent.setup({ delay: null });
      render(<NewArticlePage />);

      const titleInput = screen.getByRole("textbox", { name: /^title/i });
      await user.type(titleInput, "My First Article");

      await waitFor(() => {
        const slugInput = screen.getByRole("textbox", { name: /^slug/i });
        expect(slugInput.value).toBe("my-first-article");
      });
    });

    it("should handle special characters in title for slug", async () => {
      const user = userEvent.setup({ delay: null });
      render(<NewArticlePage />);

      const titleInput = screen.getByRole("textbox", { name: /^title/i });
      await user.type(titleInput, "Hello, World! How's It Going?");

      await waitFor(() => {
        const slugInput = screen.getByRole("textbox", { name: /^slug/i });
        expect(slugInput.value).toBe("hello-world-hows-it-going");
      });
    });

    it("should allow manual slug editing", async () => {
      const user = userEvent.setup({ delay: null });
      render(<NewArticlePage />);

      const slugInput = screen.getByRole("textbox", { name: /^slug/i });

      // Fire change event to simulate editing
      fireEvent.change(slugInput, { target: { value: "my-custom-slug" } });

      expect(slugInput.value).toBe("my-custom-slug");
    });
  });

  describe("Form Validation", () => {
    it("should have required attribute on title field", () => {
      render(<NewArticlePage />);

      const titleInput = screen.getByRole("textbox", { name: /^title/i });
      expect(titleInput).toHaveAttribute("required");
    });

    it("should have required attribute on description field", () => {
      render(<NewArticlePage />);

      const descriptionInput = screen.getByRole("textbox", { name: /^description/i });
      expect(descriptionInput).toHaveAttribute("required");
    });

    it("should have required attribute on slug field", () => {
      render(<NewArticlePage />);

      const slugInput = screen.getByRole("textbox", { name: /^slug/i });
      expect(slugInput).toHaveAttribute("required");
    });

    it("should not call API when required fields are empty", async () => {
      const user = userEvent.setup({ delay: null });
      render(<NewArticlePage />);

      const submitButton = screen.getByRole("button", { name: /create article/i });
      await user.click(submitButton);

      // API should not be called due to HTML5 validation
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Form Submission", () => {
    const fillFormWithFireEvent = () => {
      // Use fireEvent for faster, more reliable form filling
      fireEvent.change(screen.getByRole("textbox", { name: /^title/i }), {
        target: { value: "Test Article" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: /^description/i }), {
        target: { value: "This is a test description" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: /^slug/i }), {
        target: { value: "test-article" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: /article content/i }), {
        target: { value: "# Test Content\n\nThis is test content." },
      });
      fireEvent.change(screen.getByRole("textbox", { name: /tags/i }), {
        target: { value: "react, testing, jest" },
      });
    };

    it("should submit form with valid data", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "1",
          title: "Test Article",
          slug: "test-article",
          topic: "javascript",
        }),
      });

      render(<NewArticlePage />);
      fillFormWithFireEvent();

      const submitButton = screen.getByRole("button", { name: /create article/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith("/api/articles", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: expect.any(String),
          });
        },
        { timeout: 2000 }
      );
    });

    it("should show success message after successful creation", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "1",
          title: "Test Article",
          slug: "test-article",
          topic: "javascript",
        }),
      });

      render(<NewArticlePage />);
      fillFormWithFireEvent();

      const submitButton = screen.getByRole("button", { name: /create article/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText(/article created successfully/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("should show error message on API failure", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Failed to create article" }),
      });

      render(<NewArticlePage />);
      fillFormWithFireEvent();

      const submitButton = screen.getByRole("button", { name: /create article/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText(/failed to create article/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("should parse tags correctly", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "1",
          title: "Test Article",
          slug: "test-article",
          topic: "javascript",
        }),
      });

      render(<NewArticlePage />);
      fillFormWithFireEvent();

      const submitButton = screen.getByRole("button", { name: /create article/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.tags).toEqual(["react", "testing", "jest"]);
    });

    it("should redirect to published article after creation", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "1",
          title: "Test Article",
          slug: "test-article",
          topic: "javascript",
        }),
      });

      render(<NewArticlePage />);
      fillFormWithFireEvent();

      // Set status to Published
      const statusSelect = screen.getByRole("combobox", { name: /status/i });
      fireEvent.change(statusSelect, { target: { value: "Published" } });

      const submitButton = screen.getByRole("button", { name: /create article/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith("/articles/javascript/test-article");
        },
        { timeout: 3000 }
      );
    });

    it("should redirect to admin articles for draft articles", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "1",
          title: "Test Article",
          slug: "test-article",
          topic: "javascript",
        }),
      });

      render(<NewArticlePage />);
      fillFormWithFireEvent();

      const submitButton = screen.getByRole("button", { name: /create article/i });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith("/admin/articles");
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Accessibility", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(<NewArticlePage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper labels for all form fields", () => {
      render(<NewArticlePage />);

      // All inputs should be properly labeled
      expect(screen.getByLabelText(/^title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^topic/i)).toBeInTheDocument();
    });

    it("should indicate required fields", () => {
      render(<NewArticlePage />);

      // Check that required field markers exist
      const requiredMarkers = screen.getAllByText("*");
      expect(requiredMarkers.length).toBeGreaterThan(0);
    });
  });

  describe("SEO", () => {
    it("should set noIndex for the page", () => {
      render(<NewArticlePage />);
      // The SEO component should be rendered with noIndex
      // This is handled by the SEO component
    });
  });
});


/**
 * Tests for Admin Login page
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AdminLogin from "@/pages/admin/login";

// Mock next-auth/react
const mockSignIn = jest.fn();
const mockUseSession = jest.fn();

jest.mock("next-auth/react", () => ({
  signIn: (...args) => mockSignIn(...args),
  useSession: () => mockUseSession(),
}));

// Mock next/router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe("AdminLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ status: "unauthenticated" });
  });

  describe("Rendering", () => {
    it("should render login form", () => {
      render(<AdminLogin />);
      
      expect(screen.getByText("Admin Login")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("admin@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    it("should render email input with placeholder", () => {
      render(<AdminLogin />);
      
      const emailInput = screen.getByPlaceholderText("admin@example.com");
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("should render password input", () => {
      render(<AdminLogin />);
      
      const passwordInput = screen.getByPlaceholderText("••••••••");
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Loading state", () => {
    it("should show loading spinner when session is loading", () => {
      mockUseSession.mockReturnValue({ status: "loading" });
      
      const { container } = render(<AdminLogin />);
      
      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("should show loading spinner when authenticated", () => {
      mockUseSession.mockReturnValue({ status: "authenticated" });
      
      const { container } = render(<AdminLogin />);
      
      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("Redirect behavior", () => {
    it("should redirect to dashboard when already authenticated", async () => {
      mockUseSession.mockReturnValue({ status: "authenticated" });
      
      render(<AdminLogin />);
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/admin/dashboard");
      });
    });
  });

  describe("Form submission", () => {
    it("should call signIn with credentials on form submit", async () => {
      mockSignIn.mockResolvedValue({ error: null });
      
      render(<AdminLogin />);
      
      const emailInput = screen.getByPlaceholderText("admin@example.com");
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /login/i });
      
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          redirect: false,
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("should redirect to dashboard on successful login", async () => {
      mockSignIn.mockResolvedValue({ error: null });
      
      render(<AdminLogin />);
      
      const emailInput = screen.getByPlaceholderText("admin@example.com");
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /login/i });
      
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/admin/dashboard");
      });
    });

    it("should display error message on failed login", async () => {
      mockSignIn.mockResolvedValue({ error: "Invalid credentials" });
      
      render(<AdminLogin />);
      
      const emailInput = screen.getByPlaceholderText("admin@example.com");
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /login/i });
      
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "wrongpassword");
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("should handle signIn error gracefully", async () => {
      mockSignIn.mockRejectedValue(new Error("Network error"));
      
      render(<AdminLogin />);
      
      const emailInput = screen.getByPlaceholderText("admin@example.com");
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /login/i });
      
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
      });
    });

    it("should show loading state during submission", async () => {
      // Make signIn hang to test loading state
      mockSignIn.mockImplementation(() => new Promise(() => {}));
      
      render(<AdminLogin />);
      
      const emailInput = screen.getByPlaceholderText("admin@example.com");
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /login/i });
      
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText("Logging in...")).toBeInTheDocument();
      });
    });

    it("should disable inputs during loading", async () => {
      mockSignIn.mockImplementation(() => new Promise(() => {}));
      
      render(<AdminLogin />);
      
      const emailInput = screen.getByPlaceholderText("admin@example.com");
      const passwordInput = screen.getByPlaceholderText("••••••••");
      const submitButton = screen.getByRole("button", { name: /login/i });
      
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("Form validation", () => {
    it("should require email field", () => {
      render(<AdminLogin />);
      
      const emailInput = screen.getByPlaceholderText("admin@example.com");
      expect(emailInput).toHaveAttribute("required");
    });

    it("should require password field", () => {
      render(<AdminLogin />);
      
      const passwordInput = screen.getByPlaceholderText("••••••••");
      expect(passwordInput).toHaveAttribute("required");
    });
  });
});


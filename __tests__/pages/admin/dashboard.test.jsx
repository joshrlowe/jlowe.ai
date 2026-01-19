/**
 * Tests for Admin Dashboard page
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboard, { getServerSideProps } from "@/pages/admin/dashboard";

// Mock next-auth/react
const mockUseSession = jest.fn();

jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  SessionProvider: ({ children }) => children,
}));

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: "/admin/dashboard",
    query: {},
  }),
}));

// Mock AdminLayout
jest.mock("@/components/admin/AdminLayout", () => {
  return function MockAdminLayout({ children, title }) {
    return (
      <div data-testid="admin-layout" data-title={title}>
        {children}
      </div>
    );
  };
});

// Mock auth
jest.mock("@/lib/auth.js", () => ({
  requireAuth: jest.fn(() => Promise.resolve({ props: {} })),
}));

// Mock fetch
global.fetch = jest.fn();

describe("AdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockUseSession.mockReturnValue({ status: "authenticated" });
    
    // Mock successful fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: "1", title: "Project 1", status: "Published", updatedAt: "2024-01-15" },
        { id: "2", title: "Project 2", status: "Draft", updatedAt: "2024-01-14" },
        { id: "3", title: "Project 3", status: "Published", updatedAt: "2024-01-13" },
      ]),
    });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe("Loading state", () => {
    it("should show loading spinner when session is loading", () => {
      mockUseSession.mockReturnValue({ status: "loading" });
      
      const { container } = render(<AdminDashboard />);
      
      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("AdminLayout", () => {
    it("should render with AdminLayout wrapper", () => {
      // Loading state still renders AdminLayout
      mockUseSession.mockReturnValue({ status: "loading" });
      
      render(<AdminDashboard />);
      
      expect(screen.getByTestId("admin-layout")).toBeInTheDocument();
    });
  });

  describe("getServerSideProps", () => {
    it("should call requireAuth", async () => {
      const { requireAuth } = require("@/lib/auth.js");
      
      const context = { req: {}, res: {} };
      await getServerSideProps(context);
      
      expect(requireAuth).toHaveBeenCalledWith(context);
    });

    it("should return props from requireAuth", async () => {
      const result = await getServerSideProps({ req: {}, res: {} });
      
      expect(result).toEqual({ props: {} });
    });
  });

  describe("API fetch", () => {
    it("should fetch projects on mount", async () => {
      await act(async () => {
        render(<AdminDashboard />);
      });
      
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/projects");
    });

    it("should handle fetch error gracefully", async () => {
      global.fetch.mockRejectedValue(new Error("Fetch failed"));
      
      await act(async () => {
        render(<AdminDashboard />);
      });
      
      expect(console.error).toHaveBeenCalled();
    });
  });
});

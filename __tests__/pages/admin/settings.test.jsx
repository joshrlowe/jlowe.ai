/**
 * Tests for Admin Settings page
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminSettings, { getServerSideProps } from "@/pages/admin/settings";

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
    pathname: "/admin/settings",
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

// Mock section components
jest.mock("@/components/admin/GlobalSettingsSection", () => {
  return function MockGlobalSettings({ onError }) {
    return <div data-testid="global-settings">Global Settings Section</div>;
  };
});

jest.mock("@/components/admin/HomeSettingsSection", () => {
  return function MockHomeSettings({ onError }) {
    return <div data-testid="home-settings">Home Settings Section</div>;
  };
});

jest.mock("@/components/admin/AboutSettingsSection", () => {
  return function MockAboutSettings({ onError }) {
    return <div data-testid="about-settings">About Settings Section</div>;
  };
});


jest.mock("@/components/admin/ContactSettingsSection", () => {
  return function MockContactSettings({ onError }) {
    return <div data-testid="contact-settings">Contact Settings Section</div>;
  };
});

// Mock auth
jest.mock("@/lib/auth.js", () => ({
  requireAuth: jest.fn(() => Promise.resolve({ props: {} })),
}));

describe("AdminSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { email: "admin@example.com" } },
      status: "authenticated",
    });
  });

  describe("Loading state", () => {
    it("should show loading spinner when session is loading", () => {
      mockUseSession.mockReturnValue({ status: "loading", data: null });
      
      const { container } = render(<AdminSettings />);
      
      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("should show loading when session is null", () => {
      mockUseSession.mockReturnValue({ status: "authenticated", data: null });
      
      const { container } = render(<AdminSettings />);
      
      expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("Rendering", () => {
    it("should render with AdminLayout", () => {
      render(<AdminSettings />);
      
      expect(screen.getByTestId("admin-layout")).toBeInTheDocument();
    });

    it("should set correct title", () => {
      render(<AdminSettings />);
      
      expect(screen.getByTestId("admin-layout")).toHaveAttribute("data-title", "Site Settings");
    });

    it("should render all section tabs", () => {
      render(<AdminSettings />);
      
      expect(screen.getByText("Global Site Settings")).toBeInTheDocument();
      expect(screen.getByText("Home Page")).toBeInTheDocument();
      expect(screen.getByText("About Page")).toBeInTheDocument();
      expect(screen.getByText("Contact")).toBeInTheDocument();
    });

    it("should render Global Settings section by default", () => {
      render(<AdminSettings />);
      
      expect(screen.getByTestId("global-settings")).toBeInTheDocument();
    });
  });

  describe("Tab switching", () => {
    it("should switch to Home Settings section", () => {
      render(<AdminSettings />);
      
      fireEvent.click(screen.getByText("Home Page"));
      
      expect(screen.getByTestId("home-settings")).toBeInTheDocument();
      expect(screen.queryByTestId("global-settings")).not.toBeInTheDocument();
    });

    it("should switch to About Settings section", () => {
      render(<AdminSettings />);
      
      fireEvent.click(screen.getByText("About Page"));
      
      expect(screen.getByTestId("about-settings")).toBeInTheDocument();
    });

    it("should switch to Contact Settings section", () => {
      render(<AdminSettings />);
      
      fireEvent.click(screen.getByText("Contact"));
      
      expect(screen.getByTestId("contact-settings")).toBeInTheDocument();
    });

    it("should switch back to Global Settings", () => {
      render(<AdminSettings />);
      
      fireEvent.click(screen.getByText("Home Page"));
      fireEvent.click(screen.getByText("Global Site Settings"));
      
      expect(screen.getByTestId("global-settings")).toBeInTheDocument();
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

  describe("Tab styling", () => {
    it("should highlight active tab", () => {
      render(<AdminSettings />);
      
      const globalTab = screen.getByText("Global Site Settings");
      const homeTab = screen.getByText("Home Page");
      
      // Global should be active by default
      expect(globalTab.className).toContain("bg-[var(--color-primary)]");
      expect(homeTab.className).not.toContain("bg-[var(--color-primary)]");
    });

    it("should update active tab styling on click", () => {
      render(<AdminSettings />);
      
      const homeTab = screen.getByText("Home Page");
      fireEvent.click(homeTab);
      
      expect(homeTab.className).toContain("bg-[var(--color-primary)]");
    });
  });
});


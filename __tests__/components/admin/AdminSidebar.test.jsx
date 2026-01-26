/**
 * Tests for AdminSidebar component
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Mock next/router
const mockRouter = {
  pathname: "/admin/dashboard",
  push: jest.fn(),
};
jest.mock("next/router", () => ({
  useRouter: () => mockRouter,
}));

// Mock next-auth/react
const mockSignOut = jest.fn();
jest.mock("next-auth/react", () => ({
  signOut: (...args) => mockSignOut(...args),
}));

describe("AdminSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.pathname = "/admin/dashboard";
  });

  it("renders the sidebar", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Articles")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders logout button", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("renders view site link", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("← View Site")).toBeInTheDocument();
  });

  it("highlights active navigation item", () => {
    mockRouter.pathname = "/admin/projects";
    render(<AdminSidebar />);

    const projectsLink = screen.getByText("Projects").closest("a");
    expect(projectsLink).toHaveClass("bg-[var(--color-primary)]/10");
  });

  it("toggles mobile menu when button is clicked", () => {
    render(<AdminSidebar />);

    const toggleButton = screen.getByLabelText("Toggle menu");
    const sidebar = screen.getByText("Admin Panel").closest("div").parentElement;

    // Initially sidebar is translated off-screen on mobile
    expect(sidebar).toHaveClass("-translate-x-full");

    // Click toggle button
    fireEvent.click(toggleButton);

    // Now sidebar should be visible
    expect(sidebar).toHaveClass("translate-x-0");
  });

  it("closes sidebar when clicking overlay", () => {
    render(<AdminSidebar />);

    // Open the sidebar first
    const toggleButton = screen.getByLabelText("Toggle menu");
    fireEvent.click(toggleButton);

    // Now click the overlay
    const overlay = document.querySelector(".bg-black\\/50");
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay);

    // Sidebar should be closed
    const sidebar = screen.getByText("Admin Panel").closest("div").parentElement;
    expect(sidebar).toHaveClass("-translate-x-full");
  });

  it("closes sidebar when clicking a nav link", () => {
    render(<AdminSidebar />);

    // Open the sidebar first
    const toggleButton = screen.getByLabelText("Toggle menu");
    fireEvent.click(toggleButton);

    // Click a nav link
    const dashboardLink = screen.getByText("Dashboard");
    fireEvent.click(dashboardLink);

    // Sidebar should be closed
    const sidebar = screen.getByText("Admin Panel").closest("div").parentElement;
    expect(sidebar).toHaveClass("-translate-x-full");
  });

  it("calls signOut when logout button is clicked", () => {
    render(<AdminSidebar />);

    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/admin/login" });
  });

  it("shows hamburger icon when closed and X icon when open", () => {
    render(<AdminSidebar />);

    const toggleButton = screen.getByLabelText("Toggle menu");
    const svg = toggleButton.querySelector("svg");

    // Initially shows hamburger (has path with 3 lines - M4 6h16M4 12h16M4 18h16)
    expect(svg.querySelector("path[d*='M4 6h16']")).toBeInTheDocument();

    // Click to open
    fireEvent.click(toggleButton);

    // Now shows X (has path with X pattern - M6 18L18 6M6 6l12 12)
    expect(svg.querySelector("path[d*='M6 18L18 6']")).toBeInTheDocument();
  });

  it("applies correct styling to inactive nav items", () => {
    mockRouter.pathname = "/admin/dashboard";
    render(<AdminSidebar />);

    const projectsLink = screen.getByText("Projects").closest("a");
    expect(projectsLink).toHaveClass("text-[var(--color-text-secondary)]");
  });
});

/**
 * Tests for ProjectFilters component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectFilters from "@/components/Project/ProjectFilters";

describe("ProjectFilters", () => {
  const defaultProps = {
    searchQuery: "",
    onSearchChange: jest.fn(),
    statusFilter: "all",
    onStatusFilterChange: jest.fn(),
    tagFilter: "all",
    onTagFilterChange: jest.fn(),
    availableTags: ["React", "Node.js", "Python"],
    availableStatuses: ["Completed", "InProgress", "Planned"],
    onClearFilters: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders search input", () => {
    render(<ProjectFilters {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("Search projects..."),
    ).toBeInTheDocument();
  });

  it("renders status filter dropdown", () => {
    render(<ProjectFilters {...defaultProps} />);
    expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
  });

  it("renders tag filter dropdown", () => {
    render(<ProjectFilters {...defaultProps} />);
    expect(screen.getByLabelText("Filter by tag")).toBeInTheDocument();
  });

  it("calls onSearchChange when typing in search", () => {
    render(<ProjectFilters {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("Search projects...");
    fireEvent.change(searchInput, { target: { value: "react" } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("react");
  });

  it("calls onStatusFilterChange when selecting status", () => {
    render(<ProjectFilters {...defaultProps} />);
    const statusSelect = screen.getByLabelText("Filter by status");
    fireEvent.change(statusSelect, { target: { value: "Completed" } });
    expect(defaultProps.onStatusFilterChange).toHaveBeenCalledWith(
      "Completed",
    );
  });

  it("calls onTagFilterChange when selecting tag", () => {
    render(<ProjectFilters {...defaultProps} />);
    const tagSelect = screen.getByLabelText("Filter by tag");
    fireEvent.change(tagSelect, { target: { value: "React" } });
    expect(defaultProps.onTagFilterChange).toHaveBeenCalledWith("React");
  });

  it("shows active filters section when search query is set", () => {
    render(<ProjectFilters {...defaultProps} searchQuery="test" />);
    expect(screen.getByText('Search: "test"')).toBeInTheDocument();
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("shows active filters section when status filter is set", () => {
    render(<ProjectFilters {...defaultProps} statusFilter="Completed" />);
    expect(screen.getByText("Status: Completed")).toBeInTheDocument();
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("shows active filters section when tag filter is set", () => {
    render(<ProjectFilters {...defaultProps} tagFilter="React" />);
    expect(screen.getByText("Tag: React")).toBeInTheDocument();
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("does not show active filters section when no filters are active", () => {
    render(<ProjectFilters {...defaultProps} />);
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("calls onClearFilters when clicking Clear all", () => {
    render(<ProjectFilters {...defaultProps} searchQuery="test" />);
    const clearButton = screen.getByText("Clear all");
    fireEvent.click(clearButton);
    expect(defaultProps.onClearFilters).toHaveBeenCalled();
  });

  it("displays all available statuses in dropdown", () => {
    render(<ProjectFilters {...defaultProps} />);
    const statusSelect = screen.getByLabelText("Filter by status");
    expect(statusSelect).toHaveTextContent("All Statuses");
    expect(statusSelect).toHaveTextContent("Completed");
    expect(statusSelect).toHaveTextContent("In Progress"); // Formatted
    expect(statusSelect).toHaveTextContent("Planned");
  });

  it("displays all available tags in dropdown", () => {
    render(<ProjectFilters {...defaultProps} />);
    const tagSelect = screen.getByLabelText("Filter by tag");
    expect(tagSelect).toHaveTextContent("All Tags");
    expect(tagSelect).toHaveTextContent("React");
    expect(tagSelect).toHaveTextContent("Node.js");
    expect(tagSelect).toHaveTextContent("Python");
  });

  it("shows multiple active filters at once", () => {
    render(
      <ProjectFilters
        {...defaultProps}
        searchQuery="project"
        statusFilter="Completed"
        tagFilter="React"
      />,
    );
    expect(screen.getByText('Search: "project"')).toBeInTheDocument();
    expect(screen.getByText("Status: Completed")).toBeInTheDocument();
    expect(screen.getByText("Tag: React")).toBeInTheDocument();
  });

  it("formats camelCase status names with spaces", () => {
    render(<ProjectFilters {...defaultProps} />);
    const statusSelect = screen.getByLabelText("Filter by status");
    // InProgress should become "In Progress"
    expect(statusSelect).toHaveTextContent("In Progress");
  });

  it("has accessible labels for all inputs", () => {
    render(<ProjectFilters {...defaultProps} />);
    expect(screen.getByLabelText("Search projects")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by tag")).toBeInTheDocument();
  });

  it("renders with empty arrays for tags and statuses", () => {
    render(
      <ProjectFilters
        {...defaultProps}
        availableTags={[]}
        availableStatuses={[]}
      />,
    );
    expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by tag")).toBeInTheDocument();
  });
});


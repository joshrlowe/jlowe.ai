/**
 * Tests for Education component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Education from "@/components/About/Education/Education";

describe("Education", () => {
  it("returns null when education is not provided", () => {
    const { container } = render(<Education />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when education is null", () => {
    const { container } = render(<Education education={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when education is empty array", () => {
    const { container } = render(<Education education={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section title", () => {
    render(<Education education={[{ degree: "BS" }]} />);
    expect(screen.getByText("Education")).toBeInTheDocument();
  });

  it("renders education degree", () => {
    const education = [
      { degree: "Bachelor of Science in Computer Science" },
    ];
    render(<Education education={education} />);
    expect(screen.getByText("Bachelor of Science in Computer Science")).toBeInTheDocument();
  });

  it("renders institution name", () => {
    const education = [
      { degree: "BS", institution: "MIT" },
    ];
    render(<Education education={education} />);
    expect(screen.getByText("MIT")).toBeInTheDocument();
  });

  it("renders school when institution is not available", () => {
    const education = [
      { degree: "BS", school: "Stanford University" },
    ];
    render(<Education education={education} />);
    expect(screen.getByText("Stanford University")).toBeInTheDocument();
  });

  it("renders graduation year", () => {
    const education = [
      { degree: "BS", graduationYear: "2024" },
    ];
    render(<Education education={education} />);
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("renders year when graduationYear is not available", () => {
    const education = [
      { degree: "BS", year: "2023" },
    ];
    render(<Education education={education} />);
    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("renders date range with startYear and endYear", () => {
    const education = [
      { degree: "BS", startYear: "2020", endYear: "2024" },
    ];
    render(<Education education={education} />);
    expect(screen.getByText("2020 — 2024")).toBeInTheDocument();
  });

  it("renders Present for ongoing education without endYear", () => {
    const education = [
      { degree: "MS", startYear: "2023" },
    ];
    render(<Education education={education} />);
    expect(screen.getByText("2023 — Present")).toBeInTheDocument();
  });

  it("formats ISO date to month year", () => {
    const education = [
      { degree: "BS", startDate: "2020-09-01", endDate: "2024-05-15" },
    ];
    render(<Education education={education} />);
    expect(screen.getByText("Sep 2020 — May 2024")).toBeInTheDocument();
  });

  it("shows Present for ongoing education", () => {
    const education = [
      { degree: "MS", startDate: "2023-09", isOngoing: true },
    ];
    render(<Education education={education} />);
    expect(screen.getByText(/Present/)).toBeInTheDocument();
  });

  it("shows expected graduation date for ongoing education", () => {
    const education = [
      { degree: "MS", startDate: "2023-09", isOngoing: true, expectedGradDate: "2025-05" },
    ];
    render(<Education education={education} />);
    expect(screen.getByText(/Expected May 2025/)).toBeInTheDocument();
  });

  it("renders multiple education entries", () => {
    const education = [
      { degree: "PhD in AI", institution: "Stanford" },
      { degree: "MS in CS", institution: "MIT" },
      { degree: "BS in CS", institution: "Berkeley" },
    ];
    render(<Education education={education} />);
    expect(screen.getByText("PhD in AI")).toBeInTheDocument();
    expect(screen.getByText("MS in CS")).toBeInTheDocument();
    expect(screen.getByText("BS in CS")).toBeInTheDocument();
  });

  it("renders gpa when provided", () => {
    const education = [
      { degree: "BS", gpa: "3.9" },
    ];
    render(<Education education={education} />);
    expect(screen.getByText(/3.9/)).toBeInTheDocument();
  });

  it("renders field of study", () => {
    const education = [
      { degree: "Bachelor of Science", fieldOfStudy: "Computer Science" },
    ];
    render(<Education education={education} />);
    // Component combines degree and fieldOfStudy: "Bachelor of Science in Computer Science"
    expect(screen.getByText("Bachelor of Science in Computer Science")).toBeInTheDocument();
  });

  it("has test IDs for education entries", () => {
    const education = [
      { degree: "BS" },
      { degree: "MS" },
    ];
    render(<Education education={education} />);
    expect(screen.getByTestId("education-entry-0")).toBeInTheDocument();
    expect(screen.getByTestId("education-entry-1")).toBeInTheDocument();
  });
});


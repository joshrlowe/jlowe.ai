/**
 * Tests for Badge component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders with children", () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("applies primary variant by default", () => {
    render(<Badge data-testid="badge">Primary</Badge>);
    expect(screen.getByTestId("badge").className).toContain("text-[#E85D04]");
  });

  it("applies secondary variant", () => {
    render(
      <Badge variant="secondary" data-testid="badge">
        Secondary
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("text-[#DC2626]");
  });

  it("applies accent variant", () => {
    render(
      <Badge variant="accent" data-testid="badge">
        Accent
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("text-[#FAA307]");
  });

  it("applies cool variant", () => {
    render(
      <Badge variant="cool" data-testid="badge">
        Cool
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("text-[#4CC9F0]");
  });

  it("applies ember variant", () => {
    render(
      <Badge variant="ember" data-testid="badge">
        Ember
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("text-[#F48C06]");
  });

  it("applies success variant", () => {
    render(
      <Badge variant="success" data-testid="badge">
        Success
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("text-[#10B981]");
  });

  it("applies warning variant", () => {
    render(
      <Badge variant="warning" data-testid="badge">
        Warning
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("text-[#FAA307]");
  });

  it("applies error variant", () => {
    render(
      <Badge variant="error" data-testid="badge">
        Error
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("text-[#EF4444]");
  });

  it("applies info variant", () => {
    render(
      <Badge variant="info" data-testid="badge">
        Info
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("text-[#4CC9F0]");
  });

  it("applies neutral variant", () => {
    render(
      <Badge variant="neutral" data-testid="badge">
        Neutral
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("text-[#A3A3A3]");
  });

  it("applies different sizes", () => {
    const { rerender } = render(
      <Badge size="sm" data-testid="badge">
        Small
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("px-2");
    expect(screen.getByTestId("badge").className).toContain("text-xs");

    rerender(
      <Badge size="md" data-testid="badge">
        Medium
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("px-2.5");

    rerender(
      <Badge size="lg" data-testid="badge">
        Large
      </Badge>,
    );
    expect(screen.getByTestId("badge").className).toContain("px-3");
    expect(screen.getByTestId("badge").className).toContain("text-sm");
  });

  it("renders icon when provided", () => {
    const icon = <span data-testid="icon">★</span>;
    render(<Badge icon={icon}>With Icon</Badge>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("shows pulse animation when pulse is true", () => {
    render(
      <Badge pulse data-testid="badge">
        Pulsing
      </Badge>,
    );
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("does not show pulse when pulse is false", () => {
    render(
      <Badge pulse={false} data-testid="badge">
        Not Pulsing
      </Badge>,
    );
    const badge = screen.getByTestId("badge");
    expect(badge.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <Badge className="custom-class" data-testid="badge">
        Custom
      </Badge>,
    );
    expect(screen.getByTestId("badge")).toHaveClass("custom-class");
  });

  it("forwards ref to span element", () => {
    const ref = React.createRef();
    render(<Badge ref={ref}>Ref Test</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("passes additional props", () => {
    render(<Badge data-testid="badge" role="status">Props</Badge>);
    expect(screen.getByTestId("badge")).toHaveAttribute("role", "status");
  });

  it("has proper border styling", () => {
    render(<Badge data-testid="badge">Border</Badge>);
    expect(screen.getByTestId("badge").className).toContain("border");
    expect(screen.getByTestId("badge").className).toContain("rounded-full");
  });
});


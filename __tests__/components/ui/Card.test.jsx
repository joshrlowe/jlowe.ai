/**
 * Tests for Card component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("renders with children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders as div by default", () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId("card").tagName).toBe("DIV");
  });

  it("renders as custom element when 'as' prop is provided", () => {
    render(
      <Card as="article" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").tagName).toBe("ARTICLE");
  });

  it("applies default variant", () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId("card").className).toContain(
      "bg-[rgba(12,12,12,0.9)]",
    );
  });

  it("applies primary variant", () => {
    render(
      <Card variant="primary" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain(
      "bg-[rgba(232,93,4,0.08)]",
    );
  });

  it("applies accent variant", () => {
    render(
      <Card variant="accent" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain(
      "bg-[rgba(250,163,7,0.08)]",
    );
  });

  it("applies cool variant", () => {
    render(
      <Card variant="cool" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain(
      "bg-[rgba(76,201,240,0.08)]",
    );
  });

  it("applies secondary variant", () => {
    render(
      <Card variant="secondary" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain(
      "bg-[rgba(157,2,8,0.08)]",
    );
  });

  it("applies different padding sizes", () => {
    const { rerender } = render(
      <Card padding="sm" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain("p-4");

    rerender(
      <Card padding="md" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain("p-6");

    rerender(
      <Card padding="lg" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain("p-8");

    rerender(
      <Card padding="none" data-testid="card">
        Content
      </Card>,
    );
    // No padding class for "none"
    expect(screen.getByTestId("card").className).not.toContain("p-4");
  });

  it("applies glow effect by default", () => {
    render(
      <Card data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain("hover:shadow-");
  });

  it("does not apply glow when glow is false", () => {
    render(
      <Card glow={false} data-testid="card">
        Content
      </Card>,
    );
    // Primary glow effect should not be present
    expect(screen.getByTestId("card").className).not.toContain(
      "hover:shadow-[0_0_40px",
    );
  });

  it("applies interactive styles when interactive is true", () => {
    render(
      <Card interactive data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card").className).toContain("cursor-pointer");
    expect(screen.getByTestId("card").className).toContain("hover:-translate-y-1");
  });

  it("applies tilt transform on mouse move when tilt is enabled", () => {
    render(
      <Card tilt data-testid="card">
        Content
      </Card>,
    );
    const card = screen.getByTestId("card");
    
    fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });
    expect(card.style.transform).toContain("perspective");
    expect(card.style.transform).toContain("rotateY");
    expect(card.style.transform).toContain("rotateX");
  });

  it("resets transform on mouse leave when tilt is enabled", () => {
    render(
      <Card tilt data-testid="card">
        Content
      </Card>,
    );
    const card = screen.getByTestId("card");
    
    fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });
    fireEvent.mouseLeave(card);
    expect(card.style.transform).toBe("");
  });

  it("does not apply tilt when tilt is false", () => {
    render(
      <Card tilt={false} data-testid="card">
        Content
      </Card>,
    );
    const card = screen.getByTestId("card");
    
    fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });
    expect(card.style.transform).toBe("");
  });

  it("applies custom className", () => {
    render(
      <Card className="custom-class" data-testid="card">
        Content
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveClass("custom-class");
  });

  it("forwards ref to card element", () => {
    const ref = React.createRef();
    render(<Card ref={ref}>Content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("passes additional props to card element", () => {
    render(<Card data-testid="card" role="article">Content</Card>);
    expect(screen.getByTestId("card")).toHaveAttribute("role", "article");
  });

  it("has corner glow effect element", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    // Check for the corner glow div
    expect(card.querySelector(".absolute.top-0.right-0")).toBeInTheDocument();
  });
});


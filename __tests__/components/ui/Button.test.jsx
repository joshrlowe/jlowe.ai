/**
 * Tests for Button component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders with children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders as a button by default", () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders as a link when href is provided", () => {
    render(<Button href="/test">Link</Button>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/test");
  });

  it("applies primary variant by default", () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-gradient-to-br");
  });

  it("applies secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-transparent");
    expect(button.className).toContain("border");
  });

  it("applies cool variant", () => {
    render(<Button variant="cool">Cool</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("from-[#4CC9F0]");
  });

  it("applies ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-transparent");
  });

  it("applies different sizes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button").className).toContain("px-3");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button").className).toContain("px-6");

    rerender(<Button size="xl">XL</Button>);
    expect(screen.getByRole("button").className).toContain("px-8");
  });

  it("shows loading spinner when loading", () => {
    render(<Button loading>Loading</Button>);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("disables button when loading", () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables button when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders icon on the right by default", () => {
    const icon = <span data-testid="icon">→</span>;
    render(<Button icon={icon}>With Icon</Button>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders icon on the left when iconPosition is left", () => {
    const icon = <span data-testid="icon">←</span>;
    render(
      <Button icon={icon} iconPosition="left">
        With Icon
      </Button>,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalled();
  });

  it("applies magnetic effect on mouse move when magnetic is true", () => {
    render(<Button magnetic>Magnetic</Button>);
    const button = screen.getByRole("button");
    
    fireEvent.mouseMove(button, { clientX: 100, clientY: 100 });
    expect(button.style.transform).toContain("translate");
  });

  it("resets transform on mouse leave when magnetic", () => {
    render(<Button magnetic>Magnetic</Button>);
    const button = screen.getByRole("button");
    
    fireEvent.mouseMove(button, { clientX: 100, clientY: 100 });
    fireEvent.mouseLeave(button);
    expect(button.style.transform).toBe("");
  });

  it("does not apply magnetic effect when disabled", () => {
    render(
      <Button magnetic disabled>
        Disabled Magnetic
      </Button>,
    );
    const button = screen.getByRole("button");
    
    fireEvent.mouseMove(button, { clientX: 100, clientY: 100 });
    expect(button.style.transform).toBe("");
  });

  it("forwards ref to button element", () => {
    const ref = React.createRef();
    render(<Button ref={ref}>Ref Test</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards ref to link element", () => {
    const ref = React.createRef();
    render(
      <Button href="/test" ref={ref}>
        Link Ref
      </Button>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("passes additional props to button", () => {
    render(<Button data-testid="test-btn">Props</Button>);
    expect(screen.getByTestId("test-btn")).toBeInTheDocument();
  });
});


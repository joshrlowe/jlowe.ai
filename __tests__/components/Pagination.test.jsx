/**
 * Tests for Pagination component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Pagination } from "@/components/ui/Pagination";

describe("Pagination", () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders null when totalPages is 1", () => {
    const { container } = render(
      <Pagination {...defaultProps} totalPages={1} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders null when totalPages is 0", () => {
    const { container } = render(
      <Pagination {...defaultProps} totalPages={0} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders Previous and Next buttons", () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("renders custom labels", () => {
    render(
      <Pagination
        {...defaultProps}
        previousLabel="Back"
        nextLabel="Forward"
      />,
    );
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getByText("Forward")).toBeInTheDocument();
  });

  it("renders page info", () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    expect(screen.getByText("Page 3 of 5")).toBeInTheDocument();
  });

  it("hides page info when showPageInfo is false", () => {
    render(<Pagination {...defaultProps} showPageInfo={false} />);
    expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
  });

  it("disables Previous button on first page", () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    expect(screen.getByText("Previous")).toBeDisabled();
  });

  it("disables Next button on last page", () => {
    render(<Pagination {...defaultProps} currentPage={5} totalPages={5} />);
    expect(screen.getByText("Next")).toBeDisabled();
  });

  it("enables both buttons on middle pages", () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    expect(screen.getByText("Previous")).not.toBeDisabled();
    expect(screen.getByText("Next")).not.toBeDisabled();
  });

  it("calls onPageChange with previous page on Previous click", () => {
    const onPageChange = jest.fn();
    render(
      <Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />,
    );

    fireEvent.click(screen.getByText("Previous"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange with next page on Next click", () => {
    const onPageChange = jest.fn();
    render(
      <Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />,
    );

    fireEvent.click(screen.getByText("Next"));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("does not call onPageChange when Previous is disabled and clicked", () => {
    const onPageChange = jest.fn();
    render(
      <Pagination {...defaultProps} currentPage={1} onPageChange={onPageChange} />,
    );

    fireEvent.click(screen.getByText("Previous"));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("does not call onPageChange when Next is disabled and clicked", () => {
    const onPageChange = jest.fn();
    render(
      <Pagination
        {...defaultProps}
        currentPage={5}
        totalPages={5}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByText("Next"));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("has proper aria labels", () => {
    render(<Pagination {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "Go to previous page" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to next page" }),
    ).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Pagination {...defaultProps} className="custom-class" />);
    expect(document.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("forwards ref to container element", () => {
    const ref = React.createRef();
    render(<Pagination {...defaultProps} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("passes additional props to container", () => {
    render(<Pagination {...defaultProps} data-testid="pagination" />);
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("has aria-live on page info for screen readers", () => {
    render(<Pagination {...defaultProps} />);
    const pageInfo = screen.getByText(/Page 1 of 5/);
    expect(pageInfo).toHaveAttribute("aria-live", "polite");
    expect(pageInfo).toHaveAttribute("aria-atomic", "true");
  });
});


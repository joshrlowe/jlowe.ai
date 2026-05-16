/**
 * Tests for Hobbies component
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Hobbies from "@/components/About/Hobbies/Hobbies";

describe("Hobbies", () => {
  it("returns null when hobbies is not provided", () => {
    const { container } = render(<Hobbies />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when hobbies is null", () => {
    const { container } = render(<Hobbies hobbies={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when hobbies is empty array", () => {
    const { container } = render(<Hobbies hobbies={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section title", () => {
    render(<Hobbies hobbies={["Reading"]} />);
    expect(screen.getByText("Hobbies & Interests")).toBeInTheDocument();
  });

  it("renders string hobbies", () => {
    const hobbies = ["Reading", "Gaming", "Hiking"];
    render(<Hobbies hobbies={hobbies} />);
    expect(screen.getByText("Reading")).toBeInTheDocument();
    expect(screen.getByText("Gaming")).toBeInTheDocument();
    expect(screen.getByText("Hiking")).toBeInTheDocument();
  });

  it("renders hobby object with name", () => {
    const hobbies = [{ name: "Photography" }];
    render(<Hobbies hobbies={hobbies} />);
    expect(screen.getByText("Photography")).toBeInTheDocument();
  });

  it("renders hobby object with title", () => {
    const hobbies = [{ title: "Cooking" }];
    render(<Hobbies hobbies={hobbies} />);
    expect(screen.getByText("Cooking")).toBeInTheDocument();
  });

  it("renders hobby icon when provided", () => {
    const hobbies = [{ name: "Music", icon: "🎵" }];
    render(<Hobbies hobbies={hobbies} />);
    expect(screen.getByText("🎵")).toBeInTheDocument();
  });

  it("renders hobby description when provided", () => {
    const hobbies = [{ name: "Gaming", description: "Video games and board games" }];
    render(<Hobbies hobbies={hobbies} />);
    expect(screen.getByText("Video games and board games")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const hobbies = [{ name: "Reading" }];
    render(<Hobbies hobbies={hobbies} />);
    expect(screen.queryByText("some description")).not.toBeInTheDocument();
  });

  it("renders multiple hobbies", () => {
    const hobbies = [
      { name: "Reading", icon: "📚" },
      { name: "Gaming", icon: "🎮" },
      { name: "Hiking", icon: "🥾" },
      { name: "Photography", icon: "📷" },
    ];
    render(<Hobbies hobbies={hobbies} />);

    expect(screen.getByText("Reading")).toBeInTheDocument();
    expect(screen.getByText("Gaming")).toBeInTheDocument();
    expect(screen.getByText("Hiking")).toBeInTheDocument();
    expect(screen.getByText("Photography")).toBeInTheDocument();
  });
});

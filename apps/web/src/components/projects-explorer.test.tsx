import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PROJECTS } from "@/data/projects";

import { ProjectsExplorer } from "./projects-explorer";

describe("ProjectsExplorer", () => {
  it("shows all projects initially", () => {
    render(<ProjectsExplorer projects={PROJECTS} />);
    expect(
      screen.getByText(`${PROJECTS.length} projects found`),
    ).toBeInTheDocument();
  });

  it("filters by search query", async () => {
    const user = userEvent.setup();
    render(<ProjectsExplorer projects={PROJECTS} />);
    await user.type(screen.getByLabelText("Search projects"), "shell");
    expect(screen.getByText("1 project found")).toBeInTheDocument();
    expect(screen.getByText("C Shell")).toBeInTheDocument();
  });

  it("filters by tag toggle", async () => {
    const user = userEvent.setup();
    render(<ProjectsExplorer projects={PROJECTS} />);
    await user.click(screen.getByRole("button", { name: "RAG" }));
    expect(screen.getByText("1 project found")).toBeInTheDocument();
    expect(screen.getByText("AI Chat Funnel")).toBeInTheDocument();
  });
});

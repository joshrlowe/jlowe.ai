import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SOCIAL_LINKS } from "@/data/site";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("renders every social link", () => {
    render(<SiteFooter />);
    for (const social of SOCIAL_LINKS) {
      const link = screen.getByRole("link", { name: social.label });
      expect(link).toHaveAttribute("href", social.href);
    }
  });

  it("renders footer navigation", () => {
    render(<SiteFooter />);
    expect(
      screen.getByRole("navigation", { name: "Footer" }),
    ).toBeInTheDocument();
  });
});

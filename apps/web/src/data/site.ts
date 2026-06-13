import type { Route } from "next";

// Placeholder content migrated from the v1 site structure. Real copy and
// links are curated in later phases via corpus/.

export interface NavItem {
  label: string;
  href: Route;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Articles", href: "/articles" },
  { label: "Contact", href: "/contact" },
] as const;

export interface SocialLink {
  label: string;
  href: string;
  description: string;
}

export const EMAIL = "joshlowe.cs@gmail.com";

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    label: "GitHub",
    href: "https://github.com/joshrlowe",
    description: "Code, experiments, and open source",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/joshrlowe",
    description: "Professional background and experience",
  },
  {
    label: "X",
    href: "https://x.com/joshrlowe",
    description: "Thoughts on AI and engineering",
  },
  {
    label: "Email",
    href: `mailto:${EMAIL}`,
    description: "Reach out about a project",
  },
] as const;

export const TYPING_PHRASES: readonly string[] = [
  "intelligent AI systems",
  "production ML pipelines",
  "custom LLM solutions",
  "scalable data platforms",
  "next-gen applications",
] as const;

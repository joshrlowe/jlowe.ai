/**
 * Shared types for Project component family.
 * Project records carry JSON columns whose runtime shape is application-specific
 * and broader than the Prisma scalar type, so we accept loose shapes here.
 */

export interface ProjectTeamMember {
  name?: string;
  email?: string;
}

export interface ProjectLink {
  live?: string;
  github?: string;
  [key: string]: string | undefined;
}

export interface ProjectPaper {
  title?: string;
  url?: string;
}

export interface ProjectImage {
  url?: string;
  src?: string;
  [key: string]: unknown;
}

export interface ProjectTechStackShape {
  fullStackFramework?: string;
  backendFramework?: string;
  frontendFramework?: string;
  database?: string;
  languages?: string[];
  apiIntegrations?: { name: string; url: string }[];
  webServers?: string[];
  deploymentTools?: { name: string }[];
  additionalTools?: { name: string }[];
  operatingSystem?: string;
}

export interface ProjectLike {
  id?: string;
  slug?: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  longDescription?: string | null;
  status?: string;
  featured?: boolean;
  startDate?: string | Date | null;
  releaseDate?: string | Date | null;
  repositoryLink?: string | null;
  backgroundImage?: string | null;
  images?: unknown;
  tags?: unknown;
  techStack?: unknown;
  features?: unknown;
  challenges?: unknown;
  links?: unknown;
  papers?: unknown;
  team?: ProjectTeamMember[];
  teamMembers?: ProjectTeamMember[];
}

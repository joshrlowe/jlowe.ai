/**
 * Transforms project data between Prisma format (with teamMembers relation)
 * and API format (with team array).
 */

interface TeamMemberRecord {
  name: string;
  email?: string | null;
  [key: string]: unknown;
}

interface ProjectWithTeamMembers {
  teamMembers?: TeamMemberRecord[];
  [key: string]: unknown;
}

interface TeamMemberApiFormat {
  name: string;
  email: string | null;
}

/**
 * Converts teamMembers relation array to team array format.
 */
function transformTeamMembersToTeam(teamMembers: TeamMemberRecord[]): TeamMemberApiFormat[] {
  return teamMembers.map((member) => ({
    name: member.name,
    email: member.email || null,
  }));
}

/**
 * Transforms a Prisma project (with teamMembers) to API format (with team).
 */
export function transformProjectToApiFormat(
  project: ProjectWithTeamMembers
): Record<string, unknown> {
  const { teamMembers, ...rest } = project;
  return {
    ...rest,
    team: transformTeamMembersToTeam(teamMembers || []),
  };
}

/**
 * Transforms multiple Prisma projects to API format.
 */
export function transformProjectsToApiFormat(
  projects: ProjectWithTeamMembers[]
): Record<string, unknown>[] {
  return projects.map(transformProjectToApiFormat);
}

/**
 * Transforms team array (API format) to Prisma create format for teamMembers.
 */
export function transformTeamToTeamMembers(team: unknown): TeamMemberApiFormat[] {
  if (!Array.isArray(team)) {
    return [];
  }

  return team.map((member: TeamMemberRecord) => ({
    name: member.name,
    email: member.email || null,
  }));
}

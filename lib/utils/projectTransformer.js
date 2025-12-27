/**
 * Transforms project data between Prisma format (with teamMembers relation)
 * and API format (with team array).
 *
 * Following Martin Fowler's refactoring principles:
 * - Extract Method: Common transformation logic extracted
 * - Single Responsibility: Each function handles one transformation
 */

/**
 * Converts teamMembers relation array to team array format.
 *
 * @param {Array} teamMembers - Array of team member objects from Prisma
 * @returns {Array} Array of team member objects in API format
 */
function transformTeamMembersToTeam(teamMembers) {
  return teamMembers.map((member) => ({
    name: member.name,
    email: member.email,
  }));
}

/**
 * Transforms a Prisma project (with teamMembers) to API format (with team).
 *
 * @param {Object} project - Prisma project object with teamMembers relation
 * @returns {Object} Project object with team array instead of teamMembers
 */
export function transformProjectToApiFormat(project) {
  const { teamMembers, ...rest } = project;
  return {
    ...rest,
    team: transformTeamMembersToTeam(teamMembers || []),
  };
}

/**
 * Transforms multiple Prisma projects to API format.
 *
 * @param {Array} projects - Array of Prisma project objects
 * @returns {Array} Array of projects in API format
 */
export function transformProjectsToApiFormat(projects) {
  return projects.map(transformProjectToApiFormat);
}

/**
 * Transforms team array (API format) to Prisma create format for teamMembers.
 *
 * Refactored: Extract Method - Common pattern extracted to reduce duplication
 *
 * @param {Array} team - Array of team member objects { name, email? }
 * @returns {Array} Array formatted for Prisma teamMembers.create
 */
export function transformTeamToTeamMembers(team) {
  if (!Array.isArray(team)) {
    return [];
  }

  return team.map((member) => ({
    name: member.name,
    email: member.email || null,
  }));
}

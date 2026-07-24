/**
 * Project-Specific Validation Utilities
 */

import { validateRequiredFields } from "./validators";
import type { ValidationResult } from "../types";

interface TeamMember {
  name?: string;
  [key: string]: unknown;
}

/**
 * Validates project data for creation/update
 */
export function validateProjectData(
  data: Record<string, unknown>,
  requiredFields: string[] = ["title", "startDate"]
): ValidationResult {
  return validateRequiredFields(data, requiredFields);
}

/**
 * Validates project team member data
 */
export function validateTeamMember(member: TeamMember): ValidationResult {
  if (!member.name) {
    return {
      isValid: false,
      message: "Team member name is required",
    };
  }
  return { isValid: true };
}

/**
 * Validates array of team members
 */
export function validateTeamMembers(team: unknown): ValidationResult {
  if (!Array.isArray(team)) {
    return {
      isValid: false,
      message: "Team must be an array",
    };
  }

  for (const member of team) {
    const validation = validateTeamMember(member);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

/**
 * Validates admin project data (includes slug)
 */
export function validateAdminProjectData(data: Record<string, unknown>): ValidationResult {
  return validateRequiredFields(data, ["title", "slug"]);
}

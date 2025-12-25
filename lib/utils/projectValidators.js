/**
 * Project-Specific Validation Utilities
 * 
 * Following Martin Fowler's refactoring principles:
 * - Extract Method: Project validation logic extracted from API routes
 * - Single Responsibility: Each function validates one aspect
 */

import { validateRequiredFields } from "./validators.js";

/**
 * Validates project data for creation/update
 * 
 * @param {Object} data - Project data to validate
 * @param {string[]} requiredFields - Fields that are required (defaults to ["title", "startDate"])
 * @returns {{ isValid: boolean, message?: string }}
 */
export function validateProjectData(data, requiredFields = ["title", "startDate"]) {
  return validateRequiredFields(data, requiredFields);
}

/**
 * Validates project team member data
 * 
 * @param {Object} member - Team member data
 * @returns {{ isValid: boolean, message?: string }}
 */
export function validateTeamMember(member) {
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
 * 
 * @param {Array} team - Array of team members
 * @returns {{ isValid: boolean, message?: string }}
 */
export function validateTeamMembers(team) {
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
 * 
 * @param {Object} data - Admin project data
 * @returns {{ isValid: boolean, message?: string }}
 */
export function validateAdminProjectData(data) {
  return validateRequiredFields(data, ["title", "slug"]);
}


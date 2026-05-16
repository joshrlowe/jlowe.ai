/**
 * Shared type definitions used across lib/utils/ and pages/api/.
 */

import type { NextApiRequest, NextApiResponse } from "next";

/** Standard validation result returned by all validators */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/** Parsed pagination parameters from query strings */
export interface PaginationParams {
  limit: number | undefined;
  offset: number;
}

/** Parsed sort parameters from query strings */
export interface SortParams {
  sortBy: string;
  sortOrder: string;
}

/** Standard paginated API response */
export interface PaginatedResponse<T> {
  [key: string]: T[] | number;
  total: number;
  limit: number;
  offset: number;
}

/** Next.js API handler function signature */
export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  ...args: unknown[]
) => Promise<void> | void;

/** API handler method map for createApiHandler */
export interface ApiHandlerMap {
  [method: string]: ApiHandler;
}

/** Error response shape returned by API error handler */
export interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

/** Re-export Prisma model types for convenience */
export type {
  Project,
  Post,
  Comment,
  Playlist,
  Welcome,
  About,
  Contact,
  SiteSettings,
  PageContent,
  ActivityLog,
  AdminUser,
  ProjectTeamMember,
  NewsletterSubscription,
  Like,
  CommentVote,
  PlaylistPost,
  ProjectStatus,
  PostType,
  PostStatus,
} from "@prisma/client";

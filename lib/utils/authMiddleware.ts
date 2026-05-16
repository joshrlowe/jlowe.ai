/**
 * Authentication Middleware Utilities
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { getConfigValue } from "../config";

type AuthenticatedHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  token: JWT,
) => Promise<void> | void;

/**
 * Creates an authenticated API handler wrapper
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = await getToken({
      req,
      secret: getConfigValue("nextAuthSecret"),
    });

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return handler(req, res, token);
  };
}

/**
 * Gets user ID from token
 */
export function getUserIdFromToken(token: JWT): string {
  return (token.email as string) || (token.name as string) || "unknown";
}

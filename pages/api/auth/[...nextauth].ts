import type { NextApiRequest, NextApiResponse } from "next";
import NextAuthModule from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsModule from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";
import { checkRateLimit } from "../../../lib/utils/rateLimit";

// Handle next-auth ESM/CJS interop - webpack bundling may export as { default: fn }
const NextAuth =
  typeof NextAuthModule === "function"
    ? NextAuthModule
    : (NextAuthModule as unknown as { default: typeof NextAuthModule }).default;

const CredentialsProvider =
  typeof CredentialsModule === "function"
    ? CredentialsModule
    : (CredentialsModule as unknown as { default: typeof CredentialsModule }).default;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[Auth] Missing credentials");
            throw new Error("Email and password required");
          }

          const user = await prisma.adminUser.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.warn("[Auth] Login failed: unknown user");
            throw new Error("Invalid email or password");
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isPasswordValid) {
            console.warn("[Auth] Login failed: invalid password");
            throw new Error("Invalid email or password");
          }

          console.log("[Auth] Login successful");
          return {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("[Auth] Error during authentication:", (error as Error).message);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour in seconds
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { id: unknown }).id = token.id;
        (session.user as unknown as { role: unknown }).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default async function auth(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // POST /api/auth/callback/credentials is the password-check endpoint. Rate
  // limit it (by IP) so the single admin account can't be password-sprayed.
  const isCredentialsCallback =
    req.method === "POST" &&
    Array.isArray(req.query.nextauth) &&
    req.query.nextauth[0] === "callback" &&
    req.query.nextauth[1] === "credentials";

  if (isCredentialsCallback) {
    const allowed = await checkRateLimit(req, res, {
      maxRequests: 5,
      windowSeconds: 60,
      keyPrefix: "login",
    });
    if (!allowed) return; // checkRateLimit already sent the 429
  }

  return NextAuth(req, res, authOptions);
}

import NextAuth from "next-auth";
import CredentialsProvider from "../../../lib/credentials-provider.cjs";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma.js";

export const authOptions = {
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

          console.log("[Auth] Attempting login for:", credentials.email);

          const user = await prisma.adminUser.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log("[Auth] User not found:", credentials.email);
            throw new Error("Invalid email or password");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            console.log("[Auth] Invalid password for:", credentials.email);
            throw new Error("Invalid email or password");
          }

          console.log("[Auth] Login successful for:", credentials.email);
          return {
            id: user.id,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("[Auth] Error during authentication:", error.message);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

import { createRequire } from "module";

// Create require function at module level (import.meta.url is available here)
const requireLocal = createRequire(import.meta.url);

// NextAuth handler - configuration is loaded at runtime only
let authHandler = null;

function createHandler() {
  if (authHandler) {
    return authHandler;
  }

  // Import dependencies using requireLocal (only evaluated when function is called)
  const NextAuth = requireLocal("next-auth").default;
  const bcrypt = requireLocal("bcryptjs");
  const prisma = requireLocal("../../../lib/prisma.js").default;
  const CredentialsProvider = requireLocal(
    "../../../lib/credentials-provider.cjs",
  );

  const handler = NextAuth({
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password required");
          }

          const user = await prisma.adminUser.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error("Invalid email or password");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash,
          );

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            email: user.email,
            role: user.role,
          };
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
  });

  authHandler = handler;
  return handler;
}

export default function handler(req, res) {
  const nextAuthHandler = createHandler();
  return nextAuthHandler(req, res);
}

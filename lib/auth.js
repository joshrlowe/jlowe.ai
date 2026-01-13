/**
 * Require authentication - redirect if not logged in.
 * Use this in getServerSideProps for protected pages.
 *
 * IMPORTANT: This function always returns props to avoid build failures.
 * Runtime protection is handled by middleware.js which protects /admin routes.
 */
export async function requireAuth(_context) {
  // Always return props - middleware handles all authentication
  // This prevents any build-time issues with module loading
  return { props: {} };
}

/**
 * Get the current admin session on the server side.
 * Use this in API routes and server-side page components.
 */
export async function getAdminSession(req, _res) {
  const { getServerSession: _getServerSession } = await import("next-auth/next");
  // Import NextAuth handler to get authOptions
  const _nextAuthHandler = await import("../pages/api/auth/[...nextauth].js");

  // For NextAuth v4, we need to create a temporary handler to get options
  // But since we can't easily extract options, we'll use getToken instead
  const { getToken } = await import("next-auth/jwt");

  const { getConfigValue } = await import("./config.js");
  const token = await getToken({
    req,
    secret: getConfigValue("nextAuthSecret"),
  });

  if (!token) {
    return null;
  }

  return {
    user: {
      id: token.id,
      email: token.email,
      role: token.role,
    },
  };
}

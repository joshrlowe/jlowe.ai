import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function AdminLogin() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/admin/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/admin/dashboard");
      }
    } catch (_err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-[var(--color-bg-dark)] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)] flex items-center justify-center p-4">
      <div className="w-full max-w-[28rem]">
        <div className="bg-[var(--color-bg-card)] rounded-2xl p-8 sm:p-10 border border-[var(--color-border)]">
          <h1
            className="text-3xl sm:text-4xl font-bold text-[var(--color-primary)] text-center mb-8"
            style={{ fontFamily: 'var(--font-family-heading)' }}
          >
            Admin Login
          </h1>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:opacity-50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-dark)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:opacity-50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Projects Page
 *
 * Standalone page for managing projects
 */

import { useSession } from "next-auth/react";
import { requireAuth } from "@/lib/auth.js";
import AdminLayout from "@/components/admin/AdminLayout";
import ProjectsSettingsSection from "@/components/admin/ProjectsSettingsSection";
import { useState } from "react";

export async function getServerSideProps(context) {
  return requireAuth(context);
}

export default function AdminProjectsPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState("");

  if (status === "loading" || !session) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Projects">
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
        <ProjectsSettingsSection onError={setError} />
      </div>
    </AdminLayout>
  );
}


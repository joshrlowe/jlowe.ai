/* eslint-disable react/no-unescaped-entities, react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization, react-hooks/immutability, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @next/next/no-img-element, @next/next/no-html-link-for-pages, no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/react";
import { requireAuth } from "@/lib/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";

interface DashboardStats {
  totalProjects: number;
  published: number;
  drafts: number;
  other: number;
}

interface ActivityRow {
  type: string;
  title: string;
  status: string;
  updatedAt: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return requireAuth(context);
}

export default function AdminDashboard() {
  const { status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityRow[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const projectsRes = await fetch("/api/admin/projects");
      const projects = (await projectsRes.json()) as Array<{
        title: string;
        status: string;
        updatedAt: string;
      }>;

      const published = projects.filter((p) => p.status === "Published").length;
      const drafts = projects.filter((p) => p.status === "Draft").length;
      const recent = projects
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map<ActivityRow>((p) => ({
          type: "project",
          title: p.title,
          status: p.status,
          updatedAt: p.updatedAt,
        }));

      setStats({
        totalProjects: projects.length,
        published,
        drafts,
        other: projects.length - published - drafts,
      });
      setRecentActivity(recent);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: "Total Projects",
      value: stats?.totalProjects || 0,
      color: "text-[var(--color-text-primary)]",
    },
    {
      label: "Published",
      value: stats?.published || 0,
      color: "text-green-400",
    },
    { label: "Drafts", value: stats?.drafts || 0, color: "text-yellow-400" },
    { label: "Other", value: stats?.other || 0, color: "text-gray-400" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]"
            >
              <div className="text-sm text-[var(--color-text-muted)] mb-1">{stat.label}</div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/settings"
              className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Manage Settings
            </Link>
            <Link
              href="/admin/settings#projects"
              className="px-6 py-3 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            >
              Manage Projects
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] transition-colors"
            >
              View Site
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-[var(--color-text-muted)]">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-bg-darker)]"
                >
                  <div className="font-medium text-[var(--color-text-primary)]">
                    {activity.title}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === "Published"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-gray-500/10 text-gray-400"
                      }`}
                    >
                      {activity.status}
                    </span>
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {new Date(activity.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

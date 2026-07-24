import type { ReactNode } from "react";
import type { ContributionStats } from "@/lib/github/calendar-stats";

type StatColor = "primary" | "accent" | "cool";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: StatColor;
}

const COLOR_MAP: Record<StatColor, string> = {
  primary: "#E85D04",
  accent: "#FAA307",
  cool: "#4CC9F0",
};

function StatCard({ label, value, icon, color = "primary" }: StatCardProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg"
      style={{
        background: "rgba(12, 12, 12, 0.8)",
        border: `1px solid ${COLOR_MAP[color]}25`,
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          background: `${COLOR_MAP[color]}15`,
          color: COLOR_MAP[color],
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-2xl font-bold"
          style={{ color: COLOR_MAP[color], fontFamily: "var(--font-family-heading)" }}
        >
          {value}
        </p>
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

interface StatsCardsProps {
  stats: ContributionStats;
}

/**
 * Three-card row showing Total Contributions, Current Streak, and Best Day.
 * Reads `stats` from useDataLoaded → calculateContributionStats.
 */
export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
      <StatCard
        label="Total Contributions"
        value={stats.total.toLocaleString()}
        color="primary"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />
      <StatCard
        label="Current Streak"
        value={`${stats.currentStreak} days`}
        color="accent"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
            />
          </svg>
        }
      />
      <StatCard
        label="Best Day"
        value={`${stats.bestDay} commits`}
        color="cool"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        }
      />
    </div>
  );
}

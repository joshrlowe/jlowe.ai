import { contributionGrid, type ContributionLevel } from "@/data/activity";

import {
  calculateContributionStats,
  type ContributionDay,
  type ContributionStats,
} from "./calendar-stats";

/**
 * Build-time GitHub contribution fetch.
 *
 * The site is a static export (`output: "export"`), so there is no runtime
 * server to proxy the GitHub API. Instead this runs inside the async home
 * page Server Component during `next build`, and the resulting grid is baked
 * into the static HTML.
 *
 * Data source: GitHub GraphQL `contributionsCollection`. It requires a
 * `GITHUB_TOKEN` in the build environment (any classic/fine-grained PAT with
 * default public read scope is enough — contribution data is public).
 *
 * Graceful degradation is mandatory: if the token is absent (local dev, a PR
 * CI build without the secret) or the request fails, we fall back to the
 * deterministic seeded grid and never break the build.
 */

export const GITHUB_USERNAME = "joshrlowe";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

export type ContributionSource = "github" | "placeholder";

export interface ContributionsData {
  /** 53 columns x 7 rows of 0–4 intensity levels, oldest week first. */
  weeks: ContributionLevel[][];
  /** Flat, day-level records (real data only; empty for the placeholder). */
  days: ContributionDay[];
  stats: ContributionStats;
  source: ContributionSource;
}

// GitHub's contributionLevel enum → our 0–4 scale.
const LEVEL_MAP: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

interface GraphQLDay {
  date: string;
  contributionCount: number;
  contributionLevel: string;
}

interface GraphQLResponse {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          weeks?: { contributionDays?: GraphQLDay[] }[];
        };
      };
    };
  };
  errors?: { message: string }[];
}

const CONTRIBUTIONS_QUERY = `
  query ContributionCalendar($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

/**
 * Pure transform: GitHub calendar weeks → our display shape. Exported for
 * unit testing without touching the network.
 */
export function mapCalendarToData(
  weeks: { contributionDays?: GraphQLDay[] }[],
): ContributionsData {
  const days: ContributionDay[] = [];
  const levelWeeks: ContributionLevel[][] = weeks.map((week) => {
    const columnDays = week.contributionDays ?? [];
    return columnDays.map((d) => {
      const level = LEVEL_MAP[d.contributionLevel] ?? 0;
      days.push({ date: d.date, count: d.contributionCount, level });
      return level;
    });
  });

  return {
    weeks: levelWeeks,
    days,
    stats: calculateContributionStats(days),
    source: "github",
  };
}

/** Deterministic seeded fallback — never touches the network. */
export function placeholderContributions(): ContributionsData {
  return {
    weeks: contributionGrid(),
    days: [],
    stats: { total: 0, bestDay: 0, currentStreak: 0 },
    source: "placeholder",
  };
}

/**
 * Fetch real contribution data at build time, falling back to the seeded grid.
 * Always resolves — errors are logged as warnings and never thrown, so the
 * static export cannot fail on a missing token or a flaky GitHub response.
 */
export async function getContributions(
  username: string = GITHUB_USERNAME,
): Promise<ContributionsData> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.warn(
      "[github] GITHUB_TOKEN not set — using seeded contribution placeholder. " +
        "Set GITHUB_TOKEN in the build environment for real data.",
    );
    return placeholderContributions();
  }

  try {
    const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // GitHub requires a User-Agent on all API requests.
        "User-Agent": "jlowe.ai-build",
      },
      body: JSON.stringify({
        query: CONTRIBUTIONS_QUERY,
        variables: { login: username },
      }),
    });

    if (!response.ok) {
      console.warn(
        `[github] contributions request failed (${response.status}) — using placeholder.`,
      );
      return placeholderContributions();
    }

    const payload = (await response.json()) as GraphQLResponse;

    if (payload.errors?.length) {
      console.warn(
        `[github] GraphQL errors — using placeholder: ${payload.errors
          .map((e) => e.message)
          .join("; ")}`,
      );
      return placeholderContributions();
    }

    const weeks =
      payload.data?.user?.contributionsCollection?.contributionCalendar?.weeks;

    if (!weeks?.length) {
      console.warn(
        "[github] contribution calendar was empty — using placeholder.",
      );
      return placeholderContributions();
    }

    return mapCalendarToData(weeks);
  } catch (error) {
    console.warn(
      `[github] contributions fetch threw — using placeholder: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return placeholderContributions();
  }
}

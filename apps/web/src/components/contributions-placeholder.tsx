import { type ContributionLevel } from "@/data/activity";
import {
  placeholderContributions,
  type ContributionsData,
} from "@/lib/github/contributions";
import { cn } from "@/lib/utils";

// Heat ramp runs the film palette: lifted-navy void → cobalt → a level-4
// square that burns starlight-white, like the nearest stars in the field.
const LEVEL_CLASS: Record<ContributionLevel, string> = {
  0: "bg-muted",
  1: "bg-cobalt/30",
  2: "bg-cobalt/55",
  3: "bg-cobalt/80",
  4: "bg-starlight",
};

interface ContributionsCalendarProps {
  /**
   * Contribution data resolved at build time (see lib/github/contributions).
   * Defaults to the seeded placeholder so the component renders safely without
   * a data source (e.g. in isolation tests).
   */
  data?: ContributionsData;
}

/**
 * Renders the GitHub contribution calendar. Data is fetched at build time and
 * baked into the static export; when no GITHUB_TOKEN is available the caller
 * passes the deterministic seeded grid instead, and the caption makes that
 * clear.
 */
export function ContributionsPlaceholder({
  data = placeholderContributions(),
}: ContributionsCalendarProps = {}) {
  const { weeks, stats, source } = data;
  const isLive = source === "github";

  return (
    <div
      aria-hidden={!isLive}
      className="overflow-hidden rounded-lg border border-border/60 p-4"
    >
      <div className="flex gap-[3px] overflow-x-auto">
        {weeks.map((week, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {week.map((level, d) => (
              <span
                key={d}
                className={cn("size-[9px] rounded-[2px]", LEVEL_CLASS[level])}
              />
            ))}
          </div>
        ))}
      </div>

      {isLive ? (
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <div className="flex gap-1.5">
            <dt>Total (past year):</dt>
            <dd className="font-mono font-medium text-foreground">
              {stats.total}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Best day:</dt>
            <dd className="font-mono font-medium text-foreground">
              {stats.bestDay}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Current streak:</dt>
            <dd className="font-mono font-medium text-foreground">
              {stats.currentStreak} {stats.currentStreak === 1 ? "day" : "days"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Every square represents a day of building, learning, and shipping.
          (Illustrative — live data arrives when the build runs with a GitHub
          token.)
        </p>
      )}
    </div>
  );
}

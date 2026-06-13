import { contributionGrid, type ContributionLevel } from "@/data/activity";
import { cn } from "@/lib/utils";

const LEVEL_CLASS: Record<ContributionLevel, string> = {
  0: "bg-muted",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
};

/**
 * Static, seeded stand-in for the GitHub contribution calendar — keeps the
 * exported site free of third-party API calls. Live data is a later phase.
 */
export function ContributionsPlaceholder() {
  const grid = contributionGrid();
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-lg border border-border/60 p-4"
    >
      <div className="flex gap-[3px]">
        {grid.map((week, w) => (
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
      <p className="mt-3 text-xs text-muted-foreground">
        Every square represents a day of building, learning, and shipping.
        (Illustrative — live data arrives with a later phase.)
      </p>
    </div>
  );
}

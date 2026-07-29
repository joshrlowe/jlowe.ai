import { FileText, Rocket, Wrench } from "lucide-react";

import { RECENT_ACTIVITY, type ActivityItem } from "@/data/activity";

const KIND_ICON: Record<ActivityItem["kind"], typeof Rocket> = {
  project: Rocket,
  article: FileText,
  update: Wrench,
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function ActivityStrip() {
  return (
    <ol className="relative space-y-6 border-l border-border/60 pl-6">
      {RECENT_ACTIVITY.map((item) => {
        const Icon = KIND_ICON[item.kind];
        return (
          <li key={`${item.date}-${item.title}`} className="relative">
            {/* Beacon marker: cobalt point with a soft starlight halo. */}
            <span className="absolute -left-[31px] flex h-2.5 w-2.5 items-center justify-center rounded-full bg-cobalt shadow-[0_0_8px_1px_rgb(42_99_255/0.7)]" />
            <div className="flex items-start gap-3">
              <Icon
                aria-hidden
                className="mt-0.5 size-4 text-muted-foreground"
              />
              <div>
                <p className="text-sm">{item.title}</p>
                <time
                  dateTime={item.date}
                  className="font-mono text-xs text-muted-foreground"
                >
                  {formatDate(item.date)}
                </time>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

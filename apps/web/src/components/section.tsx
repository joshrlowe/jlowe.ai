import { cn } from "@/lib/utils";

interface SectionProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Flat-site section. The heading speaks the site's diegetic HUD voice — the
 * mono-caps micro-label grammar of the world's transit notice — followed by a
 * hairline that fades from cobalt to nothing, like an instrument rule. The
 * heading stays a real <h2> (identical text, identical outline for AT);
 * body/description text stays normal-case and highly readable — the space
 * voice lives in labels, not prose.
 */
export function Section({
  title,
  description,
  className,
  children,
}: SectionProps) {
  return (
    <section className={cn("py-10", className)}>
      <div className="flex items-center gap-4">
        <h2 className="font-mono text-[11px] font-medium tracking-[0.35em] text-starlight uppercase">
          {title}
        </h2>
        <span
          aria-hidden
          className="h-px flex-1 bg-linear-to-r from-cobalt/50 via-starlight/15 to-transparent"
        />
      </div>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

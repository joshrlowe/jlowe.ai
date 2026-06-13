import { cn } from "@/lib/utils";

interface SectionProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function Section({
  title,
  description,
  className,
  children,
}: SectionProps) {
  return (
    <section className={cn("py-10", className)}>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

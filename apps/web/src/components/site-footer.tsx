import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { NAV_ITEMS, SOCIAL_LINKS } from "@/data/site";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="font-semibold">
            {SITE_NAME}
            <span className="text-cobalt">.</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{SITE_TAGLINE}</p>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Building intelligent systems and production-grade AI applications
            that solve real-world problems.
          </p>
          <ul className="mt-4 flex flex-wrap gap-4">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  rel="noopener noreferrer"
                  target={
                    social.href.startsWith("mailto:") ? undefined : "_blank"
                  }
                  className="text-sm text-muted-foreground transition-colors hover:text-starlight"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer">
          <p className="font-mono text-[10px] font-medium tracking-[0.35em] text-starlight uppercase">
            Navigation
          </p>
          <ul className="mt-3 space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <Separator />
      <p className="mx-auto w-full max-w-5xl px-4 py-6 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </p>
    </footer>
  );
}

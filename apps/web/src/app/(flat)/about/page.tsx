import type { Metadata } from "next";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  EDUCATION,
  EXPERIENCE,
  PROFESSIONAL_SUMMARY,
  SKILL_CATEGORIES,
} from "@/data/profile";

export const metadata: Metadata = {
  title: "About",
  description:
    "Josh Lowe — AI engineer and consultant. Background, skills, and experience.",
};

export default function AboutPage() {
  return (
    <div className="py-14">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        {PROFESSIONAL_SUMMARY}
      </p>

      <Separator className="my-8" />

      <Section title="Technical skills" className="py-4">
        <div className="grid gap-6 md:grid-cols-3">
          {SKILL_CATEGORIES.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-medium text-muted-foreground">
                {group.category}
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {group.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Experience" className="py-4">
        <ol className="space-y-6">
          {EXPERIENCE.map((entry) => (
            <li key={`${entry.organization}-${entry.role}`}>
              <p className="font-medium">
                {entry.role} ·{" "}
                <span className="text-muted-foreground">
                  {entry.organization}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{entry.period}</p>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {entry.summary}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Education" className="py-4 pb-16">
        <ul className="space-y-3">
          {EDUCATION.map((entry) => (
            <li key={entry.school}>
              <p className="font-medium">{entry.school}</p>
              <p className="text-sm text-muted-foreground">{entry.degree}</p>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

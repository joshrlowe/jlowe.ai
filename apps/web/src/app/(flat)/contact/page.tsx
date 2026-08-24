import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EMAIL, SOCIAL_LINKS } from "@/data/site";
import { SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Ready to bring AI to your business? Get in touch about your project.",
};

export default function ContactPage() {
  return (
    <div className="py-14 pb-20">
      <h1 className="text-3xl font-semibold tracking-tight">
        Let&apos;s build something{" "}
        <span className="text-cobalt [text-shadow:0_0_24px_rgb(42_99_255/0.55)]">
          amazing
        </span>
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Ready to bring AI to your business? I&apos;d love to hear about your
        project and explore how we can work together.
      </p>

      {/*
        The form is the primary path; the direct-line and social cards stay as
        the fallback for anyone who would rather not use a form (and as the
        escape hatch the form's own error state points at).
      */}
      <div className="mt-10 grid items-start gap-4 md:grid-cols-2">
        <ContactForm />

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact information</CardTitle>
              <CardDescription>The direct line.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{SITE_NAME}</p>
              <a
                href={`mailto:${EMAIL}`}
                className="block text-starlight underline-offset-4 hover:underline"
              >
                {EMAIL}
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connect with me</CardTitle>
              <CardDescription>Wherever you already are.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {SOCIAL_LINKS.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      rel="noopener noreferrer"
                      target={
                        social.href.startsWith("mailto:") ? undefined : "_blank"
                      }
                      className="group flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm transition-[border-color,box-shadow] hover:border-cobalt/60 hover:shadow-glow-sm"
                    >
                      <span>
                        <span className="font-medium">{social.label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {social.description}
                        </span>
                      </span>
                      <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-starlight" />
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

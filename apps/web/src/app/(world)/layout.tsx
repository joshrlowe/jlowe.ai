import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "World",
  description:
    "The explorable 3D journey through Josh Lowe's work — in construction.",
  robots: { index: false }, // until the world ships
};

export default function WorldLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}

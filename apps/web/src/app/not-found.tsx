import Link from "next/link";

import { Starfield } from "@/components/starfield";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-32 text-center">
      <Starfield />
      <p className="font-mono text-xs tracking-[0.35em] text-starlight uppercase">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        This page drifted off the map
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist — or hasn&apos;t
        been built into the world yet.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back home</Link>
      </Button>
    </main>
  );
}

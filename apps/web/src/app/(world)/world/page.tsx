import Link from "next/link";

import { Button } from "@/components/ui/button";

// Placeholder — PR3 replaces this with the client-only capability panel
// and the future 3D canvas mount point.
export default function WorldPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-32 text-center">
      <p className="text-sm font-medium text-primary">Velocity</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        The world is under construction
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        An explorable 3D journey is being built here, with a 2D mode that never
        gets left behind.
      </p>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/">Back to the flat site</Link>
      </Button>
    </main>
  );
}

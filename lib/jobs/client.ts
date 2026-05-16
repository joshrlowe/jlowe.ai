import { Inngest } from "inngest";
import { getConfig } from "@/lib/config";

const cfg = getConfig();

// Event typing flows through `Events` in `./events.ts` and is enforced at
// each `inngest.send()` call site rather than via a constructor generic
// (Inngest v4's generic now constrains the full options object, so the
// older `new Inngest<{ events: Events }>(...)` shape no longer fits).
export const inngest = new Inngest({
  id: "jlowe-ai",
  eventKey: cfg.inngestEventKey ?? undefined,
  signingKey: cfg.inngestSigningKey ?? undefined,
});

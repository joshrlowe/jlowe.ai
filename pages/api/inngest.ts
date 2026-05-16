import { serve } from "inngest/next";
import { inngest } from "@/lib/jobs/client";
import { regenerateEmbeddings } from "@/lib/jobs/regenerate-embeddings";

// Signing key is set on the Inngest client itself (lib/jobs/client.ts) — the
// serve handler picks it up from there, so we don't pass it again here.
export default serve({
  client: inngest,
  functions: [regenerateEmbeddings],
});

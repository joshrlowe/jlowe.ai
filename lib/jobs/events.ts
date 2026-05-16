import type { KnowledgeSourceType } from "@/lib/rag/sources";

/**
 * Typed event union for the jlowe.ai background-job platform.
 *
 * Adding a new event: append it here, then handle it in any function that
 * subscribes via the trigger list.
 */
export type Events = {
  "content/post.published": { data: { postId: string } };
  "content/post.updated": { data: { postId: string } };
  "content/post.deleted": { data: { postId: string } };
  "content/project.upserted": { data: { projectId: string } };
  "content/project.deleted": { data: { projectId: string } };
  "content/welcome.upserted": { data: Record<string, never> };
  "content/about.upserted": { data: Record<string, never> };
  "content/contact.upserted": { data: Record<string, never> };
  "knowledge/reindex.requested": {
    data: { sourceType?: KnowledgeSourceType; sourceId?: string };
  };
};

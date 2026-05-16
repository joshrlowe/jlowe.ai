/**
 * AWS Bedrock Titan Embeddings caller.
 *
 * Extracted so both the runtime query path (lib/rag/vector-search.ts) and the
 * indexing script (scripts/generate-embeddings.ts) share one client.
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const TITAN_MODEL_ID = "amazon.titan-embed-text-v2:0";
export const EMBEDDING_DIMENSIONS = 1024;
const NORMALIZE = true;

let _client: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  if (!_client) {
    const region = process.env.AWS_REGION || "us-east-1";
    _client = new BedrockRuntimeClient({ region });
  }
  return _client;
}

/**
 * Generate a 1024-dim embedding for the given text via Titan v2.
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const client = getClient();
  const body = JSON.stringify({
    inputText: text,
    dimensions: EMBEDDING_DIMENSIONS,
    normalize: NORMALIZE,
  });
  const response = await client.send(
    new InvokeModelCommand({
      modelId: TITAN_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: new TextEncoder().encode(body),
    })
  );
  if (!response.body) {
    throw new Error("Empty response body from Bedrock Titan Embeddings");
  }
  const decoded = new TextDecoder().decode(response.body);
  const parsed = JSON.parse(decoded);
  if (!Array.isArray(parsed.embedding)) {
    throw new Error("Invalid embedding in response");
  }
  return parsed.embedding as number[];
}

/**
 * Titan Text Embeddings V2 caller shared by `pnpm index` and query-time
 * `searchKnowledge()`. 1024-dim, `normalize: true`.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

export const TITAN_EMBED_MODEL_ID = "amazon.titan-embed-text-v2:0";
export const EMBEDDING_DIMENSIONS = 1024;

let client: BedrockRuntimeClient | undefined;

function getClient(): BedrockRuntimeClient {
  return (client ??= new BedrockRuntimeClient({
    region:
      process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1",
  }));
}

export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const inputText = text.trim();
  if (!inputText) {
    throw new Error("Cannot embed empty text");
  }
  const response = await getClient().send(
    new InvokeModelCommand({
      modelId: TITAN_EMBED_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText,
        dimensions: EMBEDDING_DIMENSIONS,
        normalize: true,
      }),
    }),
  );
  if (!response.body) {
    throw new Error("Empty response body from Bedrock Titan Embeddings");
  }
  const parsed: unknown = JSON.parse(new TextDecoder().decode(response.body));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("embedding" in parsed) ||
    !Array.isArray(parsed.embedding)
  ) {
    throw new Error("Invalid embedding in Titan response");
  }
  const embedding: number[] = [];
  for (const value of parsed.embedding) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error("Invalid embedding in Titan response");
    }
    embedding.push(value);
  }
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Titan embedding length ${embedding.length}, expected ${EMBEDDING_DIMENSIONS}`,
    );
  }
  return embedding;
}

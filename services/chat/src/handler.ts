import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

/**
 * @velocity/chat — the Bedrock-backed digital-twin chat backend. Phase 0 ships
 * a healthcheck only; retrieval + Bedrock calls land in a later phase. The
 * APIGatewayProxyHandlerV2 signature fits both an API Gateway HTTP API and a
 * Lambda Function URL, so the deployment shape stays open.
 *
 * All AI calls remain server-side here by construction — never in the client.
 */
export const handler: APIGatewayProxyHandlerV2 = async () => ({
  statusCode: 200,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ service: "chat", status: "ok", phase: 0 }),
});

import { createHash } from "node:crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

/** SHA-256 of the viewer IP. Never store the raw address. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`chat-ip:${ip}`).digest("hex");
}

export function viewerIp(event: APIGatewayProxyEventV2): string {
  return event.requestContext?.http?.sourceIp ?? "0.0.0.0";
}

export function viewerUserAgent(event: APIGatewayProxyEventV2): string | null {
  const value = event.headers?.["user-agent"] ?? event.headers?.["User-Agent"];
  return value ?? null;
}

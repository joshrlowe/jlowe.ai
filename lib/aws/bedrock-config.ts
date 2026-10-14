/**
 * Shared Bedrock client settings.
 *
 * On Vercel, AWS_ROLE_ARN switches the SDK to OIDC federation: the function's
 * Vercel-issued token is exchanged for short-lived credentials on that role,
 * so no long-lived AWS keys live in the project. Locally, leave AWS_ROLE_ARN
 * unset and set AWS_PROFILE (a profile from ~/.aws) or AWS_ACCESS_KEY_ID /
 * AWS_SECRET_ACCESS_KEY; the SDK's default chain picks either up.
 */

import type { BedrockRuntimeClientConfig } from "@aws-sdk/client-bedrock-runtime";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

/**
 * Claude Haiku 4.5 through the US cross-region inference profile. The bare
 * model id only supports INFERENCE_PROFILE invocation, and the older Claude
 * 3 / 3.5 ids this app used have reached end of life on Bedrock.
 */
export const CLAUDE_HAIKU_45_PROFILE_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0";

export function bedrockClientConfig(): BedrockRuntimeClientConfig {
  const roleArn = process.env.AWS_ROLE_ARN;
  return {
    // Vercel sets AWS_REGION to the function's region; pin it in project env
    // so calls stay in us-east-1 where the inference profile is authorized.
    region: process.env.AWS_REGION || "us-east-1",
    ...(roleArn ? { credentials: awsCredentialsProvider({ roleArn }) } : {}),
  };
}

/** True when OIDC federation, a named profile, or static keys are configured. */
export function hasAwsCredentials(): boolean {
  return Boolean(
    process.env.AWS_ROLE_ARN ||
    process.env.AWS_PROFILE ||
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  );
}

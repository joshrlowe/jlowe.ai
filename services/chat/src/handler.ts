import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

import {
  beaconContext,
  buildConverseMessages,
  parseChatRequest,
} from "./messages.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";

const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? "us.anthropic.claude-haiku-4-5-20251001-v1:0";
const client = new BedrockRuntimeClient({});

/**
 * Streaming digital-twin chat. Validates the request, grounds Claude in the
 * persona + corpus system prompt, and streams Bedrock ConverseStream text
 * deltas back through the Lambda response stream. **Fails open**: any error
 * still ends the stream with a friendly line + a structured log, so the UI
 * never hangs and no dependency failure breaks the response contract.
 */
export const handler = awslambda.streamifyResponse(
  async (event: APIGatewayProxyEventV2, responseStream) => {
    const stream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
    try {
      const req = parseChatRequest(event.body);
      const command = new ConverseStreamCommand({
        modelId: MODEL_ID,
        system: [{ text: SYSTEM_PROMPT + beaconContext(req.context) }],
        messages: buildConverseMessages(req.messages),
        inferenceConfig: { maxTokens: 800, temperature: 0.4 },
      });
      const response = await client.send(command);
      for await (const item of response.stream ?? []) {
        if ("contentBlockDelta" in item) {
          const text = item.contentBlockDelta?.delta?.text;
          if (text) stream.write(text);
        }
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          msg: "chat_failed",
          error: String(error),
        }),
      );
      stream.write(
        "\n\nSorry — I hit a snag answering that. Please try again in a moment.",
      );
    } finally {
      stream.end();
    }
  },
);

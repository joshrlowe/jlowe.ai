/**
 * Bedrock Client
 *
 * Singleton BedrockRuntimeClient and streaming chat with Claude.
 */

import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';

const CLAUDE_MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamUsage {
  inputTokens?: number;
  outputTokens?: number;
}

export interface ToolSpec {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface StreamChatParams {
  messages: Message[];
  systemPrompt: string;
  maxTokens?: number;
  temperature?: number;
  /** Tool definitions exposed to the model. Omit or empty for no tool use. */
  tools?: ToolSpec[];
  /** Fired exactly once on the first text delta. */
  onFirstToken?: () => void;
  /** Fired whenever the stream reports input/output token counts. Cumulative — last write wins. */
  onUsage?: (usage: StreamUsage) => void;
  /** Fired when the model emits a `tool_use` block (input fully assembled). */
  onToolUse?: (call: ToolCall) => void;
}

function assertCredentials(): void {
  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_REGION
  ) {
    throw new Error(
      'AWS credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION.'
    );
  }
}

export const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Stream chat response from Claude. Yields text chunks as they arrive.
 */
export async function* streamChatResponse(
  params: StreamChatParams
): AsyncGenerator<string> {
  const {
    messages,
    systemPrompt,
    maxTokens = 500,
    temperature = 0.7,
    tools,
    onFirstToken,
    onUsage,
    onToolUse,
  } = params;

  assertCredentials();

  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: [{ type: 'text' as const, text: m.content }],
  }));

  const requestBody: Record<string, unknown> = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: formattedMessages,
  };
  if (tools && tools.length > 0) {
    requestBody.tools = tools;
  }
  const body = JSON.stringify(requestBody);

  try {
    const response = await bedrockClient.send(
      new InvokeModelWithResponseStreamCommand({
        modelId: CLAUDE_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: new TextEncoder().encode(body),
      })
    );

    if (!response.body) {
      throw new Error('Empty response body from Bedrock');
    }

    let firstTokenFired = false;
    let currentToolBlock: { name: string; jsonBuf: string } | null = null;
    for await (const item of response.body) {
      if ('chunk' in item && item.chunk?.bytes) {
        // Bedrock streams Anthropic events; we care about message_start and
        // message_delta for token usage, content_block_delta for text, and
        // content_block_start/_delta(input_json_delta)/_stop for tool calls.
        // Schema: https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html
        const chunk = JSON.parse(
          new TextDecoder().decode(item.chunk.bytes)
        ) as {
          type?: string;
          delta?: { text?: string; type?: string; partial_json?: string };
          content_block?: { type?: string; name?: string };
          message?: { usage?: { input_tokens?: number; output_tokens?: number } };
          usage?: { input_tokens?: number; output_tokens?: number };
        };

        if (chunk.type === 'message_start' && chunk.message?.usage) {
          onUsage?.({
            inputTokens: chunk.message.usage.input_tokens,
            outputTokens: chunk.message.usage.output_tokens,
          });
        }

        if (
          chunk.type === 'content_block_start' &&
          chunk.content_block?.type === 'tool_use'
        ) {
          currentToolBlock = {
            name: chunk.content_block.name ?? 'unknown',
            jsonBuf: '',
          };
        }

        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta?.type === 'input_json_delta' &&
          currentToolBlock
        ) {
          currentToolBlock.jsonBuf += chunk.delta.partial_json ?? '';
        }

        if (chunk.type === 'content_block_stop' && currentToolBlock) {
          try {
            const input = currentToolBlock.jsonBuf
              ? (JSON.parse(currentToolBlock.jsonBuf) as Record<string, unknown>)
              : {};
            onToolUse?.({ name: currentToolBlock.name, input });
          } catch (err) {
            console.warn(
              '[bedrock] tool input JSON parse failed:',
              (err as Error).message,
            );
          }
          currentToolBlock = null;
        }

        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          if (!firstTokenFired) {
            firstTokenFired = true;
            onFirstToken?.();
          }
          yield chunk.delta.text;
        }

        if (chunk.type === 'message_delta' && chunk.usage) {
          onUsage?.({
            outputTokens: chunk.usage.output_tokens,
          });
        }
      }
      if ('modelStreamErrorException' in item && item.modelStreamErrorException) {
        const err = item.modelStreamErrorException as { message?: string };
        throw new Error(
          `Bedrock stream error: ${err.message || 'Unknown error'}`
        );
      }
      if ('throttlingException' in item && item.throttlingException) {
        const ex = item.throttlingException as { message?: string };
        console.warn('Bedrock throttled during stream:', ex.message);
        throw new Error(`Bedrock throttled: ${ex.message || 'Retry later'}`);
      }
      if ('validationException' in item && item.validationException) {
        const ex = item.validationException as { message?: string };
        throw new Error(`Bedrock validation error: ${ex.message || 'Invalid request'}`);
      }
    }
  } catch (err: unknown) {
    const error = err as Error & { name?: string; $metadata?: { httpStatusCode?: number } };
    if (error.name === 'AccessDeniedException') {
      throw new Error(
        'Access denied to Bedrock. Verify IAM permissions for bedrock:InvokeModelWithResponseStream.'
      );
    }
    if (error.name === 'ThrottlingException') {
      console.warn('Bedrock throttled, retry later');
      throw error;
    }
    if (error.name === 'ModelStreamErrorException') {
      throw new Error(
        `Bedrock stream interrupted: ${error.message || 'Unknown error'}`
      );
    }
    throw err;
  }
}

import type { Writable } from "node:stream";

/**
 * Ambient types for the AWS Lambda response-streaming globals the Node runtime
 * injects (`awslambda.streamifyResponse` / `awslambda.HttpResponseStream`),
 * which `@types/aws-lambda` does not declare.
 * Ref: docs.aws.amazon.com/lambda/latest/dg/config-rs.html
 */
declare global {
  namespace awslambda {
    interface ResponseStream extends Writable {
      setContentType(contentType: string): void;
    }

    namespace HttpResponseStream {
      function from(
        stream: ResponseStream,
        metadata: { statusCode?: number; headers?: Record<string, string> },
      ): ResponseStream;
    }

    function streamifyResponse<TEvent>(
      handler: (
        event: TEvent,
        responseStream: ResponseStream,
        context: unknown,
      ) => Promise<void>,
    ): (event: TEvent, context: unknown) => Promise<unknown>;
  }
}

export {};

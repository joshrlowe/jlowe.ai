import { vi } from "vitest";

export type ChatStreamCapture = {
  writes: string[];
  headers: Record<string, string> | undefined;
  ended: boolean;
};

const g = globalThis as typeof globalThis & {
  __chatCapture?: ChatStreamCapture;
};

g.__chatCapture ??= { writes: [], headers: undefined, ended: false };

export const chatStreamCapture: ChatStreamCapture = g.__chatCapture;

vi.stubGlobal("awslambda", {
  HttpResponseStream: {
    from: (_stream: unknown, meta: { headers?: Record<string, string> }) => {
      chatStreamCapture.headers = meta.headers;
      return {
        write: (s: string) => {
          chatStreamCapture.writes.push(s);
        },
        end: () => {
          chatStreamCapture.ended = true;
        },
        setContentType: () => {},
      };
    },
  },
  streamifyResponse: <T>(h: T) => h,
});

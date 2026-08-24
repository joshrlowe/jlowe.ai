import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "corpus-index",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

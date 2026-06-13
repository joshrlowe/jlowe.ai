import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "asset-pipeline",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

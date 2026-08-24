import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "contact",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

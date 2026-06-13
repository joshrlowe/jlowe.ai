// Shared flat-config fragment. Each workspace package imports this by relative
// path and runs eslint from its own directory (flat config does not cascade).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export const baseIgnores = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.next/**",
  "**/out/**",
  "**/coverage/**",
];

// Consumed by the repo root and the node-side workspaces (asset-pipeline,
// chat, scripts) — all run in Node, hence the node globals.
export default tseslint.config(
  { ignores: baseIgnores },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: globals.node } },
  {
    rules: {
      // Standing rule: no `any`, anywhere.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  prettier,
);

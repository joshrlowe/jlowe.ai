// Shared flat-config fragment. Each workspace package imports this by relative
// path and runs eslint from its own directory (flat config does not cascade).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export const baseIgnores = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.next/**",
  "**/out/**",
  "**/coverage/**",
];

export default tseslint.config(
  { ignores: baseIgnores },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Standing rule: no `any`, anywhere.
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  prettier,
);

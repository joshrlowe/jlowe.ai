// Root config: covers repo-root files and scripts/. Workspace packages have
// their own configs and are linted via `pnpm -r run lint`.
import globals from "globals";
import base from "./eslint.base.config.mjs";

export default [
  {
    ignores: [
      ".claude/**",
      "apps/**",
      "packages/**",
      "services/**",
      "infra/**",
      "corpus/**",
    ],
  },
  ...base,
  {
    files: ["scripts/**/*.mjs", "*.mjs"],
    languageOptions: { globals: globals.node },
  },
];

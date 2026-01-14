import nextConfig from "eslint-config-next";
import globals from "globals";

export default [
  // Global ignores (extend Next.js defaults)
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/e2e/visual.spec.ts-snapshots/**",
      "**/__mocks__/**",
      "**/__fixtures__/**",
      "**/__tests__/**",
      "**/e2e/**",
      "**/test-utils.jsx",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/jest.polyfills.js",
      "**/jest.setup.js",
    ],
  },
  // Next.js recommended config (flat config format)
  ...nextConfig,
  // Project-specific overrides
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
        React: "readonly",
        JSX: "readonly",
      },
    },
    rules: {
      // Relax some rules for this project
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
      // Disable React Compiler rules (new in eslint-config-next v16)
      // These are too strict for existing codebase patterns
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      // Allow anonymous default exports for API routes
      "import/no-anonymous-default-export": "off",
      "no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "no-console": "off",
    },
  },
  // TypeScript files (Playwright tests)
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-unused-vars": "off",
    },
  },
];

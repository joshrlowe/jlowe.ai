import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: "jsdom",

  // Required for MSW 2.x - customize export conditions
  testEnvironmentOptions: {
    customExportConditions: [""],
  },

  // Setup files - polyfills must load first (CommonJS) before ESM setup
  setupFiles: ["<rootDir>/jest.polyfills.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Test file patterns
  testMatch: ["**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)", "**/*.(test|spec).(js|jsx|ts|tsx)"],

  // Ignore patterns (.claude/ holds agent worktrees of other projects — without
  // the ignore, local `npm test` globs their vitest suites and fails)
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/e2e/",
    "<rootDir>/.claude/",
  ],

  // Module path aliases (matching jsconfig.json) and manual mocks
  moduleNameMapper: {
    // Strip explicit .js extension from @/ alias imports
    // (source files have been migrated to .ts but call sites still use .js)
    "^@/(.*)\\.js$": "<rootDir>/$1",
    // Strip explicit .js extension from relative imports
    "^(\\.{1,2}/.*)\\.js$": "$1",

    // Path aliases
    "^@/(.*)$": "<rootDir>/$1",

    // Three.js and related - prevent WebGL errors
    "^three$": "<rootDir>/__mocks__/three.js",
    "^@react-three/fiber$": "<rootDir>/__mocks__/@react-three/fiber.jsx",

    // Animation libraries
    "^gsap$": "<rootDir>/__mocks__/gsap.js",
    "^gsap/(.*)$": "<rootDir>/__mocks__/gsap.js",

    // External components
    "^react-github-calendar$": "<rootDir>/__mocks__/react-github-calendar.jsx",
    "^react-markdown$": "<rootDir>/__mocks__/react-markdown.jsx",
    "^remark-gfm$": "<rootDir>/__mocks__/remark-gfm.js",

    // Next.js
    "^next/navigation$": "<rootDir>/__mocks__/next/navigation.js",
    "^next/image$": "<rootDir>/__mocks__/next/image.jsx",

    // Database
    "^(\\.\\./)*lib/prisma(\\.js)?$": "<rootDir>/__mocks__/prisma.js",
    "^@prisma/client$": "<rootDir>/__mocks__/@prisma/client.js",

    // Observability
    "^langfuse$": "<rootDir>/__mocks__/langfuse.js",

    // CSS/Style mocks (for CSS modules if used)
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },

  // Coverage configuration
  collectCoverageFrom: [
    "components/**/*.{js,jsx,ts,tsx}",
    "pages/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],

  // Coverage thresholds - 70% minimum for all metrics
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },

  // Coverage reporters
  coverageReporters: ["text", "lcov", "html"],

  // Coverage output directory
  coverageDirectory: "<rootDir>/coverage",

  // Transform ignore patterns (for ESM packages)
  // MSW 2.x and its dependencies need to be transformed
  transformIgnorePatterns: [
    "node_modules/(?!(react-github-calendar|react-activity-calendar|msw|@mswjs|uuid)/)",
  ],

  // Module file extensions
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);

import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  coverageProvider:       "v8",
  testEnvironment:        "jsdom",
  // MSW v2 uses the "exports" field — tell jsdom to resolve the node/require variant
  testEnvironmentOptions: {
    customExportConditions: ["node", "require", "default"],
  },
  // Polyfill Web Fetch API (Response, Request, etc.) before jsdom starts
  setupFiles:         ["<rootDir>/jest.polyfills.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/*.test.[jt]s?(x)",
  ],
  testPathIgnorePatterns: [
    "/node_modules/", "/.next/", "/e2e/",
    // Mock helper files are not test suites
    "/__tests__/mocks/",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**",
    "!src/components/ui/**",
  ],
  coverageThreshold: {
    global: { branches: 60, functions: 70, lines: 70, statements: 70 },
  },
};

export default createJestConfig(config);

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json-summary"],
      exclude: ["src/**/*.test.ts", "src/client/**", "src/**/screen.ts"],
    },
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // The first run downloads a mongod binary for the in-memory test database.
    hookTimeout: 300_000,
  },
});

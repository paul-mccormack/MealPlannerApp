import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./tests/globalSetup.ts"],
    setupFiles: ["./tests/testSetup.ts"],
    fileParallelism: false,
    env: {
      DATABASE_URL: "file:../data/test.db",
    },
  },
});

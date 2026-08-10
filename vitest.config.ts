import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // The real "server-only" package throws unless resolved under
    // Next.js's "react-server" condition — see tests/helpers/server-only-stub.ts.
    alias: { "server-only": path.resolve(import.meta.dirname, "tests/helpers/server-only-stub.ts") },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Integration tests hit the real dev database sequentially (shared
    // fixtures, explicit cleanup) — parallel workers would race each
    // other's setup/teardown.
    fileParallelism: false,
    testTimeout: 20000,
  },
});

import { defineConfig } from "vitest/config";
import dotenv from "dotenv";
import { randomBytes } from "node:crypto";

dotenv.config({ quiet: true });
const { getTestDatabaseUrl } = require("./scripts/test-database.cjs") as {
  getTestDatabaseUrl: (environment: NodeJS.ProcessEnv) => string;
};
const testUrl = getTestDatabaseUrl(process.env);

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: testUrl,
      TEST_DATABASE_URL: testUrl,
      JWT_SECRET: randomBytes(32).toString("hex"),
      JWT_EXPIRES_IN: "7d",
      CORS_ALLOWED_ORIGINS: "http://localhost:5173",
      APP_TIMEZONE: "Asia/Kolkata",
      TRUST_PROXY_HOPS: "0",
    },
  },
});

import { afterAll, beforeAll, beforeEach } from "vitest";

// Production code is compiled by tsc before Vitest runs. This preserves the
// decorator metadata that routing-controllers needs (no extra test transformer).
const { AppDataSource } =
  require("../dist/database/data-source") as typeof import("../src/database/data-source");
const { Reading } =
  require("../dist/modules/readings/reading.entity") as typeof import("../src/modules/readings/reading.entity");
const { User } =
  require("../dist/modules/users/user.entity") as typeof import("../src/modules/users/user.entity");

let safeToClean = false;

beforeAll(async () => {
  if (process.env.NODE_ENV !== "test")
    throw new Error("Test mode is required.");
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl || process.env.DATABASE_URL !== testUrl ||
      !("url" in AppDataSource.options) || AppDataSource.options.url !== testUrl) {
    throw new Error("Tests must connect exclusively to TEST_DATABASE_URL.");
  }
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  const [{ database }] = (await AppDataSource.query(
    "SELECT current_database() AS database",
  )) as { database: string }[];
  const expectedDatabase = decodeURIComponent(new URL(testUrl).pathname.slice(1));
  if (database !== expectedDatabase) {
    throw new Error("Connected database does not match TEST_DATABASE_URL.");
  }
  await AppDataSource.runMigrations();
  safeToClean = true;
});

async function cleanTestData() {
  if (!safeToClean) throw new Error("Refusing cleanup: test database setup did not succeed.");
  await AppDataSource.getRepository(Reading)
    .createQueryBuilder()
    .delete()
    .execute();
  await AppDataSource.getRepository(User)
    .createQueryBuilder()
    .delete()
    .execute();
}

beforeEach(cleanTestData);

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    try {
      if (safeToClean) await cleanTestData();
    } finally {
      safeToClean = false;
      await AppDataSource.destroy();
    }
  }
});

import { afterAll, beforeAll, beforeEach } from "vitest";

// Production code is compiled by tsc before Vitest runs. This preserves the
// decorator metadata that routing-controllers needs (no extra test transformer).
const { AppDataSource } =
  require("../dist/database/data-source") as typeof import("../src/database/data-source");
const { Reading } =
  require("../dist/modules/readings/reading.entity") as typeof import("../src/modules/readings/reading.entity");
const { User } =
  require("../dist/modules/users/user.entity") as typeof import("../src/modules/users/user.entity");

beforeAll(async () => {
  if (process.env.NODE_ENV !== "test")
    throw new Error("Test mode is required.");
  const url = new URL(process.env.DATABASE_URL!);
  if (!/^\/[a-zA-Z0-9_]+_test$/.test(url.pathname))
    throw new Error("Unsafe test database name.");
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  const [{ database }] = (await AppDataSource.query(
    "SELECT current_database() AS database",
  )) as { database: string }[];
  if (database !== url.pathname.slice(1) || !database.endsWith("_test")) {
    throw new Error(
      "Connected database does not match the designated test database.",
    );
  }
  await AppDataSource.runMigrations();
});

beforeEach(async () => {
  // This database is exclusively for tests. Never point it at data you need.
  await AppDataSource.getRepository(Reading)
    .createQueryBuilder()
    .delete()
    .execute();
  await AppDataSource.getRepository(User)
    .createQueryBuilder()
    .delete()
    .execute();
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.getRepository(Reading)
      .createQueryBuilder()
      .delete()
      .execute();
    await AppDataSource.getRepository(User)
      .createQueryBuilder()
      .delete()
      .execute();
    await AppDataSource.destroy();
  }
});

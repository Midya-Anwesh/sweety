import "dotenv/config";
import "reflect-metadata";
import path from "node:path";
import { DataSource } from "typeorm";
import { env } from "../config/env";

const extension = path.extname(__filename) === ".ts" ? "ts" : "js";
const globPath = (...parts: string[]) =>
  path
    .resolve(...parts)
    .split(path.sep)
    .join("/");

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.DATABASE_URL,
  entities: [globPath(__dirname, "..", "**", `*.entity.${extension}`)],
  migrations: [globPath(__dirname, "migrations", "**", `*.${extension}`)],
  synchronize: false,
  migrationsRun: false,
  // PostgreSQL 14+ supplies gen_random_uuid() without installing an extension.
  uuidExtension: "pgcrypto",
  installExtensions: false,
  logging: false,
});

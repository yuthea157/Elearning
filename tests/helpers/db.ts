import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";

// Integration tests run against the real dev database (no separate test
// database is provisioned for this project) — every fixture this suite
// creates is prefixed (see helpers/fixtures.ts) and torn down in
// afterAll/afterEach, the same discipline used throughout manual
// verification during development.
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const testDb = new PrismaClient({ adapter });

export async function closeTestDb() {
  await testDb.$disconnect();
  await pool.end();
}

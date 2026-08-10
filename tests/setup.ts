import { config } from "dotenv";

// Vitest doesn't auto-load .env.local the way Next.js does — every other
// entry point in this repo (prisma.config.ts, prisma/seed.ts) loads it
// explicitly the same way.
config({ path: ".env.local" });

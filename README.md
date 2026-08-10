# Elearning

A production-architecture online learning platform — course discovery, video lessons,
progress tracking, quizzes, certificates, and instructor/admin tooling. Original branding and
content; inspired by the learning-platform category, not a clone of any specific product.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for stack decisions and rationale, and
[`docs/DATABASE.md`](docs/DATABASE.md) for the data model. Current build status (what's
implemented vs. what's next) is tracked at the bottom of `ARCHITECTURE.md`.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn components ·
Prisma ORM 7 · PostgreSQL · React Hook Form + Zod · TanStack Query · `jose` + `bcryptjs` auth

## Requirements

- Node.js 20+
- A PostgreSQL database (this project uses Supabase; any Postgres works)

## Installation

```bash
npm install
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

- `DATABASE_URL` — your PostgreSQL connection string. If you're using Supabase, use the
  **connection pooler** string (`...pooler.supabase.com`), not the direct `db.<ref>.supabase.co`
  host — the direct host is IPv6-only and unreachable from many networks/CI runners.
  **Use the pooler's transaction-mode port, `6543`, with `?pgbouncer=true` appended** —
  not the session-mode port `5432`. Session mode caps concurrent clients low (Supabase's
  free tier: 15) and a serverless host like Vercel opens far more concurrent connections
  than that under real traffic; deploying with the session-mode URL 500s on the first page
  that hits the database under any concurrency (`EMAXCONNSESSION`). Local dev works fine on
  either port at low concurrency, but there's no reason to run a different pooling mode
  locally than in production, so use `6543?pgbouncer=true` everywhere.
- `SESSION_SECRET` — generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `NEXT_PUBLIC_APP_URL` — used to build links in emails and Stripe checkout redirects.
  Defaults to `http://localhost:3000`.
- `STRIPE_SECRET_KEY` — test-mode secret key from Stripe Dashboard → Developers → API keys.
  Course purchases and Premium subscriptions won't work without it.
- `STRIPE_WEBHOOK_SECRET` — without a public URL, Stripe can't deliver real webhooks to a
  local dev server. Either run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
  (Stripe CLI) and use the secret it prints, or generate a local-only one and simulate events
  yourself with `node -e "console.log('whsec_' + require('crypto').randomBytes(24).toString('hex'))"`
  (see `docs/ARCHITECTURE.md` → "Payments" for how this was verified without a tunnel).

## Database setup

```bash
npx prisma migrate dev   # applies migrations, generates the Prisma client
npx prisma db seed       # loads realistic demo data (20 courses, instructors, students, ...)
```

`npx prisma studio` opens a visual data browser if you want to inspect the seeded data.

## Development

```bash
npm run dev
```

Visit `http://localhost:3000`. Demo accounts (see seed output for the full list, password
`Password123` for all of them):

- `alex-morgan@elearning.dev` — student, with in-progress courses and a completed certificate
- `maya-chen@elearning.dev` — instructor
- `admin@elearning.dev` — admin

## Testing

Three tiers, all run against your real `DATABASE_URL` (no separate test database is
provisioned) — see `docs/ARCHITECTURE.md` → "Testing" for the rationale and the fixture/cleanup
conventions each tier follows.

```bash
npm test              # unit tests only (fast, no DB I/O)
npm run test:unit     # same as above
npm run test:integration  # integration tests against the real DB
npm run test:e2e      # Playwright end-to-end tests (starts the dev server if not already running)
npm run test:watch    # unit tests in watch mode
```

Before running e2e tests for the first time, install its browser binary:

```bash
npx playwright install chromium
```

Unit and integration fixtures are prefixed `vitest-fixture-` and cleaned up in `afterAll` hooks.
E2e fixtures are prefixed `e2e-` and removed automatically by a Playwright global teardown
(`tests/e2e/global-teardown.ts`) after the suite finishes, so repeated runs don't accumulate
junk users/courses in the database.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check without emitting |
| `npm test` / `npm run test:unit` | Unit tests (Vitest) |
| `npm run test:integration` | Integration tests against the real DB (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npx prisma studio` | Visual database browser |
| `npx prisma migrate dev --name <name>` | Create + apply a new migration |

## Production build

```bash
npm run build
npm run start
```

## Deployment

Deployed on [Vercel](https://vercel.com), connected to this GitHub repo. Uses the standard
Vercel + Next.js integration — no custom build config needed (`next build` is auto-detected).

**Environment variables** (Project → Settings → Environment Variables): the same ones listed
above under **Environment variables**, plus set `NEXT_PUBLIC_APP_URL` to the deployed URL
(not `localhost`) once you know it. `DATABASE_URL` must use the pooler's transaction-mode
port (`6543?pgbouncer=true`) — see the note above; the session-mode port works for local dev
but 500s under real concurrency on a serverless host.

**Stripe webhook**: after the first deploy, add a webhook endpoint in the Stripe Dashboard
pointing at `https://<your-domain>/api/webhooks/stripe`, then update `STRIPE_WEBHOOK_SECRET`
in Vercel to the signing secret it gives you — the one generated for local simulated testing
won't verify real events.

**Auto-deploy on push**: connecting the GitHub repo in the Vercel dashboard (Project →
Settings → Git) makes every push to `master` deploy automatically. This needs a one-time
browser authorization (installing/permitting the Vercel GitHub App for the repo) that can't
be done from the CLI alone — `vercel git connect` will fail with a generic "Failed to
connect" error until that's granted. Without it, deploy manually with `vercel --prod`.

# Architecture

## Repository state at project start

This was a genuinely empty workspace (only a requirements document). No existing framework,
package manager, or conventions to preserve — so the stack below was chosen fresh, per the
brief's own "if the repository is empty, create an appropriate production-ready architecture"
instruction.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript | Server Components for data-heavy pages (course detail, dashboard) without shipping that data-fetching code to the client; Server Actions give real, typed mutations without a separate API layer. |
| Styling | Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`) | Design tokens live as CSS custom properties in `src/app/globals.css`, consumed via `@theme inline`. |
| Component system | shadcn (registry-based, not a runtime dependency) — components are generated into `src/components/ui` and owned by the app | Accessible primitives (built on Radix/Base UI) without a black-box UI library; every component is editable source, not a `node_modules` dependency. |
| Database | PostgreSQL (Supabase), via Prisma ORM 7 | Relational modeling fits this domain well (see `DATABASE.md`); Prisma 7's driver-adapter architecture (`@prisma/adapter-pg`) avoids the Rust query engine binary. |
| Auth | Hand-rolled: `bcryptjs` password hashing + `jose`-signed JWT session cookie | No third-party auth vendor lock-in; every piece (hashing, session issuance, RBAC) is inspectable application code, matching "avoid unnecessary dependencies." |
| Data fetching | Server Components for initial page data; TanStack Query reserved for client-side interactive data (not yet needed until Phase 4+ features like quiz-taking) | Avoids double-fetching: page data comes from the server render, not a client `useEffect`. |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) | Client-side validation for instant feedback; the same Zod schemas double as the server action's authoritative validation, so client and server never disagree about what's valid. |
| Icons | lucide-react | One consistent icon family throughout, per the design system requirement. |

## Design system

Original visual identity — not a generic Tailwind/shadcn starter palette. Primary is a
deep indigo (`#4338ca` light / `#818cf8` dark) chosen for "intelligent, premium, trustworthy";
amber is reserved as an accent for ratings and achievement moments only, not used as a second
primary. Background is a warm off-white rather than cold gray. Full token list and rationale
live as a comment block at the top of `src/app/globals.css`.

Dark mode is a first-class theme (via `next-themes`), not an inverted light theme — every
token has its own dark-mode value, not a CSS filter.

## Review vs. Rating

The requirements doc lists `Review` and `Rating` as separate entities, but section 23
("REVIEWS AND RATINGS") describes one feature: a 1–5 star rating plus optional written text,
editable, one per user per course. Modeling these as two tables would mean either a forced
1:1 relationship (redundant) or an ambiguous "rating without a review" state the product never
actually needs. `Review` carries both `rating: Int` and `comment: String?` in one row.

## Progress integrity

Course/lesson progress is never accepted as a raw percentage from the client (brief section 13:
"Prevent users from arbitrarily claiming completion by manipulating frontend state"). The
intended flow (implemented for lesson-level tracking now, course-level rollup to follow in
Phase 3's learning player work):

1. Client reports discrete, verifiable events — "this lesson's video reached position N" or
   "this lesson was marked complete" — never "the course is 40% done."
2. A server action validates the event against the enrollment and lesson, writes
   `LessonProgress`.
3. `CourseProgress.percentComplete` is a server-recomputed rollup (completed lessons ÷ total
   lessons for that course), not a value the client can set directly.
4. `CourseCompletion` is a separate, immutable event row — written once, when the rollup
   server-side hits 100% — which is what a `Certificate` references. This keeps "current state"
   (mutable `CourseProgress`) and "the historical fact that a completion happened"
   (`CourseCompletion`) from being the same mutable row.

## Video architecture

`Video.provider` is an explicit enum (`MUX | S3 | YOUTUBE | VIMEO`), not inferred from a URL
shape. The player component will read `provider` and delegate to a provider-specific adapter,
so switching providers later is a new adapter, not a rewrite of every page that renders video.
Seed data uses `YOUTUBE` with a placeholder video as a stand-in for real uploaded/transcoded
content — no video files are stored in the repository.

## Payments (Phase 7)

Implemented and verified end-to-end against real Stripe test-mode infrastructure — not
simulated. Everything Stripe-specific is isolated under `src/lib/billing/` (`stripe-client.ts`,
`customer.ts`, `checkout.ts`, `webhook.ts`); nothing else in the app imports the `stripe`
package directly, so swapping providers later means rewriting that one directory, not hunting
through pages and actions.

**Checkout** uses inline `price_data` on the Checkout Session rather than pre-created Stripe
Price objects — no product catalog to keep in sync on the Stripe side. Individual course
purchases (`mode: "payment"`) create a `PENDING` `Order` *before* redirecting to Stripe, so
there's a row to reconcile against even if the customer abandons checkout; the webhook is
what ever flips it to `PAID`, never the client returning from a redirect. Premium
subscriptions (`mode: "subscription"`) use a flat rate defined in `src/lib/billing/plans.ts`.
Enrollment gating (`enrollAction`, `src/app/actions/learning.ts`) checks for an `ACTIVE`
`Subscription` before allowing a non-free course to be enrolled without payment — everything
else must go through `startCourseCheckoutAction` instead.

**Webhooks** (`/api/webhooks/stripe`) verify the signature against the raw request body
before doing anything else — a parsed-then-restringified body would never match Stripe's
signature. Idempotency is enforced via `Payment.idempotencyKey` (unique, set to the Stripe
event id): `checkout.session.completed` and `invoice.payment_succeeded` are the two event
types that create a `Payment` row, so those two check for an existing row with that event id
before doing anything, and no-op if found. `customer.subscription.updated/deleted` don't
create a `Payment` and don't need the same guard — Stripe's subscription events always carry
the full current state, so reapplying one twice is a no-op by construction, not something to
special-case.

**How this was actually verified**, since this app has no public URL for Stripe to send real
webhooks to: checkout session creation and completion were tested against Stripe's real
test-mode API — a genuine Checkout Session was created, driven through Stripe's actual hosted
payment page with a Playwright browser using Stripe's `4242 4242 4242 4242` test card, and
completed for real (test-mode, no real money). The resulting webhook, which Stripe couldn't
deliver to `localhost`, was reconstructed from the real completed Session object returned by
the Stripe API and signed with `stripe.webhooks.generateTestHeaderString()` using a
locally-generated `STRIPE_WEBHOOK_SECRET`, then POSTed directly to the app's own webhook
route — exercising the real signature-verification and event-handling code, just simulating
delivery rather than receiving it over the internet. This covered: course purchase → `Order`
PAID + `Enrollment` created; the identical event replayed → confirmed no duplicate `Payment`
or `Enrollment` (idempotency); subscription checkout → `Subscription` ACTIVE + a second
premium course enrollable without a new payment; `invoice.payment_succeeded` → renewal
recorded; `customer.subscription.deleted` → `Subscription` EXPIRED and a *third*, not-yet-
enrolled premium course correctly fell back to requiring purchase again. The billing portal
(`ManageBillingButton` → `openBillingPortalAction`) was also verified for real — it requires a
Customer Portal configuration to exist on the Stripe account (Dashboard → Settings → Billing),
which this test account already had.

One real account-configuration issue surfaced during verification, not a code bug: this
Stripe account has *Managed Payments* (Stripe-as-merchant-of-record) on by default, which
requires a tax code per product — not meaningful for ad-hoc `price_data` line items with no
pre-registered Product. Both checkout session calls pass `managed_payments: { enabled: false }`
to opt out, per Stripe's own suggested fix in the error message.

## Email

`src/lib/email/index.ts` is the abstraction boundary — `sendPasswordResetEmail`,
`sendWelcomeEmail`, etc. Right now the implementation logs to the console instead of calling a
provider, which keeps auth flows (password reset in particular) fully functional in local
development without requiring email credentials. Swapping in a real provider means changing
`sendEmail`'s body only.

## Route protection

Next.js 16 renamed `middleware.ts` to `src/proxy.ts`; that's what runs on every request here.
It does one thing: an optimistic, cookie-only check (decrypt the JWT, no DB call) that
redirects unauthenticated visitors away from protected prefixes (`/dashboard`, `/learn`,
`/instructor`, `/admin`, `/saved`, `/settings`) and redirects already-authenticated visitors
away from the auth pages. This is a UX optimization, not the real authorization boundary —
every Server Component and Server Action that needs auth calls `verifySession`/`requireRole`
from `src/lib/auth/dal.ts`, which does hit the database and is what actually decides whether
an action is allowed. Role checks (`INSTRUCTOR`/`ADMIN` only) are not done in `proxy.ts` at
all, precisely because "never rely exclusively on hiding UI elements" — they belong in the DAL.

## Project structure

```
src/
  app/
    (public)/        marketing + discovery pages, wrapped in Navbar + Footer
    (app)/            authenticated app shell (dashboard, saved, ...), Navbar only
    actions/          Server Actions (mutations) — the only place forms submit to
    api/              route handlers for things that aren't a page or a mutation
    login/, register/, forgot-password/, reset-password/   standalone auth pages
  components/
    ui/               shadcn-generated primitives — do not hand-edit the generated shape
    layout/           navbar, footer, mobile nav, search
    course/            course card, rating stars, filters
    home/, dashboard/, auth/   feature-scoped composition components
  lib/
    auth/             session (JWT), password hashing, DAL (verifySession/requireRole)
    data/             read-side data access, grouped by domain (courses, users, dashboard)
    schemas/          Zod schemas shared between client-side RHF validation and server actions
    email/            provider-agnostic email abstraction
    prisma.ts         Prisma Client singleton (dev-mode HMR-safe)
prisma/
  schema.prisma
  seed.ts
docs/
```

`src/lib/data/*` is the repository/data-access layer: every Prisma query for reads lives
there, not inline in page components. Server Actions in `src/app/actions/*` are the
service/mutation layer: validation → authorization → write. Pages stay thin — they call one or
two data functions and render.

## What's implemented vs. what's next

**Done (Phase 1–3, plus a Phase 4 slice):** repository structure, database schema (~40
models covering every entity in the brief), migrations, design system + component library,
email/password auth with sessions and RBAC scaffolding, route protection, landing page,
category browsing data layer, course discovery with URL-synced filters, course detail page
with real enroll/bookmark actions, student dashboard, realistic seed data (20 courses, 6
instructors, 4 students, reviews, progress, 3 learning paths).

The full learning loop is implemented and verified end-to-end (register → enroll → watch →
complete → certificate): the learning player (`/learn/[courseSlug]/[lessonId]`) with a real
YouTube IFrame API-driven player (genuine position polling and resume, not simulated),
provider-agnostic per `Video.provider`; server-validated lesson completion and course-progress
rollup (`src/lib/services/progress.ts` — the one place `CourseProgress.percentComplete` is
ever written, never accepted from the client); transcript search/seek; notes (add, jump to
timestamp, delete); server-graded quizzes (`QuizOption.isCorrect` is withheld from the
initial page load via `omit`, so the answer key can't just be read from page source — grading
happens entirely in `submitQuizAction`); certificate issuance on 100% completion with a public
verification page at `/certificates/[certificateCode]`.

**Instructor workflows (Phase 5)** are also implemented and verified end-to-end: instructor
dashboard (`/instructor`) with course list and aggregate stats; course creation; a course
editor (`/instructor/courses/[id]/edit`) with a metadata form and a curriculum manager
(sections and lessons, reorderable via up/down — not drag-and-drop, a deliberate scope
decision, see below); an inline quiz question builder (single-choice, 2–6 options); and a
publish/unpublish toggle that validates a course has a description and at least one lesson
before allowing publish. All course mutations check `instructorId` ownership (or `ADMIN`) via
`requireRole`, never trusting a course ID alone. Video content is added by pasting a YouTube
video ID — consistent with the video-provider abstraction, and honest about there being no
upload/transcoding pipeline (real object storage + processing is out of scope here; see
"File uploads" in the original brief).

Two real bugs were caught during this phase's own verification, not simulated: (1) `Decimal`
objects (Prisma's arbitrary-precision type for `price`/`averageRating`) can't cross the
Server→Client Component boundary as props — Next throws at render time — so `price` is
converted to a plain `number` before being passed to `CourseMetadataForm`. (2) `FormData.get()`
returns `null` for a field that isn't present in the submitted form at all (as opposed to
present-but-empty, which is `""`), which broke validation for the video-ID field (only
rendered for VIDEO-type lessons) and the quiz question's explanation field (no input for it
at all) — both were using Zod's `.optional()`, which only accepts `undefined`. Fixed by
switching those two fields to `.nullish()`, and audited every other `.optional()` in the
codebase to confirm none of the rest share the bug (they're all either always-rendered fields
or already coerced at the call site).

Deliberately out of scope for this pass: drag-and-drop reordering (up/down buttons cover the
same need with far less client-side complexity), a rich text editor for descriptions (plain
textarea), and multi-select quiz questions in the builder (the schema and grading logic
already support `MULTIPLE_CHOICE`; only the instructor-facing builder UI is single-choice
for now).

**Admin dashboard (Phase 6)** is implemented and verified end-to-end: platform overview
(`/admin`) with aggregate stats and "needs attention" surfacing of pending moderation/reports;
user management (`/admin/users`) — suspend/reactivate, blocking a suspended user's next login
attempt at the credential-check step in `loginAction`, not just hiding UI; course management
(`/admin/courses`) — feature/unfeature, a moderation-status control
(PENDING/APPROVED/REJECTED/SUSPENDED) that immediately pulls a course out of every public
listing query, since they all filter on `(status: PUBLISHED, moderationStatus: APPROVED)`
together, and an **Edit** link into the full instructor course editor (metadata form +
curriculum manager + quiz builder) for *any* instructor's course, not just an admin's own;
category management (`/admin/categories`) — create/**rename/reparent**/delete, with delete
refusing to run while courses still reference the category rather than silently orphaning
them; review
moderation (`/admin/reviews`) and report resolution (`/admin/reports`). Every admin mutation
writes an `AuditLog` row (actor, action, target) — the first real use of that model, which
existed in the schema since Phase 2 but had nothing writing to it yet.

To make the moderation loop genuinely testable end-to-end (not just built and assumed to
work), a minimal "report a review" action was added on the student side too — the brief lists
it as a student capability but it hadn't been built yet. A single report flags a review
(`REPORTED`) for admin attention without hiding it from the page; only an explicit admin
`REMOVED` action does that. Hiding on first report would make reporting itself a censorship
vector — anyone could hide any review by reporting it once.

All of Phase 6 is authorized server-side via `requireRole("ADMIN")` in both the
`/admin` layout (`requirePageRole`, a redirect for page loads) and every individual mutation
(`requireRole`, a thrown error for the mutation itself) — the layout check alone would satisfy
"don't show the UI to non-admins," but per the brief's explicit instruction ("never rely
exclusively on hiding UI elements"), the mutations re-check independently so a crafted direct
request to a server action can't bypass the page-level gate.

### Admin editing of courses and categories

Phase 6 originally shipped course *moderation* (feature/status) and category
*creation/deletion*, but not editing either one's actual content — a real gap once an admin
needs to fix a typo'd title or reorganize the category tree without going through an
instructor's own account.

**Courses**: rather than build a second, parallel course-editing UI, the admin **Edit** link
on `/admin/courses` reuses the existing instructor course editor at
`/instructor/courses/[id]/edit` — its Server Actions (`updateCourseAction`,
`setCoursePublishedAction`, the curriculum and quiz-builder actions) already had an `ADMIN`
bypass in their ownership check (`course.instructorId !== user.id && user.role !== "ADMIN"`),
added defensively back in Phase 5 but never actually reachable, since nothing linked to the
edit page for a course an admin didn't own. The one real gap: `getCourseForEdit` — the
Server Component data loader — hard-filtered `where: { id: courseId, instructorId }`, so even
though the action layer would have accepted the mutation, an admin opening the page for
someone else's course got `notFound()` before ever reaching a form. Fixed by adding an
`isAdmin` parameter that drops the `instructorId` filter when true, passed as
`user.role === "ADMIN"` from the page.

**Categories**: added `updateCategoryAction` (rename + reparent), mirroring
`createCategoryAction`'s slug regeneration (only re-slugs if the name actually changed, and
excludes the row being edited from the uniqueness check via `NOT: { id: categoryId }` — the
create path's `uniqueSlugFor` didn't need this since a new row never conflicts with itself).
Guards against two structurally-invalid states the 2-level category hierarchy the rest of the
UI assumes can't handle: a category can't be set as its own parent, and a category that
already has subcategories can't be made a subcategory itself (the parent `<Select>` is
disabled with an explanatory note when this applies, rather than allowing the submit and
failing server-side only).

Verified with 3 new Playwright e2e tests (`tests/e2e/admin-editing.spec.ts`), each creating
and cleaning up its own fixture rather than touching seed data permanently. Two things the
verification pass caught that a lighter check would have missed:

1. A locator bug in the *test itself*, not the app: `page.locator("tr", { hasText: parentName })`
   matched two rows, not one — the category table's "Parent" column renders a child row's
   parent name as plain text, so a row-hasText match for "Parent Category" hits both the
   parent's own row and every child's row. `.first()` silently grabbed the wrong one (alphabetical
   DOM order put the child first), so the "can't be made a subcategory" assertion was checking
   the child's (correctly-enabled) parent selector, not the parent's (correctly-disabled) one —
   passing for the wrong reason. Fixed by scoping to `tr:has(td:first-child:text-is("..."))`,
   which only matches the Name column.
2. A single flaky failure on the course-edit test's post-`page.reload()` assertion, where the
   reloaded page briefly showed the pre-edit subtitle. A follow-up manual Playwright script
   (bypassing the test framework, run immediately after) confirmed the edit *had* actually
   persisted — proving this was a one-off dev-server/Turbopack render-timing race, not a real
   persistence bug — but the failed test run's own revert step never got to run (the test
   throws before reaching it), which left the seed course's subtitle sitting in an edited state.
   That got restored by hand, and the test was hardened with `expect(...).toPass({ timeout: 15000 })`
   wrapping the reload+assert, so a future transient render race retries instead of failing —
   while still failing for real if the data is actually wrong (`toPass` only rescues the timing
   window, not incorrect assertions).

## Search & recommendations (Phase 8)

Category detail (`/categories/[slug]`) and instructor profile (`/instructors/[username]`)
pages were built — both were already linked from the course detail page, navbar, and footer,
so those were previously dead 404s, not new surface area.

Recommendations (`src/lib/services/recommendations.ts`) are explicitly rule-based, not
machine learning — the brief is direct about this ("do not pretend recommendations are
AI-generated if they are not"). Signal comes from a user's own enrollments and bookmarks: the
categories and skills of courses they've already shown interest in. Candidates are scored
(category match weighted higher than a shared skill, ties broken by rating) and a new user
with no signal yet — or an anonymous visitor — falls back to plain trending courses. Verified
against real seed data: a student enrolled/bookmarked across Design, Software Development,
Data, and Leadership courses got recommendations exclusively from those same categories, not
generic popular content. The same category/skill-overlap query, scoped to one course instead
of a user, powers "Related courses" on the course detail page. Because it's one isolated
module with a narrow signature (`userId → courses`), swapping in a real ML-ranked model later
means replacing this file, not hunting through every page that shows recommendations.

Search history is logged from an actual client-side search submission
(`logSearchAction`, called from `SearchInput`'s `onSubmit`), deliberately *not* from the
`/search` results page's own render — a page render is a GET and Next.js can trigger it
speculatively (`Link` prefetching) without the user having really searched, so a write
embedded in that render would log phantom searches and violates GET's read-only semantics
regardless. The empty-query state on `/search` (recent searches + popular categories) replaces
what used to be a dead-end "start typing" placeholder.

## Notifications

`createNotification` (`src/lib/services/notifications.ts`) is the one place a `Notification`
row is ever written, and the first thing it does is check the user's own
`NotificationPreference` row for the relevant category — a disabled preference makes it a
silent no-op, not an error, and a user with no preference row yet (shouldn't happen; one is
created alongside every new account) defaults to enabled, matching that model's own
`@default(true)` on every field. Wired into: course completion and certificate issuance
(`recomputeCourseProgress`, since both fire from the same event), and subscription started /
payment failed / ended (`src/lib/billing/webhook.ts`). The subscription-status notifications
only fire on an actual state *transition* (comparing the subscription's stored status against
the new one before deciding to notify) — Stripe can send `customer.subscription.updated`
repeatedly for a subscription that's already `ACTIVE`, and that shouldn't renotify every time.

The navbar's notification bell (unread count + dropdown) is a Server Component fetching
count and recent rows, same split as `UserMenu` — the interactive parts (mark-read,
mark-all-read) live in a client child. Verified end-to-end: completing a course produced
exactly two notifications (completion + certificate) with a "2 unread" badge; opening the
dropdown and marking all read cleared it; a real subscription checkout (Phase 7's Stripe
integration, same simulated-webhook approach) produced a "Welcome to Premium" notification;
and toggling a preference off in Settings persisted across a reload.

## Testing (Phase 9)

Three tiers, chosen to match what each is actually good at rather than picking one framework
for everything:

- **Unit (Vitest, `tests/unit/`)** — pure functions, no DB, no Next.js request context. Covers
  Zod schemas (including a regression test for the `FormData.get()` returns `null`-not-
  `undefined` bug from Phase 5 curriculum forms — `.optional()` rejects `null`, `.nullish()`
  doesn't), and four business-logic modules extracted specifically to make them testable
  without mocking cookies/session: `src/lib/services/quiz-grading.ts`,
  `progress-calculation.ts`, `recommendation-scoring.ts`, `enrollment-eligibility.ts`. Each was
  pulled out of a Server Action/service that used to inline the logic alongside DB calls — the
  Server Action now calls the pure function and does only I/O.
- **Integration (Vitest, `tests/integration/`)** — exercises real logic against the real
  Supabase database (no separate test DB is provisioned for this project). Covers progress →
  completion → certificate issuance (including idempotency on re-run), Stripe webhook handling
  (`src/lib/billing/stripe-client` is mocked via `vi.mock`, dynamically imported after the mock
  call so hoisting order is correct — this tests the webhook *handler's* DB effects
  deterministically; the real Stripe integration itself was verified manually in Phase 7 via an
  actual Checkout completion and a signature-verified simulated event delivery), notification
  preference gating, and DB constraints (unique/cascade behavior).
- **E2e (Playwright, `tests/e2e/`)** — full browser flows against `npm run dev`: student
  register → enroll → complete → certificate; a graded quiz; instructor course authoring →
  publish → student discovery; admin user suspension and course moderation (with real,
  re-verified effects — suspension actually blocks login, moderation actually removes a course
  from search — not just a badge change). `workers: 1` and `fullyParallel: false` because specs
  share one dev database and would otherwise race each other's fixtures.

**Fixture discipline**: everything this suite creates is either cleaned up automatically or
scoped to data safe to leave behind — the same principle used for every ad hoc verification
script earlier in this project.

- Unit/integration fixtures use a `vitest-fixture-` prefix (`tests/helpers/fixtures.ts`) and are
  deleted in `afterAll`. Deletion order matters: courses before users, since
  `Course.instructorId` has no cascade and deleting the user first throws a foreign-key
  violation.
- E2e fixtures use an `e2e-` prefix and are removed by a Playwright `globalTeardown`
  (`tests/e2e/global-teardown.ts`), which runs once after the whole suite finishes rather than
  per-spec — the admin and instructor specs deliberately touch shared seed data mid-run (a
  seeded course's moderation status, a real user's suspension state) and restore it themselves
  before the spec ends, so per-spec teardown would be the wrong granularity.

**Running `server-only`-guarded modules under Vitest**: Next.js normally resolves the
`server-only` npm package via internal bundler magic; outside that, importing it throws
unconditionally, which breaks Vitest since it isn't Next's bundler. Fixed by installing
`server-only` as a real dependency and aliasing it to a no-op stub
(`tests/helpers/server-only-stub.ts`) via `resolve.alias` in `vitest.config.ts` — a pattern
reusable for any future server-only module under test.

See the README's "Testing" section for the actual commands.

## Production hardening (Phase 10)

A pass over every module specifically looking for things that are fine in
development but not safe or complete to ship, run after the app was already
feature-complete and fully tested. Found and fixed:

- **No security headers** — `next.config.ts` now sets `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, and a `Content-Security-Policy` scoped to what the
  app actually uses (`frame-src` allows only `youtube.com` for the lesson
  player, `img-src` allows only the seed-data placeholder image hosts plus
  YouTube thumbnails, `connect-src` allows `api.stripe.com`). Verified with
  `curl -I` against a running server, and the full e2e suite (which drives
  the YouTube-embedded player) still passes with the CSP active.
- **No brute-force protection on auth** — `loginAction`, `registerAction`,
  and `requestPasswordResetAction` had no throttling at all. Added an
  in-memory fixed-window limiter (`src/lib/auth/rate-limit.ts`): 10
  logins/15min, 10 registrations/hour, 5 password-reset requests/hour, keyed
  by IP (`x-forwarded-for`/`x-real-ip`). The limiter itself
  (`checkRateLimit`) is a pure function with its own unit tests
  (`tests/unit/rate-limit.test.ts`); it's wrapped by `enforceRateLimit`,
  which only enforces when `NODE_ENV === "production"` — otherwise dev work
  and the e2e suite (which logs in and registers repeatedly from the same
  machine well past any threshold still meaningful for stopping real
  credential stuffing) would start failing on their own repeated use.
  **Caveat to revisit before scaling past a single instance**: this is
  in-memory, so it resets on every redeploy and doesn't share state across
  multiple instances — swap for a distributed store (e.g. Upstash Redis)
  if/when this deploys to more than one process.
- **Unbranded crash pages** — Next's default error/404 screens are generic
  and don't match the design system. Added `src/app/not-found.tsx` (reuses
  the existing `EmptyState` component), `src/app/error.tsx` (same, with a
  retry button), and `src/app/global-error.tsx` (deliberately plain inline
  styles, no design-system imports — it's the fallback for when the root
  layout itself throws, so it can't assume anything else rendered
  successfully).
- **No SEO surface** — added `src/app/sitemap.ts` (published courses +
  categories, pulled live from the DB) and `src/app/robots.ts`
  (disallowing the authenticated-only areas). `sitemap.ts` is marked
  `export const dynamic = "force-dynamic"` — it was originally left as a
  static route and broke the production build: Next prerenders static
  routes across many parallel build workers, and that concurrent DB access
  exhausted Supabase's session-pooler connection cap (`EMAXCONNSESSION`,
  15 max). Every other DB-backed route in this app is already dynamic for
  the same underlying reason (real-time data, not build-time snapshots),
  so this just brings the sitemap in line with that existing pattern.
- **Production build had never actually been run** — every phase up to
  this point was verified against `npm run dev` only. Running
  `npm run build` for the first time is what surfaced the sitemap issue
  above; it now completes cleanly.

**Known gaps still open, deliberately not faked shut:**

- **Email is stubbed** (`src/lib/email/index.ts` logs instead of sending) —
  password reset and welcome emails don't reach real inboxes until a
  provider (Resend/SES/Postmark) and its API key are wired in. The
  abstraction is already in place; only the implementation needs swapping.
- **No object storage / upload pipeline** — course thumbnails/avatars are
  placeholder-hosted images (`picsum.photos`, `i.pravatar.cc`) and lesson
  video content is YouTube-video-ID-only (see Phase 5 notes above). Out of
  scope for this pass; needs real storage credentials to build.
- **Stripe is in test mode** — switching to live payments needs a live
  secret key, a live webhook endpoint secret from a real public URL
  (Stripe can't reach `localhost`), and a decision on `managed_payments`
  for the live account.

## Site settings, About page, certificate verification, and icon color

Three previously-missing pieces, all requested together: admin-editable
footer/About content, and a real certificate-verification tool — plus a
broader visual pass adding color and hover interactivity to icons across
the site, which had been uniformly `bg-primary-subtle text-primary`
everywhere with no variation since Phase 1.

**Discovered while scoping, not assumed**: the footer already linked to
`/about` and `/certificates` ("Verify a certificate") — both 404'd. This
wasn't new scope invented from nothing; it closed two dead links that had
been sitting in production-facing navigation.

**`SiteSettings`** is a new single-row model (`prisma/schema.prisma`),
lazily created on first read via `getSiteSettings()` (same pattern as
`DocumentSequence`-style lazy rows elsewhere in this app) rather than
seeded — `aboutTitle`/`aboutContent` for `/about`, `footerTagline` +
optional `footerCopyright` override + optional `twitterUrl`/`linkedinUrl`/
`githubUrl` for the footer. Editable at `/admin/settings`
(`updateSiteSettingsAction`), gated the same way as every other admin
mutation (`requireRole("ADMIN")` in the action, `requirePageRole` in the
shared `/admin` layout). Saving calls `revalidatePath("/", "layout")`
since the footer renders on every route under the `(public)` route
group's layout — there's no single page path to target for a
shared-layout revalidation, so root-down is the only way to bust it
without enumerating every public page.

**About page** (`/about`) renders the admin-edited title/content
(paragraphs split on blank lines — plain text, no rich-text editor, matching
this app's existing plain-textarea convention for course descriptions)
plus a live stats strip (published courses / instructors / students, via
a new `getPublicPlatformStats()` — deliberately separate from
`lib/data/admin.ts`'s fuller `getPlatformStats()`, which includes
moderation/report counts that shouldn't be exposed to anonymous
visitors) and reuses the homepage's `<Benefits />` section rather than
duplicating that content.

**Certificate verification** (`/certificates`) is a plain `method="GET"`
form (`?code=...`) — works without client JS and makes a result
shareable/linkable, consistent with this app's URL-synced-filters
pattern used for course discovery. Reuses `getCertificateByCode`, already
built for the existing `/certificates/[certificateCode]` detail page. That
detail page's behavior changed too: it used to `notFound()` on an unknown
code (a hard 404), which reads as "broken link" rather than "not
verified" — exactly the wrong signal for a trust tool. It now redirects
to `/certificates?code=...`, landing on the same friendly "Not a valid
certificate" state the search page shows for a bad lookup.

**Icon color system** (`src/components/ui/icon-badge.tsx`): a curated
6-hue rotation (indigo/violet/emerald/rose/sky/amber) for decorative icon
badges, deliberately kept separate from the core design tokens in
`globals.css` — those stay reserved for interactive UI and specific
semantic meaning (per the existing "Design system" note above, amber
means ratings/achievements specifically). `IconBadge` never appears on a
button, link styling, or anything carrying UI state; it's purely the
colored-circle-behind-an-icon decoration on category tiles, benefit
tiles, dashboard stat tiles, and footer social links.
`iconBadgeColorForIndex(i)` cycles the palette across a grid so no item
picks its own arbitrary color. Every badge also does
`group-hover:scale-110 group-hover:rotate-6` (needs `className="group"`
on the containing card/link) for the "interactive" half of the request —
opt out via `interactive={false}` for icons with no hoverable ancestor
(used on the About page's static hero icon). Applied to: homepage
category grid and benefits section, dashboard stat tiles and
certificate/achievement grids, the footer's social links, and the About
page's stat strip. Deliberately *not* applied to the admin nav's icon set
(kept calm/monochrome, matching admin surfaces generally) or anywhere
already carrying semantic color (success/warning/destructive text).

**lucide-react has no brand-logo icons** (Twitter/X, LinkedIn, GitHub were
removed from the core package in the installed v1.x) — the footer's
social links use neutral stand-ins instead (`MessageCircle` /
`Briefcase` / `Code2`), not a lookalike of any specific brand's mark.

**Real bug caught by verification, not assumed away**: after regenerating
the Prisma client for the new `SiteSettings` model, every page using
`getSiteSettings()` 500'd with `Cannot read properties of undefined
(reading 'findFirst')` — `prisma.siteSettings` was `undefined` at
runtime despite `tsc --noEmit` passing clean and the generated types
being correct on disk. Cause: the dev server's `prisma` singleton
(`src/lib/prisma.ts`, `globalForPrisma.prisma`) is deliberately held
across Turbopack HMR reloads to avoid exhausting the connection pool —
but that means it's also held across a `prisma generate` run made while
the server keeps running. The already-running process's `PrismaClient`
class was built from the pre-migration schema and never picks up new
model delegates without a full process restart. Fixed by killing and
restarting `next dev`, not by changing any application code — worth
knowing as a standing gotcha: **any `prisma migrate`/`generate` while the
dev server is running requires restarting it**, the singleton pattern
will otherwise silently keep serving the stale client shape.

12 new automated tests (8 unit — `siteSettingsSchema` validation
including the min-length/optional-URL rules — plus 4 e2e covering
settings persistence to the real public pages, validation rejecting a
too-short about body instead of silently saving it, route protection for
a non-admin, and certificate verification for both a real seeded
certificate and a bogus code via both the search form and the direct
detail-page URL) — 89 unit / 17 integration / 15 e2e total, all passing,
alongside a clean production build.

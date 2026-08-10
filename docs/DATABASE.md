# Database

PostgreSQL via Prisma ORM 7 (driver adapter, `@prisma/adapter-pg` — no Rust query engine
binary). Schema: `prisma/schema.prisma`. Migrations: `prisma/migrations/`.

## Entity groups

**Identity & access** — `User`, `Profile`, `InstructorProfile`, `Session`,
`EmailVerificationToken`, `PasswordResetToken`. `User.role` (`STUDENT | INSTRUCTOR | ADMIN`)
drives authorization everywhere; there's no separate `Role` table because roles here are a
fixed, small enum, not a dynamic permission system — adding a `Role` table would be exactly
the kind of unnecessary abstraction section 62 warns against. If per-permission granularity is
ever needed, that's the point to introduce one, not before.

**Catalog** — `CourseCategory` (self-referential, one level of hierarchy via `parentId`),
`CourseSkill` + `CourseSkillOnCourse` (many-to-many), `Course`, `CourseSection`, `Lesson`,
`Video`, `Transcript` + `TranscriptSegment`, `Resource`.

`Lesson` has both `sectionId` (its real parent) and a denormalized `courseId`. This is
deliberate, not an oversight: nearly every progress/analytics query needs "all lessons for
this course" without joining through sections first, and a lesson never moves between courses,
so the denormalization can't drift.

**Quizzes** — `Quiz` (1:1 with a `Lesson`), `QuizQuestion`, `QuizOption`, `QuizAttempt`,
`QuizAnswer`. `QuizAnswer` is many-to-many with `QuizOption` (not a single `selectedOptionId`)
specifically to support `MULTIPLE_CHOICE` questions. Correctness is never stored redundantly
on the answer — it's always derived from `QuizOption.isCorrect` at grading time, so there's
one source of truth for "which options are correct."

**Enrollment & progress** — `Enrollment`, `LessonProgress`, `CourseProgress`,
`CourseCompletion`, `Certificate`. See `ARCHITECTURE.md` → "Progress integrity" for why
`CourseProgress` (mutable rollup) and `CourseCompletion` (immutable event) are separate models.

**Reviews, bookmarks, notes** — `Review` (rating + text combined, see `ARCHITECTURE.md`),
`Bookmark`, `UserNote`.

**Learning paths** — `LearningPath`, `LearningPathCourse` (ordered join), `UserLearningPath`.
A user's path-level progress is intentionally *not* a stored column — it's derived from
`CourseProgress` across the path's courses, so it can never drift out of sync with the
courses' own progress.

**Notifications & billing** — `Notification`, `NotificationPreference`, `Subscription`,
`Order`, `Payment`. `Order` represents an individual course purchase; a `Subscription` is the
premium-plan relationship. Both can produce a `Payment`, which is why `Payment` has optional
FKs to both rather than being owned by one or the other.

**Achievements, search, analytics** — `Achievement`, `UserAchievement`, `SearchHistory`,
`UserActivity`. `UserActivity.metadata` is the one deliberate `Json` column in the schema —
analytics event payloads genuinely vary by `type`, and relationalizing every possible event
shape up front would mean a schema migration for every new event type. Every other model
prefers real columns and relations.

**Moderation & audit** — `Report` (courses, reviews, or users), `AuditLog` (sensitive admin
actions only — not a general request log, to keep it actually useful for its purpose).

## Conventions

- IDs: `cuid()` everywhere, not auto-increment integers — avoids leaking row counts/creation
  order through the URL, and makes IDs safe to generate client-side later if ever needed.
- Soft delete: only on `User` and `Course` (`deletedAt`) — the two entities where "delete"
  needs to preserve history (a deleted instructor's past reviews/enrollments/certificates must
  stay valid) rather than the two dozen join/log tables where a hard delete via `onDelete:
  Cascade` is the correct and simpler behavior.
- Money: `Decimal` (`@db.Decimal(10, 2)`), never `Float` — avoids floating-point rounding on
  currency.
- Every "has this user done X for Y" relationship (`Bookmark`, `Review`, `Enrollment`,
  `CourseProgress`, `CourseCompletion`, `UserAchievement`, `UserLearningPath`,
  `LessonProgress`) has a `@@unique([userId, ...])` constraint — the database enforces
  "once per user," not just application code.
- Indexes are on the columns actual page queries filter/sort by: `Course` on
  `(status, moderationStatus)` (every public listing filters on both), `isFeatured`,
  `instructorId`, `categoryId`; activity/notification tables on `(userId, createdAt)` for
  reverse-chronological feeds.

## Seed data

`prisma/seed.ts` — idempotent (uses `upsert` throughout, safe to re-run). Creates 10
categories, 18 skills, 1 admin, 6 instructors, 4 students, 20 published courses with real
sections/lessons/quizzes, reviews, one student's enrollments/progress/a completed
certificate, bookmarks, 3 achievements, and 3 learning paths. All course titles, instructor
names, and testimonials are fictional — none of it is copied from LinkedIn Learning or any
other real platform's catalog.

Run it: `npx prisma db seed` (or `npx tsx prisma/seed.ts` directly). Demo logins are printed
at the end of the run; all seeded accounts share the password `Password123`.

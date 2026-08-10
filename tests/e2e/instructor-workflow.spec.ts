import { test, expect } from "@playwright/test";

/** Uses the seeded instructor account (maya-chen) rather than registering
 * a fresh one, since registration always creates a STUDENT — there's no
 * self-serve "become an instructor" flow yet (see docs/ARCHITECTURE.md). */
test("instructor can create a course, build its curriculum, publish it, and a student can find and enroll in it", async ({ page }) => {
  const suffix = Date.now();
  const courseTitle = `E2E Instructor Course ${suffix}`;

  await page.goto("/login");
  await page.fill("#email", "maya-chen@elearning.dev");
  await page.fill("#password", "Password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");

  await page.goto("/instructor/courses/new");
  await page.fill("#title", courseTitle);
  await page.getByLabel("Category").click();
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: "Create course" }).click();
  await page.waitForURL(/\/instructor\/courses\/.+\/edit/);

  await page.getByPlaceholder(/New section title/).fill("Getting Started");
  await page.getByRole("button", { name: "Add section" }).click();
  await expect(page.getByText("Getting Started")).toBeVisible({ timeout: 10000 });

  await page.getByPlaceholder("Lesson title").first().fill("Welcome");
  await page.getByPlaceholder("Minutes").first().fill("5");
  await page.getByPlaceholder(/YouTube video ID/).first().fill("dQw4w9WgXcQ");
  await page.getByRole("button", { name: "Add lesson" }).first().click();
  await expect(page.getByRole("button", { name: "Adding…" })).toBeHidden({ timeout: 20000 });
  await expect(page.getByText("Welcome")).toBeVisible({ timeout: 10000 });

  await page.getByRole("tab", { name: "Course details" }).click();
  await page.locator("#description").fill("An end-to-end test course covering the instructor authoring workflow.");
  await page.getByRole("button", { name: "Save changes" }).click();
  // No dedicated "saved" toast on this form — give the mutation time to land before publishing.
  await page.waitForTimeout(2000);

  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible({ timeout: 10000 });

  // A different user (a fresh student) should be able to discover and enroll.
  await page.context().clearCookies();
  await page.goto("/register");
  await page.fill("#name", "E2E Discovering Student");
  await page.fill("#username", `e2e-discover-${suffix}`);
  await page.fill("#email", `e2e-discover-${suffix}@example.com`);
  await page.fill("#password", "TestPass123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");

  await page.goto(`/search?q=${encodeURIComponent(courseTitle)}`);
  const courseLink = page.getByRole("link", { name: new RegExp(courseTitle) }).first();
  await expect(courseLink).toBeVisible();
  await courseLink.click();
  await expect(page.getByText("Welcome")).toBeVisible();
  await page.getByRole("button", { name: /Enroll for free/i }).click();
  await expect(page.getByRole("link", { name: /Continue learning/i })).toBeVisible({ timeout: 10000 });
});

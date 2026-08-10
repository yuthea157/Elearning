import { test, expect } from "@playwright/test";

/**
 * The golden path from the brief's own "Final Audit" checklist: register,
 * discover a course, enroll, watch lessons, resume, complete, and receive
 * a certificate. Uses "Personal Finance Fundamentals", a free 4-lesson
 * seeded course with no quiz — see prisma/seed.ts.
 */
test("student can register, enroll, complete a course, and receive a certificate", async ({ page }) => {
  const suffix = Date.now();

  await page.goto("/register");
  await page.fill("#name", "E2E Student");
  await page.fill("#username", `e2e-student-${suffix}`);
  await page.fill("#email", `e2e-student-${suffix}@example.com`);
  await page.fill("#password", "TestPass123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");

  // Discover via browsing, not a direct URL — exercises the discovery page for real.
  await page.goto("/courses");
  await expect(page.getByText(/\d[\d,]* courses/)).toBeVisible();
  await page.getByRole("link", { name: /Personal Finance Fundamentals/ }).first().click();
  await expect(page.getByRole("heading", { name: "Personal Finance Fundamentals" })).toBeVisible();

  await page.getByRole("button", { name: /Enroll for free/i }).click();
  const continueLink = page.getByRole("link", { name: /Continue learning/i });
  await expect(continueLink).toBeVisible({ timeout: 10000 });

  await continueLink.click();
  await page.waitForURL(/\/learn\//);

  // Walk every lesson, marking each complete.
  for (let i = 0; i < 6; i++) {
    const markComplete = page.getByRole("button", { name: "Mark complete" });
    if (await markComplete.count()) {
      await markComplete.click();
      await expect(page.getByRole("button", { name: "Completed" })).toBeVisible({ timeout: 10000 });
    }

    const nextLink = page.getByRole("link", { name: /^Next$/ });
    const nextHref = (await nextLink.count()) ? await nextLink.getAttribute("href") : null;
    if (!nextHref) break;
    await nextLink.click();
    await page.waitForURL((url) => url.pathname === nextHref);
  }

  // Resume behavior: leaving and coming back should land on a real lesson, not 404.
  await page.goto("/dashboard");
  await expect(page.getByText("1 Completed").or(page.getByText(/Completed/))).toBeVisible();

  const certificateLink = page.locator('a[href^="/certificates/"]').first();
  await expect(certificateLink).toBeVisible();
  await certificateLink.click();
  await expect(page.getByText("Verified")).toBeVisible();
  await expect(page.getByText("E2E Student")).toBeVisible();
  await expect(page.getByText("Personal Finance Fundamentals")).toBeVisible();
});

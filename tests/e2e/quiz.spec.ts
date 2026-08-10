import { test, expect } from "@playwright/test";

/**
 * "SQL for Everyone" (seeded, free) has a quiz lesson — "Knowledge check"
 * in its second section, "Combining Data". Seed data always makes the
 * first answer option the correct one (see prisma/seed.ts).
 */
test("student can take a quiz and see server-graded results", async ({ page }) => {
  const suffix = Date.now();

  await page.goto("/register");
  await page.fill("#name", "E2E Quiz Taker");
  await page.fill("#username", `e2e-quiz-${suffix}`);
  await page.fill("#email", `e2e-quiz-${suffix}@example.com`);
  await page.fill("#password", "TestPass123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");

  await page.goto("/courses/sql-for-everyone");
  await page.getByRole("button", { name: /Enroll for free/i }).click();
  await expect(page.getByRole("link", { name: /Continue learning/i })).toBeVisible({ timeout: 10000 });
  await page.reload();

  // The curriculum accordion keeps one section open at a time — expand the one with the quiz.
  await page.getByRole("button", { name: /Combining Data/i }).click();
  const quizLink = page.getByRole("link", { name: /Knowledge check/i }).first();
  await quizLink.waitFor({ timeout: 10000 });
  await quizLink.click();
  await page.waitForURL(/\/learn\//);

  await expect(page.getByRole("button", { name: "Submit quiz" })).toBeVisible();

  // Seed data always makes the first option the correct answer.
  await page.locator('button[role="radio"]').first().click();
  const submitButton = page.getByRole("button", { name: "Submit quiz" });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page.getByText("You passed!")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/Score: \d+%/)).toBeVisible();
});

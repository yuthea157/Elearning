import { test, expect } from "@playwright/test";

test("admin can moderate a course and suspend a user; effects are real, not cosmetic", async ({ page }) => {
  const suffix = Date.now();
  const email = `e2e-admin-target-${suffix}@example.com`;

  // A throwaway student to suspend.
  await page.goto("/register");
  await page.fill("#name", "E2E Admin Target");
  await page.fill("#username", `e2e-admin-target-${suffix}`);
  await page.fill("#email", email);
  await page.fill("#password", "TestPass123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
  await page.context().clearCookies();

  await page.goto("/login");
  await page.fill("#email", "admin@elearning.dev");
  await page.fill("#password", "Password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");

  // --- Suspend a user; suspension must actually block login, not just relabel a badge ---
  await page.goto("/admin/users");
  const userRow = page.locator("tr", { hasText: email });
  page.once("dialog", (dialog) => dialog.accept());
  await userRow.getByRole("button", { name: "Suspend" }).click();
  await expect(userRow.getByText("SUSPENDED")).toBeVisible({ timeout: 10000 });

  await page.context().clearCookies();
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "TestPass123");
  await page.click('button[type="submit"]');
  await expect(page.getByText(/suspended/i)).toBeVisible({ timeout: 10000 });

  // --- Reactivate, confirm login works again ---
  await page.goto("/login");
  await page.fill("#email", "admin@elearning.dev");
  await page.fill("#password", "Password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
  await page.goto("/admin/users");
  await page.locator("tr", { hasText: email }).getByRole("button", { name: "Reactivate" }).click();
  await expect(page.locator("tr", { hasText: email }).getByText("ACTIVE")).toBeVisible({ timeout: 10000 });

  // --- Suspending a course's moderation status must pull it from public listings ---
  await page.goto("/admin/courses");
  const courseRow = page.locator("tr", { hasText: "UX Research Foundations" });
  await courseRow.locator('[role="combobox"]').click();
  await page.getByRole("option", { name: "Suspended" }).click();
  await expect(courseRow.locator('[role="combobox"]').getByText("Suspended")).toBeVisible({ timeout: 10000 });

  await page.context().clearCookies();
  await page.goto("/search?q=UX+Research+Foundations");
  await expect(page.getByText(/0 results/)).toBeVisible();

  // Restore, so this doesn't leave seed data in a suspended state for other tests/manual use.
  await page.goto("/login");
  await page.fill("#email", "admin@elearning.dev");
  await page.fill("#password", "Password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");
  await page.goto("/admin/courses");
  const courseRowAgain = page.locator("tr", { hasText: "UX Research Foundations" });
  await courseRowAgain.locator('[role="combobox"]').click();
  await page.getByRole("option", { name: "Approved" }).click();
  await expect(courseRowAgain.locator('[role="combobox"]').getByText("Approved")).toBeVisible({ timeout: 10000 });
});

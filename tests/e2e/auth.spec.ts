import { test, expect } from "@playwright/test";

test.describe("authentication and route protection", () => {
  test("register, logout, and log back in", async ({ page }) => {
    const suffix = Date.now();
    const email = `e2e-auth-${suffix}@example.com`;

    await page.goto("/register");
    await page.fill("#name", "E2E Auth User");
    await page.fill("#username", `e2e-auth-${suffix}`);
    await page.fill("#email", email);
    await page.fill("#password", "TestPass123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
    await expect(page.getByText(/Welcome back, E2E/)).toBeVisible();

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL("/login");

    await page.fill("#email", email);
    await page.fill("#password", "TestPass123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("anonymous visitors are redirected away from protected routes", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/login?next=%2Fdashboard");
  });

  test("a logged-in user is redirected away from the login page", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "alex-morgan@elearning.dev");
    await page.fill("#password", "Password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    await page.goto("/login");
    await page.waitForURL("/dashboard");
  });

  test("a STUDENT is redirected away from instructor and admin areas", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "alex-morgan@elearning.dev");
    await page.fill("#password", "Password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    await page.goto("/instructor");
    await page.waitForURL("/dashboard");

    await page.goto("/admin");
    await page.waitForURL("/dashboard");
  });
});

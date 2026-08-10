import { test, expect } from "@playwright/test";

test.describe.serial("admin site settings and certificate verification", () => {
  test("admin can edit About/footer content and it appears on the public site", async ({ page }) => {
    const suffix = Date.now();
    const aboutTitle = `E2E About Title ${suffix}`;
    const aboutContent = `E2E about body paragraph for run ${suffix}, long enough to pass validation.`;
    const tagline = `E2E tagline ${suffix}`;

    await page.goto("/login");
    await page.fill("#email", "admin@elearning.dev");
    await page.fill("#password", "Password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    await page.goto("/admin/settings");
    const originalAboutTitle = await page.locator("#aboutTitle").inputValue();
    const originalAboutContent = await page.locator("#aboutContent").inputValue();
    const originalTagline = await page.locator("#footerTagline").inputValue();

    await page.fill("#aboutTitle", aboutTitle);
    await page.fill("#aboutContent", aboutContent);
    await page.fill("#footerTagline", tagline);
    await page.getByRole("button", { name: "Save settings" }).click();
    await page.waitForLoadState("networkidle");

    // Real persistence, not cosmetic — confirm from a fresh navigation to
    // the actual public pages that render this content, not just the form.
    await expect(async () => {
      await page.goto("/about");
      await expect(page.locator("h1")).toHaveText(aboutTitle);
      await expect(page.getByText(aboutContent)).toBeVisible();
    }).toPass({ timeout: 15000 });

    await expect(async () => {
      await page.goto("/");
      await expect(page.locator("footer").getByText(tagline)).toBeVisible();
    }).toPass({ timeout: 15000 });

    // Restore, so this doesn't leave shared settings altered for other tests/manual use.
    await page.goto("/admin/settings");
    await page.fill("#aboutTitle", originalAboutTitle);
    await page.fill("#aboutContent", originalAboutContent);
    await page.fill("#footerTagline", originalTagline);
    await page.getByRole("button", { name: "Save settings" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#aboutTitle")).toHaveValue(originalAboutTitle);
  });

  test("rejects settings that fail validation instead of saving them", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@elearning.dev");
    await page.fill("#password", "Password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    await page.goto("/admin/settings");
    await page.fill("#aboutContent", "too short");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText(/at least 20 characters/i)).toBeVisible({ timeout: 10000 });
  });

  test("a student cannot reach the admin settings page", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "alex-morgan@elearning.dev");
    await page.fill("#password", "Password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    await page.goto("/admin/settings");
    await page.waitForURL("/dashboard");
  });

  test("certificate verification confirms a real certificate and rejects a bogus one", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "alex-morgan@elearning.dev");
    await page.fill("#password", "Password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    const certLink = page.locator('a[href^="/certificates/"]').first();
    await expect(certLink).toBeVisible({ timeout: 10000 });
    const href = await certLink.getAttribute("href");
    const realCode = href!.split("/certificates/")[1];

    await page.context().clearCookies();

    // Search form, real code — must show the verified banner and real course/student details.
    await page.goto("/certificates");
    await page.getByLabel("Certificate ID").fill(realCode);
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByText(/Verified — this certificate was issued by E-Learning/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Alex Morgan")).toBeVisible();

    // Search form, bogus code — must show the not-valid state, not a crash or a false positive.
    await page.goto("/certificates");
    await page.getByLabel("Certificate ID").fill("TOTALLY-BOGUS-CODE");
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByText("Not a valid certificate")).toBeVisible({ timeout: 10000 });

    // Direct /certificates/[code] URL for a bogus code redirects to the same friendly state
    // instead of a hard 404.
    await page.goto("/certificates/ANOTHER-BOGUS-CODE");
    await page.waitForURL(/\/certificates\?code=/);
    await expect(page.getByText("Not a valid certificate")).toBeVisible({ timeout: 10000 });
  });
});

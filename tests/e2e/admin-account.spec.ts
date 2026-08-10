import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@elearning.dev";
const ADMIN_PASSWORD = "Password123";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
}

// Serial: the password-change test genuinely mutates the shared demo admin
// account's real password, and restores it at the end — running these out
// of order or in parallel with another spec that logs in as this admin
// would be unsafe.
test.describe.serial("admin can edit their own account and password", () => {
  test("editing the profile persists and can be reverted", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL("/dashboard");

    await page.goto("/admin/settings");
    await page.getByRole("tab", { name: "My account" }).click();

    const originalName = await page.locator("#account-name").inputValue();
    const suffix = Date.now();
    const tempName = `E2E Admin ${suffix}`;

    await page.fill("#account-name", tempName);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Saved.")).toBeVisible({ timeout: 10000 });

    // Real persistence, not cosmetic — reload from a clean navigation.
    await page.reload();
    await page.getByRole("tab", { name: "My account" }).click();
    await expect(page.locator("#account-name")).toHaveValue(tempName);

    // Restore, so this doesn't leave the shared demo admin account renamed.
    await page.fill("#account-name", originalName);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Saved.")).toBeVisible({ timeout: 10000 });
    await page.reload();
    await page.getByRole("tab", { name: "My account" }).click();
    await expect(page.locator("#account-name")).toHaveValue(originalName);
  });

  test("password change rejects a wrong current password and a confirmation mismatch", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL("/dashboard");
    await page.goto("/admin/settings");
    await page.getByRole("tab", { name: "My account" }).click();

    await page.fill("#currentPassword", "DefinitelyWrong1");
    await page.fill("#newPassword", "NewTestPass123");
    await page.fill("#confirmPassword", "NewTestPass123");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("That's not your current password.")).toBeVisible({ timeout: 10000 });

    await page.fill("#currentPassword", ADMIN_PASSWORD);
    await page.fill("#newPassword", "NewTestPass123");
    await page.fill("#confirmPassword", "SomethingElse456");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Passwords don't match.")).toBeVisible({ timeout: 10000 });
  });

  test("a real password change takes effect immediately and the old password stops working", async ({ page }) => {
    const tempPassword = "TempE2ePass123";

    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL("/dashboard");
    await page.goto("/admin/settings");
    await page.getByRole("tab", { name: "My account" }).click();

    await page.fill("#currentPassword", ADMIN_PASSWORD);
    await page.fill("#newPassword", tempPassword);
    await page.fill("#confirmPassword", tempPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password updated.")).toBeVisible({ timeout: 10000 });

    // Prove it with a real login, not just the confirmation message.
    await page.context().clearCookies();
    await login(page, ADMIN_EMAIL, tempPassword);
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // The old password must no longer work.
    await page.context().clearCookies();
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForTimeout(1500);
    expect(page.url()).toContain("/login");

    // Restore, so this doesn't leave the shared demo admin account's
    // password changed for other tests/manual use — verified with one more
    // real login on the restored password.
    await login(page, ADMIN_EMAIL, tempPassword);
    await page.waitForURL("/dashboard", { timeout: 15000 });
    await page.goto("/admin/settings");
    await page.getByRole("tab", { name: "My account" }).click();
    await page.fill("#currentPassword", tempPassword);
    await page.fill("#newPassword", ADMIN_PASSWORD);
    await page.fill("#confirmPassword", ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password updated.")).toBeVisible({ timeout: 10000 });

    await page.context().clearCookies();
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL("/dashboard", { timeout: 15000 });
  });
});

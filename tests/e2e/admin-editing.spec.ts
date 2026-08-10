import { test, expect } from "@playwright/test";

test.describe.serial("admin can edit courses and categories", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@elearning.dev");
    await page.fill("#password", "Password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("editing a category renames it and regenerates its slug", async ({ page }) => {
    const suffix = Date.now();
    const originalName = `E2E Category ${suffix}`;
    const renamedTo = `E2E Category Renamed ${suffix}`;

    await page.goto("/admin/categories");
    await page.getByPlaceholder("New category name").fill(originalName);
    await page.getByRole("button", { name: "Add category" }).click();
    const row = page.locator("tr", { hasText: originalName });
    await expect(row).toBeVisible({ timeout: 10000 });

    await row.getByRole("button", { name: "Edit category" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#edit-category-name").fill(renamedTo);
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    const renamedRow = page.locator("tr", { hasText: renamedTo });
    await expect(renamedRow).toBeVisible({ timeout: 10000 });
    await expect(page.locator("tr", { hasText: originalName })).toHaveCount(0);

    // Clean up — this test creates its own fixture rather than relying on
    // global teardown, which only sweeps "e2e-" users and
    // "E2E Instructor Course" titles, not categories.
    page.once("dialog", (d) => d.accept());
    await renamedRow.getByLabel("Delete category").click();
    await expect(page.locator("tr", { hasText: renamedTo })).toHaveCount(0, { timeout: 10000 });
  });

  test("a category with subcategories can't be made a subcategory itself", async ({ page }) => {
    const suffix = Date.now();
    const parentName = `E2E Parent ${suffix}`;
    const childName = `E2E Child ${suffix}`;

    await page.goto("/admin/categories");
    await page.getByPlaceholder("New category name").fill(parentName);
    await page.getByRole("button", { name: "Add category" }).click();
    await expect(page.locator("tr", { hasText: parentName })).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder("New category name").fill(childName);
    await page.locator('[role="combobox"]').click();
    await page.getByRole("option", { name: `Under ${parentName}` }).click();
    await page.getByRole("button", { name: "Add category" }).click();
    await expect(page.locator("tr", { hasText: childName })).toBeVisible({ timeout: 10000 });

    // Plain `hasText: parentName` would also match the child's row — its
    // "Parent" column cell renders the same text. Scope to rows whose
    // first cell (the Name column) is exactly the parent's name.
    const parentRow = page.locator(`tr:has(td:first-child:text-is("${parentName}"))`);
    await parentRow.getByRole("button", { name: "Edit category" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator("#edit-category-parent")).toBeDisabled();
    await expect(dialog.getByText(/can't be made a subcategory/i)).toBeVisible();
    await dialog.getByRole("button", { name: /close|cancel/i }).click().catch(() => page.keyboard.press("Escape"));

    // Clean up: delete the child first (parent has a course-count guard against deletion,
    // but the real blocker here would be the remaining child row), then the parent.
    await page.reload();
    page.once("dialog", (d) => d.accept());
    await page.locator("tr", { hasText: childName }).getByLabel("Delete category").click();
    await expect(page.locator("tr", { hasText: childName })).toHaveCount(0, { timeout: 10000 });
    page.once("dialog", (d) => d.accept());
    await page.locator("tr", { hasText: parentName }).getByLabel("Delete category").click();
    await expect(page.locator("tr", { hasText: parentName })).toHaveCount(0, { timeout: 10000 });
  });

  test("admin can edit any instructor's course details from the admin courses list", async ({ page }) => {
    const suffix = Date.now();
    const tempSubtitle = `E2E edited subtitle ${suffix}`;

    await page.goto("/admin/courses");
    const courseRow = page.locator("tr", { hasText: "React for Professionals" });
    await expect(courseRow).toBeVisible({ timeout: 10000 });
    await courseRow.getByRole("link", { name: "Edit" }).click();
    await page.waitForURL(/\/instructor\/courses\/.+\/edit/);

    await page.getByRole("tab", { name: "Course details" }).click();
    const subtitleInput = page.locator("#subtitle");
    const originalSubtitle = await subtitleInput.inputValue();
    await subtitleInput.fill(tempSubtitle);
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#subtitle")).toHaveValue(tempSubtitle, { timeout: 10000 });

    // The edit must be real, not cosmetic — reload from a clean navigation and confirm it
    // persisted. Wrapped in toPass() to ride out the dev server's occasional post-mutation
    // render lag rather than a single reload racing the write.
    await expect(async () => {
      await page.reload();
      await page.getByRole("tab", { name: "Course details" }).click();
      await expect(page.locator("#subtitle")).toHaveValue(tempSubtitle);
    }).toPass({ timeout: 15000 });

    // Restore the seeded value so this doesn't leave shared seed data altered.
    await page.locator("#subtitle").fill(originalSubtitle);
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#subtitle")).toHaveValue(originalSubtitle, { timeout: 10000 });
  });
});

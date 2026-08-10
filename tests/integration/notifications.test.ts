import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testDb, closeTestDb } from "../helpers/db";
import { createTestUser, cleanupTestFixtures } from "../helpers/fixtures";
import { createNotification } from "@/lib/services/notifications";

describe("createNotification (integration)", () => {
  let userId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    userId = user.id;
  });

  afterAll(async () => {
    await cleanupTestFixtures();
    await closeTestDb();
  });

  it("creates a notification when the user has no preference row yet (defaults to enabled)", async () => {
    await createNotification({ userId, type: "COURSE_COMPLETED", title: "Test", body: "Body" });
    const count = await testDb.notification.count({ where: { userId, type: "COURSE_COMPLETED" } });
    expect(count).toBe(1);
  });

  it("does not create a notification when the user has disabled that category", async () => {
    await testDb.notificationPreference.upsert({
      where: { userId },
      update: { subscriptionEnabled: false },
      create: { userId, subscriptionEnabled: false },
    });

    await createNotification({ userId, type: "SUBSCRIPTION_EVENT", title: "Billing", body: "Body" });
    const count = await testDb.notification.count({ where: { userId, type: "SUBSCRIPTION_EVENT" } });
    expect(count).toBe(0);
  });

  it("still creates a notification for a category the user has NOT disabled", async () => {
    // subscriptionEnabled is off from the previous test, but courseCompletionEnabled wasn't touched.
    await createNotification({ userId, type: "CERTIFICATE_ISSUED", title: "Cert", body: "Body" });
    const count = await testDb.notification.count({ where: { userId, type: "CERTIFICATE_ISSUED" } });
    expect(count).toBe(1);
  });
});

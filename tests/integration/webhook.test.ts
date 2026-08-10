import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { testDb, closeTestDb } from "../helpers/db";
import { createTestUser, createTestCategory, createTestCourse, cleanupTestFixtures, uniqueSuffix } from "../helpers/fixtures";

// The webhook handler calls stripe.subscriptions.retrieve() to get billing
// period dates for the subscription checkout path — mocked here so this
// suite doesn't need a real Stripe account/network call to test the
// app's own DB logic. (The real Stripe integration itself — actually
// completing a hosted Checkout session and receiving a genuinely signed
// webhook — was verified manually against Stripe's live test-mode API;
// see docs/ARCHITECTURE.md "Payments".)
vi.mock("@/lib/billing/stripe-client", () => ({
  stripe: {
    subscriptions: {
      retrieve: vi.fn(async (id: string) => ({
        id,
        items: { data: [{ current_period_start: 1_700_000_000, current_period_end: 1_702_592_000 }] },
      })),
    },
  },
}));

const { handleStripeWebhookEvent } = await import("@/lib/billing/webhook");

describe("handleStripeWebhookEvent (integration)", () => {
  let userId: string;
  let courseId: string;
  let coursePrice: number;

  beforeAll(async () => {
    const instructor = await createTestUser({ role: "INSTRUCTOR" });
    const student = await createTestUser({ role: "STUDENT" });
    const category = await createTestCategory();
    const { course } = await createTestCourse(instructor.id, category.id, { price: 49 });

    userId = student.id;
    courseId = course.id;
    coursePrice = 49;
  });

  afterAll(async () => {
    await cleanupTestFixtures();
    await closeTestDb();
  });

  describe("course purchase", () => {
    it("marks the order PAID, records a Payment, and enrolls the user", async () => {
      const order = await testDb.order.create({ data: { userId, courseId, amount: coursePrice, status: "PENDING" } });
      const eventId = `evt_${uniqueSuffix()}`;

      await handleStripeWebhookEvent({
        id: eventId,
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { kind: "course_purchase", orderId: order.id, userId, courseId },
            amount_total: coursePrice * 100,
            payment_intent: "pi_fake_123",
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const updatedOrder = await testDb.order.findUnique({ where: { id: order.id } });
      expect(updatedOrder?.status).toBe("PAID");

      const payment = await testDb.payment.findUnique({ where: { idempotencyKey: eventId } });
      expect(payment?.status).toBe("SUCCEEDED");
      expect(Number(payment?.amount)).toBe(coursePrice);

      const enrollment = await testDb.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
      expect(enrollment?.source).toBe("PURCHASE");
    });

    it("is idempotent — replaying the identical event does not create a second Payment", async () => {
      const order = await testDb.order.create({ data: { userId, courseId, amount: coursePrice, status: "PENDING" } });
      const eventId = `evt_${uniqueSuffix()}`;
      const event = {
        id: eventId,
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { kind: "course_purchase", orderId: order.id, userId, courseId },
            amount_total: coursePrice * 100,
            payment_intent: "pi_fake_456",
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      await handleStripeWebhookEvent(event);
      await handleStripeWebhookEvent(event); // replay

      const paymentCount = await testDb.payment.count({ where: { idempotencyKey: eventId } });
      expect(paymentCount).toBe(1);
    });
  });

  describe("failed checkout", () => {
    it("marks the order FAILED", async () => {
      const order = await testDb.order.create({ data: { userId, courseId, amount: coursePrice, status: "PENDING" } });

      await handleStripeWebhookEvent({
        id: `evt_${uniqueSuffix()}`,
        type: "checkout.session.async_payment_failed",
        data: { object: { metadata: { orderId: order.id } } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const updatedOrder = await testDb.order.findUnique({ where: { id: order.id } });
      expect(updatedOrder?.status).toBe("FAILED");
    });
  });

  describe("subscription checkout", () => {
    it("creates an ACTIVE subscription and a Payment (using the mocked Stripe subscription retrieval)", async () => {
      const eventId = `evt_${uniqueSuffix()}`;
      const stripeSubscriptionId = `sub_${uniqueSuffix()}`;

      await handleStripeWebhookEvent({
        id: eventId,
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { kind: "premium_subscription", userId },
            amount_total: 2900,
            payment_intent: "pi_fake_789",
            subscription: stripeSubscriptionId,
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const subscription = await testDb.subscription.findUnique({ where: { providerSubscriptionId: stripeSubscriptionId } });
      expect(subscription?.status).toBe("ACTIVE");
      expect(subscription?.plan).toBe("PREMIUM");

      const payment = await testDb.payment.findUnique({ where: { idempotencyKey: eventId } });
      expect(payment?.subscriptionId).toBe(subscription?.id);
    });
  });
});

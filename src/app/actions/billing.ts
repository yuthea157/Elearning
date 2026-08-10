"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { createCourseCheckoutSession, createSubscriptionCheckoutSession, createBillingPortalSession } from "@/lib/billing/checkout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function startCourseCheckoutAction(courseSlug: string) {
  const { userId } = await verifySession();
  const [user, course] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, email: true, name: true, stripeCustomerId: true } }),
    prisma.course.findFirst({
      where: { slug: courseSlug, status: "PUBLISHED", moderationStatus: "APPROVED" },
      select: { id: true, title: true, price: true },
    }),
  ]);
  if (!course) throw new Error("Course not found.");
  if (!course.price || Number(course.price) <= 0) throw new Error("This course is free — use Enroll instead of checkout.");

  const alreadyEnrolled = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } });
  if (alreadyEnrolled) redirect(`/courses/${courseSlug}`);

  const session = await createCourseCheckoutSession(user, { id: course.id, title: course.title, price: Number(course.price) }, {
    successUrl: `${APP_URL}/courses/${courseSlug}?checkout=success`,
    cancelUrl: `${APP_URL}/courses/${courseSlug}?checkout=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  redirect(session.url);
}

export async function startSubscriptionCheckoutAction() {
  const { userId } = await verifySession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  const activeSub = await prisma.subscription.findFirst({ where: { userId, status: "ACTIVE" } });
  if (activeSub) redirect("/settings");

  const session = await createSubscriptionCheckoutSession(user, {
    successUrl: `${APP_URL}/settings?checkout=success`,
    cancelUrl: `${APP_URL}/pricing?checkout=cancelled`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  redirect(session.url);
}

export async function openBillingPortalAction() {
  const { userId } = await verifySession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { stripeCustomerId: true } });
  if (!user.stripeCustomerId) throw new Error("No billing account yet — subscribe first.");

  const session = await createBillingPortalSession(user.stripeCustomerId, `${APP_URL}/settings`);
  redirect(session.url);
}

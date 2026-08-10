import "server-only";
import { prisma } from "@/lib/prisma";

/** Sensitive admin actions only (see docs/SECURITY.md) — not a general
 * request log. Call this from every admin mutation that changes another
 * user's access or a piece of public content's visibility. */
export async function logAdminAction(actorId: string, action: string, targetType: string, targetId: string, metadata?: object) {
  await prisma.auditLog.create({ data: { actorId, action, targetType, targetId, metadata } });
}

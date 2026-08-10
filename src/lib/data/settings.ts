import "server-only";
import { prisma } from "@/lib/prisma";

// SiteSettings is a single-row table, lazily created on first access
// (mirroring the rest of this app's "no seed row required" philosophy) —
// findFirst rather than a fixed known id, since nothing else ever needs to
// reference this row by id.
export async function getSiteSettings() {
  const existing = await prisma.siteSettings.findFirst();
  if (existing) return existing;
  return prisma.siteSettings.create({ data: {} });
}

"use server";

import { prisma } from "@/lib/prisma";
import { getOptionalSession } from "@/lib/auth/dal";

/**
 * Called when a user actually submits a search — deliberately not logged
 * from the /search results page's own render, since a GET render can be
 * triggered speculatively (Next.js Link prefetching) without the user
 * really searching, and a page render performing writes is a REST-
 * semantics smell regardless.
 */
export async function logSearchAction(query: string) {
  const session = await getOptionalSession();
  if (!session) return;

  const trimmed = query.trim();
  if (!trimmed) return;

  // Skip logging an exact repeat of the user's most recent search — avoids
  // filling their history with the same query re-submitted.
  const last = await prisma.searchHistory.findFirst({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } });
  if (last?.query.toLowerCase() === trimmed.toLowerCase()) return;

  await prisma.searchHistory.create({ data: { userId: session.userId, query: trimmed } });
}

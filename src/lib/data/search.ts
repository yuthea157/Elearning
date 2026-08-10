import "server-only";
import { prisma } from "@/lib/prisma";

export function getRecentSearches(userId: string, take = 5) {
  return prisma.searchHistory.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take });
}

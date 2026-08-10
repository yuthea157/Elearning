import "server-only";
import { prisma } from "@/lib/prisma";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: { email: string; username: string; name: string; passwordHash: string }) {
  return prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      username: data.username,
      name: data.name,
      passwordHash: data.passwordHash,
      profile: { create: {} },
      notificationPrefs: { create: {} },
    },
  });
}

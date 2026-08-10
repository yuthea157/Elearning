import "server-only";
import { prisma } from "@/lib/prisma";

export function getCertificateByCode(certificateCode: string) {
  return prisma.certificate.findUnique({
    where: { certificateCode },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, slug: true, instructor: { select: { name: true } } } },
    },
  });
}

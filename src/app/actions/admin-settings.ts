"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { logAdminAction } from "@/lib/services/audit";
import { siteSettingsSchema } from "@/lib/schemas/site-settings";
import { getSiteSettings } from "@/lib/data/settings";

export type SiteSettingsFormState = { errors?: Record<string, string[]>; formError?: string } | null;

export async function updateSiteSettingsAction(_prev: SiteSettingsFormState, formData: FormData): Promise<SiteSettingsFormState> {
  const admin = await requireRole("ADMIN");

  const parsed = siteSettingsSchema.safeParse({
    aboutTitle: formData.get("aboutTitle"),
    aboutContent: formData.get("aboutContent"),
    footerTagline: formData.get("footerTagline"),
    footerCopyright: formData.get("footerCopyright"),
    twitterUrl: formData.get("twitterUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    githubUrl: formData.get("githubUrl"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  const existing = await getSiteSettings();
  await prisma.siteSettings.update({
    where: { id: existing.id },
    data: {
      aboutTitle: parsed.data.aboutTitle,
      aboutContent: parsed.data.aboutContent,
      footerTagline: parsed.data.footerTagline,
      footerCopyright: parsed.data.footerCopyright || null,
      twitterUrl: parsed.data.twitterUrl || null,
      linkedinUrl: parsed.data.linkedinUrl || null,
      githubUrl: parsed.data.githubUrl || null,
    },
  });
  await logAdminAction(admin.id, "UPDATE_SITE_SETTINGS", "SiteSettings", existing.id);

  revalidatePath("/admin/settings");
  revalidatePath("/about");
  // The footer renders on every route under the (public) route group's
  // layout — revalidating from the root down is the only way to bust that
  // shared layout's cache without enumerating every public page.
  revalidatePath("/", "layout");
  return null;
}

import { z } from "zod";

const optionalUrl = z.string().trim().url("Enter a valid URL.").optional().or(z.literal(""));

export const siteSettingsSchema = z.object({
  aboutTitle: z.string().trim().min(2, "Title must be at least 2 characters.").max(100),
  aboutContent: z.string().trim().min(20, "About content must be at least 20 characters.").max(5000),
  footerTagline: z.string().trim().min(2, "Tagline must be at least 2 characters.").max(200),
  footerCopyright: z.string().trim().max(200).optional().or(z.literal("")),
  twitterUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

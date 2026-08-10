import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data/settings";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export const metadata: Metadata = { title: "Site settings — E-Learning admin" };

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Site settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Controls the public About page and the site footer — changes go live immediately, no redeploy needed.
        </p>
      </div>
      <SiteSettingsForm
        settings={{
          aboutTitle: settings.aboutTitle,
          aboutContent: settings.aboutContent,
          footerTagline: settings.footerTagline,
          footerCopyright: settings.footerCopyright ?? "",
          twitterUrl: settings.twitterUrl ?? "",
          linkedinUrl: settings.linkedinUrl ?? "",
          githubUrl: settings.githubUrl ?? "",
        }}
      />
    </div>
  );
}

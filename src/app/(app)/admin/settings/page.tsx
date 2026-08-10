import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSiteSettings } from "@/lib/data/settings";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { EditAccountForm } from "@/components/admin/edit-account-form";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Settings — E-Learning admin" };

export default async function AdminSettingsPage() {
  const [settings, admin] = await Promise.all([getSiteSettings(), getCurrentUser()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Site content shown to visitors, and your own admin account.</p>
      </div>

      <Tabs defaultValue="site">
        <TabsList>
          <TabsTrigger value="site">Site settings</TabsTrigger>
          <TabsTrigger value="account">My account</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="pt-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Controls the public About page and the site footer — changes go live immediately, no redeploy needed.
          </p>
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
        </TabsContent>

        <TabsContent value="account" className="flex flex-col gap-8 pt-6">
          <section className="max-w-md rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 font-heading text-base font-semibold text-foreground">Profile</h3>
            <EditAccountForm account={{ name: admin.name, username: admin.username, email: admin.email }} />
          </section>
          <section className="max-w-md rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 font-heading text-base font-semibold text-foreground">Password</h3>
            <ChangePasswordForm />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

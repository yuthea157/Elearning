"use client";

import { useActionState } from "react";
import { updateSiteSettingsAction, type SiteSettingsFormState } from "@/app/actions/admin-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Settings = {
  aboutTitle: string;
  aboutContent: string;
  footerTagline: string;
  footerCopyright: string;
  twitterUrl: string;
  linkedinUrl: string;
  githubUrl: string;
};

export function SiteSettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, isPending] = useActionState<SiteSettingsFormState, FormData>(updateSiteSettingsAction, null);

  return (
    <form action={formAction} className="space-y-8">
      {state?.formError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.formError}
        </p>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-heading text-base font-semibold text-foreground">About page</h3>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Shown at /about — introduce the platform to visitors.</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aboutTitle">Title</Label>
            <Input id="aboutTitle" name="aboutTitle" defaultValue={settings.aboutTitle} required />
            {state?.errors?.aboutTitle && <p className="text-sm text-destructive">{state.errors.aboutTitle[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="aboutContent">Content</Label>
            <Textarea id="aboutContent" name="aboutContent" defaultValue={settings.aboutContent} rows={8} required />
            <p className="text-xs text-muted-foreground">Blank lines start a new paragraph.</p>
            {state?.errors?.aboutContent && <p className="text-sm text-destructive">{state.errors.aboutContent[0]}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-heading text-base font-semibold text-foreground">Footer</h3>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Shown at the bottom of every public page.</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="footerTagline">Tagline</Label>
            <Input id="footerTagline" name="footerTagline" defaultValue={settings.footerTagline} required />
            {state?.errors?.footerTagline && <p className="text-sm text-destructive">{state.errors.footerTagline[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerCopyright">Copyright line</Label>
            <Input
              id="footerCopyright"
              name="footerCopyright"
              defaultValue={settings.footerCopyright}
              placeholder={`© ${new Date().getFullYear()} E-Learning. All rights reserved.`}
            />
            <p className="text-xs text-muted-foreground">Leave blank to use the default, auto-updating year.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="twitterUrl">Twitter / X URL</Label>
              <Input id="twitterUrl" name="twitterUrl" defaultValue={settings.twitterUrl} placeholder="https://x.com/…" />
              {state?.errors?.twitterUrl && <p className="text-sm text-destructive">{state.errors.twitterUrl[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input id="linkedinUrl" name="linkedinUrl" defaultValue={settings.linkedinUrl} placeholder="https://linkedin.com/…" />
              {state?.errors?.linkedinUrl && <p className="text-sm text-destructive">{state.errors.linkedinUrl[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="githubUrl">GitHub URL</Label>
              <Input id="githubUrl" name="githubUrl" defaultValue={settings.githubUrl} placeholder="https://github.com/…" />
              {state?.errors?.githubUrl && <p className="text-sm text-destructive">{state.errors.githubUrl[0]}</p>}
            </div>
          </div>
        </div>
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}

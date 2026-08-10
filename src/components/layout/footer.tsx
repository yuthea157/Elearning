import Link from "next/link";
import { MessageCircle, Briefcase, Code2 } from "lucide-react";
import { getSiteSettings } from "@/lib/data/settings";
import { IconBadge } from "@/components/ui/icon-badge";

const COLUMNS = [
  {
    heading: "Learn",
    links: [
      { href: "/courses", label: "All courses" },
      { href: "/categories", label: "Categories" },
      { href: "/paths", label: "Learning paths" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    heading: "Teach",
    links: [
      { href: "/instructor", label: "Become an instructor" },
      { href: "/instructor", label: "Instructor dashboard" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/certificates", label: "Verify a certificate" },
      { href: "/forgot-password", label: "Account help" },
    ],
  },
];

// lucide-react's brand-logo icons (Twitter/X, LinkedIn, GitHub) were
// removed from the core package — these are neutral stand-ins (message ·
// professional · code) rather than a lookalike of a specific brand's mark.
const SOCIAL_LINKS = (settings: { twitterUrl: string | null; linkedinUrl: string | null; githubUrl: string | null }) =>
  [
    { href: settings.twitterUrl, label: "Twitter / X", icon: MessageCircle, color: "sky" as const },
    { href: settings.linkedinUrl, label: "LinkedIn", icon: Briefcase, color: "indigo" as const },
    { href: settings.githubUrl, label: "GitHub", icon: Code2, color: "violet" as const },
  ].filter((link): link is typeof link & { href: string } => Boolean(link.href));

export async function Footer() {
  const settings = await getSiteSettings();
  const socialLinks = SOCIAL_LINKS(settings);
  const copyright = settings.footerCopyright || `© ${new Date().getFullYear()} E-Learning. All rights reserved.`;

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-sm">
          <p className="font-heading text-base font-semibold text-foreground">E-Learning</p>
          <p className="mt-2 text-sm text-muted-foreground">{settings.footerTagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-sm font-semibold text-foreground">{column.heading}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">{copyright}</p>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2">
              {socialLinks.map((link) => (
                <Link key={link.label} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} className="group">
                  <IconBadge icon={link.icon} color={link.color} size="sm" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

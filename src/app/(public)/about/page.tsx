import type { Metadata } from "next";
import { Users, BookOpen, GraduationCap } from "lucide-react";
import { getSiteSettings } from "@/lib/data/settings";
import { getPublicPlatformStats } from "@/lib/data/courses";
import { IconBadge } from "@/components/ui/icon-badge";
import { Benefits } from "@/components/home/benefits";

export const metadata: Metadata = { title: "About — E-Learning" };

export default async function AboutPage() {
  const [settings, stats] = await Promise.all([getSiteSettings(), getPublicPlatformStats()]);
  const paragraphs = settings.aboutContent.split(/\n{2,}/).filter(Boolean);

  const STATS = [
    { icon: BookOpen, color: "sky" as const, value: stats.courseCount, label: "published courses" },
    { icon: Users, color: "violet" as const, value: stats.instructorCount, label: "instructors" },
    { icon: GraduationCap, color: "emerald" as const, value: stats.studentCount, label: "students learning" },
  ];

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{settings.aboutTitle}</h1>
        <div className="mx-auto mt-6 max-w-2xl space-y-4 text-left text-muted-foreground sm:text-center">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="border-y border-border bg-secondary/30">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="group flex flex-col items-center gap-3 text-center">
              <IconBadge icon={stat.icon} color={stat.color} size="lg" />
              <div>
                <p className="font-heading text-2xl font-semibold text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Benefits />
    </div>
  );
}

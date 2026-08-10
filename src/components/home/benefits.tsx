import { Video, Award, TrendingUp, Users } from "lucide-react";
import { IconBadge, type IconBadgeColor } from "@/components/ui/icon-badge";

const BENEFITS: { icon: typeof Video; color: IconBadgeColor; title: string; description: string }[] = [
  {
    icon: Video,
    color: "sky",
    title: "Learn by doing",
    description: "Hands-on lessons with real projects, not just lecture slides.",
  },
  {
    icon: Award,
    color: "amber",
    title: "Earn certificates",
    description: "Show what you've learned with a shareable, verifiable certificate.",
  },
  {
    icon: TrendingUp,
    color: "emerald",
    title: "Track your progress",
    description: "Pick up exactly where you left off, on any device.",
  },
  {
    icon: Users,
    color: "violet",
    title: "Taught by professionals",
    description: "Courses built by people who use these skills every day.",
  },
];

export function Benefits() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="group flex flex-col items-start gap-3">
            <IconBadge icon={benefit.icon} color={benefit.color} />
            <h3 className="font-heading text-base font-semibold text-foreground">{benefit.title}</h3>
            <p className="text-sm text-muted-foreground">{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

import type { LucideIcon } from "lucide-react";
import { IconBadge, type IconBadgeColor } from "@/components/ui/icon-badge";

export function StatTile({
  icon,
  color = "indigo",
  label,
  value,
}: {
  icon: LucideIcon;
  color?: IconBadgeColor;
  label: string;
  value: number | string;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <IconBadge icon={icon} color={color} />
      <div>
        <p className="font-heading text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// A small curated set of accent hues for decorative icon badges — kept
// separate from the core design tokens (primary/accent/etc. in
// globals.css) since those are reserved for interactive UI and specific
// semantic meanings (see docs/ARCHITECTURE.md "Design system" — amber is
// reserved for ratings/achievements). These are purely decorative variety
// for icon grids (categories, benefits, stats) and never used on buttons,
// links, or anything carrying UI meaning.
const COLOR_VARIANTS = {
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
} as const;

export type IconBadgeColor = keyof typeof COLOR_VARIANTS;

const ROTATION: IconBadgeColor[] = ["indigo", "violet", "emerald", "rose", "sky", "amber"];

/** Cycles through the accent palette so an icon grid gets visual variety
 * without any one item picking its own arbitrary color. */
export function iconBadgeColorForIndex(index: number): IconBadgeColor {
  return ROTATION[index % ROTATION.length];
}

const SIZES = {
  sm: { badge: "size-9", icon: "size-4" },
  md: { badge: "size-11", icon: "size-5" },
  lg: { badge: "size-14", icon: "size-7" },
} as const;

export function IconBadge({
  icon: Icon,
  color = "indigo",
  size = "md",
  interactive = true,
  className,
}: {
  icon: LucideIcon;
  color?: IconBadgeColor;
  size?: keyof typeof SIZES;
  /** Animates on hover of the nearest ancestor with className="group".
   * Turn off for icons that aren't inside a hoverable card/link. */
  interactive?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        SIZES[size].badge,
        COLOR_VARIANTS[color],
        interactive && "transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-6",
        className,
      )}
    >
      <Icon className={SIZES[size].icon} aria-hidden="true" />
    </span>
  );
}

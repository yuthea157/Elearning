import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["Access to free courses", "Progress tracking", "Community discussions"],
    cta: "Start free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$29",
    period: "/month",
    features: ["Full course catalog", "Certificates of completion", "Downloadable resources", "Priority support"],
    cta: "Go Premium",
    href: "/pricing",
    highlighted: true,
  },
];

export function PricingTeaser() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-center font-heading text-2xl font-semibold text-foreground">Simple, transparent pricing</h2>
      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col gap-4 rounded-xl border p-6 ${plan.highlighted ? "border-primary bg-primary-subtle/40" : "border-border bg-card"}`}
          >
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-1">
                <span className="text-3xl font-semibold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground"> {plan.period}</span>
              </p>
            </div>
            <ul className="flex flex-1 flex-col gap-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button asChild variant={plan.highlighted ? "default" : "outline"}>
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

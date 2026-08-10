import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Fictional testimonials for demo purposes — not real user submissions.
const TESTIMONIALS = [
  {
    name: "Maritza Colón",
    role: "Product Designer",
    quote: "The UX Research path took me from guessing to actually running studies my team trusts.",
  },
  {
    name: "Devon Achebe",
    role: "Backend Engineer",
    quote: "Clear, practical, and the projects actually resemble real work — not toy examples.",
  },
  {
    name: "Priya Natarajan",
    role: "Marketing Manager",
    quote: "I finished the Growth Marketing certificate in three weekends and used it in my next interview.",
  },
];

export function Testimonials() {
  return (
    <section className="border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 font-heading text-2xl font-semibold text-foreground">What learners are saying</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure key={testimonial.name} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
              <blockquote className="text-sm text-foreground">&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback>
                    {testimonial.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

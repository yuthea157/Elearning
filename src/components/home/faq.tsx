import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    question: "Can I access courses on mobile?",
    answer: "Yes — the entire platform, including video lessons, works on phones, tablets, and desktop.",
  },
  {
    question: "Do I get a certificate?",
    answer: "You'll receive a shareable, verifiable certificate once you complete all lessons and quizzes in a course.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, cancel anytime from your account settings — you'll keep Premium access until the end of your billing period.",
  },
  {
    question: "Are free courses really free?",
    answer: "Yes, courses marked \"Free\" are available to every account at no cost, no trial required.",
  },
];

export function Faq() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground">Frequently asked questions</h2>
        <Accordion type="single" collapsible>
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.question} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

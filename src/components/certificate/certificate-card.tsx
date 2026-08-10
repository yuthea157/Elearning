"use client";

import { Award, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CertificateCard({
  studentName,
  courseTitle,
  instructorName,
  issuedAt,
  certificateCode,
}: {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  issuedAt: string;
  certificateCode: string;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full rounded-2xl border-2 border-primary/20 bg-card p-10 text-center shadow-sm print:shadow-none">
        <Award className="mx-auto size-10 text-accent-foreground" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">Certificate of Completion</p>
        <p className="mt-6 font-heading text-3xl font-semibold text-foreground">{studentName}</p>
        <p className="mt-3 text-muted-foreground">has successfully completed</p>
        <p className="mt-2 font-heading text-xl font-semibold text-foreground">{courseTitle}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Taught by {instructorName} · Issued {new Date(issuedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <p className="mt-6 font-mono text-xs text-muted-foreground">Certificate ID: {certificateCode}</p>
        <p className="mt-1 font-heading text-sm font-semibold text-foreground">E-Learning</p>
      </div>
      <Button variant="outline" onClick={() => window.print()} className="gap-1.5 print:hidden">
        <Printer className="size-4" /> Download / Print
      </Button>
    </div>
  );
}

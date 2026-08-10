import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCertificateByCode } from "@/lib/data/certificates";
import { CertificateCard } from "@/components/certificate/certificate-card";

export const metadata: Metadata = { title: "Verify a certificate — E-Learning" };

export default async function CertificateVerificationPage({ params }: { params: Promise<{ certificateCode: string }> }) {
  const { certificateCode } = await params;
  const certificate = await getCertificateByCode(certificateCode);
  // Redirect to the search page's inline result rather than a hard 404 — a
  // mistyped ID should read as "not verified," which builds trust in a
  // verification tool, not as a broken link.
  if (!certificate) redirect(`/certificates?code=${encodeURIComponent(certificateCode)}`);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2 text-sm font-medium text-success">
        <CheckCircle2 className="size-4" /> Verified — this certificate was issued by E-Learning
      </div>
      <CertificateCard
        studentName={certificate.user.name}
        courseTitle={certificate.course.title}
        instructorName={certificate.course.instructor.name}
        issuedAt={certificate.issuedAt.toISOString()}
        certificateCode={certificate.certificateCode}
      />
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href={`/courses/${certificate.course.slug}`} className="text-primary hover:underline">
          View this course
        </Link>
      </p>
    </div>
  );
}

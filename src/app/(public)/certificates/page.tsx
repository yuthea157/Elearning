import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { getCertificateByCode } from "@/lib/data/certificates";
import { CertificateCard } from "@/components/certificate/certificate-card";
import { IconBadge } from "@/components/ui/icon-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Verify a certificate — E-Learning" };

export default async function VerifyCertificatePage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const trimmedCode = code?.trim();
  const certificate = trimmedCode ? await getCertificateByCode(trimmedCode) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <IconBadge icon={ShieldCheck} color="indigo" size="lg" className="mx-auto" interactive={false} />
        <h1 className="mt-4 font-heading text-3xl font-semibold text-foreground">Verify a certificate</h1>
        <p className="mt-2 text-muted-foreground">Enter the certificate ID printed on any E-Learning certificate to confirm it&apos;s genuine.</p>
      </div>

      {/* Plain GET form — works without client JS, and makes the result linkable/shareable via ?code=. */}
      <form method="GET" className="flex flex-col gap-3 sm:flex-row">
        <Input name="code" defaultValue={trimmedCode ?? ""} placeholder="e.g. CERT-A1B2C3D4" className="flex-1" aria-label="Certificate ID" />
        <Button type="submit">Verify</Button>
      </form>

      {trimmedCode && (
        <div className="mt-10">
          {certificate ? (
            <>
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
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
              <XCircle className="size-8 text-destructive" aria-hidden="true" />
              <h3 className="font-heading text-lg font-semibold text-foreground">Not a valid certificate</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                We couldn&apos;t find a certificate with ID &quot;{trimmedCode}&quot;. Double-check the ID and try again.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

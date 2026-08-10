import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset your password — E-Learning" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-xl font-heading font-semibold text-foreground">
          E-Learning
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-heading font-semibold">Forgot your password?</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}

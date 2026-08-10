import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create your account — E-Learning" };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-xl font-heading font-semibold text-foreground">
          E-Learning
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-heading font-semibold">Start learning today</h1>
          <p className="mb-6 text-sm text-muted-foreground">Create a free account to track your progress.</p>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

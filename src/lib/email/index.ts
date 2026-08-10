import "server-only";

/**
 * Email service abstraction (section 28) — nothing in the app should ever
 * import a provider SDK directly. Swap this implementation for a real
 * provider (Resend, SES, Postmark, ...) without touching call sites.
 * For now, in the absence of a configured provider, emails are logged
 * instead of sent — this keeps auth flows (password reset, verification)
 * fully functional in development without requiring email credentials.
 */
export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
};

export async function sendEmail(message: EmailMessage) {
  // TODO: wire up a real provider here (e.g. Resend) once EMAIL_API_KEY is set.
  console.log(`[email:stub] to=${message.to} subject="${message.subject}"\n${message.body}`);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendEmail({
    to,
    subject: "Reset your E-Learning password",
    body: `Click the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}`,
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  await sendEmail({
    to,
    subject: "Welcome to E-Learning",
    body: `Hi ${name}, welcome aboard! Start exploring courses at /courses.`,
  });
}

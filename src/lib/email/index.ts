import "server-only";
import { Resend } from "resend";

/**
 * Email service abstraction (section 28) — nothing in the app should ever
 * import a provider SDK directly. Real delivery goes through Resend once
 * EMAIL_API_KEY is set. Without it, this falls back to logging -- but the
 * fallback deliberately never logs `body` in production, since bodies can
 * carry live password-reset URLs/tokens; logging those in cleartext on a
 * shared host is a credential-leak vector, not just a "not sent" gap.
 */
export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
};

const resend = process.env.EMAIL_API_KEY ? new Resend(process.env.EMAIL_API_KEY) : null;

export async function sendEmail(message: EmailMessage) {
  if (resend) {
    const from = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
    const { error } = await resend.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      text: message.body,
    });
    if (error) throw new Error(`Failed to send email: ${error.message}`);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(`[email:unconfigured] to=${message.to} subject="${message.subject}" -- EMAIL_API_KEY is not set, email not sent.`);
    return;
  }
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

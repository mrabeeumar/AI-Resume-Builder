import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_FROM = process.env.EMAIL_FROM ?? "ResoVo <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Resend is optional infrastructure in local/dev environments (no API key
// configured). Log instead of crashing so registration/reset flows still
// work end-to-end without email delivery — mirrors the fail-open pattern
// used for Redis (see lib/redis.ts, lib/rate-limit.ts).
async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Resend send failed:", error);
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail(
    email,
    "Verify your email address",
    `<p>Welcome to ResoVo! Confirm your email address to activate your account.</p>
     <p><a href="${link}">Verify email address</a></p>
     <p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`,
  );
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  await sendEmail(
    email,
    "Reset your password",
    `<p>We received a request to reset your password.</p>
     <p><a href="${link}">Reset password</a></p>
     <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  );
}

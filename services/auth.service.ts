import { randomBytes } from "crypto";

import bcrypt from "bcryptjs";

import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/types/auth";

const PASSWORD_SALT_ROUNDS = 12;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// VerificationToken.identifier has no "purpose" column, so email-verification
// and password-reset tokens share the table under distinct identifier
// prefixes to keep them from colliding or being consumable interchangeably.
const VERIFY_EMAIL_PREFIX = "verify-email:";
const RESET_PASSWORD_PREFIX = "reset-password:";

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

// Thrown by verifyCredentials when the password matches but the account's
// email hasn't been verified yet, so callers (the Credentials provider) can
// distinguish it from "wrong password" and prompt the user to verify.
export class EmailNotVerifiedError extends AuthServiceError {
  constructor() {
    super("Please verify your email address before signing in.", 403);
    this.name = "EmailNotVerifiedError";
  }
}

async function issueToken(identifier: string, ttlMs: number) {
  const token = randomBytes(32).toString("hex");

  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires: new Date(Date.now() + ttlMs),
    },
  });

  return token;
}

async function consumeToken(prefixedIdentifierPrefix: string, token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || !record.identifier.startsWith(prefixedIdentifierPrefix)) {
    return null;
  }

  // Expired tokens are still single-use.
  await prisma.verificationToken
    .delete({ where: { token } })
    .catch(() => undefined);

  return {
    identifier: record.identifier.slice(prefixedIdentifierPrefix.length),
    expired: record.expires < new Date(),
  };
}

export async function registerUser(input: RegisterInput) {
  const { name, email, password } = registerSchema.parse(input);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (existingUser.emailVerified) {
      throw new AuthServiceError(
        "An account with this email already exists.",
        409,
      );
    }

    // A prior signup with this email never completed verification. Discard
    // it (and any outstanding verification token) so the email can be used
    // again instead of being permanently locked out.
    await prisma.verificationToken.deleteMany({
      where: { identifier: `${VERIFY_EMAIL_PREFIX}${email}` },
    });
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  const token = await issueToken(
    `${VERIFY_EMAIL_PREFIX}${email}`,
    VERIFICATION_TOKEN_TTL_MS,
  );
  await sendVerificationEmail(email, token);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  if (!user.emailVerified) {
    throw new EmailNotVerifiedError();
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  };
}

export async function verifyEmailToken(token: string) {
  const result = await consumeToken(VERIFY_EMAIL_PREFIX, token);

  if (!result) {
    throw new AuthServiceError(
      "This verification link is invalid or has expired.",
      400,
    );
  }

  if (result.expired) {
    // Discard the unverified account tied to this token so the user isn't
    // permanently locked out of re-registering with the same email.
    await prisma.user.deleteMany({
      where: { email: result.identifier, emailVerified: null },
    });
    throw new AuthServiceError(
      "This verification link is invalid or has expired.",
      400,
    );
  }

  await prisma.user.update({
    where: { email: result.identifier },
    data: { emailVerified: new Date() },
  });
}

export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Silently no-op for unknown/already-verified accounts so this endpoint
  // can't be used to enumerate registered emails.
  if (!user || user.emailVerified) {
    return;
  }

  const token = await issueToken(
    `${VERIFY_EMAIL_PREFIX}${email}`,
    VERIFICATION_TOKEN_TTL_MS,
  );
  await sendVerificationEmail(email, token);
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Silently no-op for unknown accounts so this endpoint can't be used to
  // enumerate registered emails.
  if (!user || !user.passwordHash) {
    return;
  }

  const token = await issueToken(
    `${RESET_PASSWORD_PREFIX}${email}`,
    RESET_TOKEN_TTL_MS,
  );
  await sendPasswordResetEmail(email, token);
}

export async function resetPassword(token: string, newPassword: string) {
  const result = await consumeToken(RESET_PASSWORD_PREFIX, token);

  if (!result || result.expired) {
    throw new AuthServiceError(
      "This password reset link is invalid or has expired.",
      400,
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);

  await prisma.user.update({
    where: { email: result.identifier },
    data: { passwordHash },
  });
}

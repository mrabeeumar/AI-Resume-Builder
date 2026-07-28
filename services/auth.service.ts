import { randomBytes } from "crypto";

import bcrypt from "bcryptjs";

import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "@/types/auth";

const PASSWORD_SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// VerificationToken.identifier has no "purpose" column; password-reset
// tokens use a prefix to keep them namespaced within the shared table.
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
    throw new AuthServiceError(
      "An account with this email already exists.",
      409,
    );
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

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

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  };
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

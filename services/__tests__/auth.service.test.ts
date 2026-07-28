import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueUserMock = vi.fn();
const createUserMock = vi.fn();
const updateUserMock = vi.fn();
const deleteUserMock = vi.fn();
const deleteManyUserMock = vi.fn();
const findUniqueTokenMock = vi.fn();
const createTokenMock = vi.fn();
const deleteTokenMock = vi.fn();
const deleteManyTokenMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueUserMock(...args),
      create: (...args: unknown[]) => createUserMock(...args),
      update: (...args: unknown[]) => updateUserMock(...args),
      delete: (...args: unknown[]) => deleteUserMock(...args),
      deleteMany: (...args: unknown[]) => deleteManyUserMock(...args),
    },
    verificationToken: {
      findUnique: (...args: unknown[]) => findUniqueTokenMock(...args),
      create: (...args: unknown[]) => createTokenMock(...args),
      delete: (...args: unknown[]) => deleteTokenMock(...args),
      deleteMany: (...args: unknown[]) => deleteManyTokenMock(...args),
    },
  },
}));

const sendVerificationEmailMock = vi.fn();
const sendPasswordResetEmailMock = vi.fn();
vi.mock("@/lib/email", () => ({
  sendVerificationEmail: (...args: unknown[]) =>
    sendVerificationEmailMock(...args),
  sendPasswordResetEmail: (...args: unknown[]) =>
    sendPasswordResetEmailMock(...args),
}));

const {
  registerUser,
  verifyCredentials,
  verifyEmailToken,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  AuthServiceError,
  EmailNotVerifiedError,
} = await import("@/services/auth.service");

const bcrypt = await import("bcryptjs");

describe("registerUser", () => {
  beforeEach(() => {
    findUniqueUserMock.mockReset();
    createUserMock.mockReset();
    createTokenMock.mockReset();
    sendVerificationEmailMock.mockReset();
    deleteUserMock.mockReset();
    deleteManyTokenMock.mockReset();
  });

  it("creates a user and sends a verification email", async () => {
    findUniqueUserMock.mockResolvedValue(null);
    createUserMock.mockResolvedValue({
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
    });
    createTokenMock.mockResolvedValue({});

    const user = await registerUser({
      name: "Ada",
      email: "ada@example.com",
      password: "password123",
    });

    expect(user).toEqual({
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
    });
    expect(createTokenMock).toHaveBeenCalledTimes(1);
    expect(sendVerificationEmailMock).toHaveBeenCalledWith(
      "ada@example.com",
      expect.any(String),
    );
  });

  it("rejects registration for an existing verified email", async () => {
    findUniqueUserMock.mockResolvedValue({
      id: "existing",
      emailVerified: new Date(),
    });

    await expect(
      registerUser({
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(AuthServiceError);
    expect(createUserMock).not.toHaveBeenCalled();
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("discards a stale unverified account and allows re-registration", async () => {
    findUniqueUserMock.mockResolvedValue({
      id: "existing",
      emailVerified: null,
    });
    deleteManyTokenMock.mockResolvedValue({});
    deleteUserMock.mockResolvedValue({});
    createUserMock.mockResolvedValue({
      id: "user-2",
      name: "Ada",
      email: "ada@example.com",
    });
    createTokenMock.mockResolvedValue({});

    const user = await registerUser({
      name: "Ada",
      email: "ada@example.com",
      password: "password123",
    });

    expect(deleteManyTokenMock).toHaveBeenCalledWith({
      where: { identifier: "verify-email:ada@example.com" },
    });
    expect(deleteUserMock).toHaveBeenCalledWith({ where: { id: "existing" } });
    expect(user).toEqual({
      id: "user-2",
      name: "Ada",
      email: "ada@example.com",
    });
  });
});

describe("verifyCredentials", () => {
  beforeEach(() => {
    findUniqueUserMock.mockReset();
  });

  it("returns null for a nonexistent user", async () => {
    findUniqueUserMock.mockResolvedValue(null);

    const result = await verifyCredentials("nobody@example.com", "password");

    expect(result).toBeNull();
  });

  it("returns null for an incorrect password", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 12);
    findUniqueUserMock.mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      passwordHash,
      emailVerified: new Date(),
    });

    const result = await verifyCredentials("ada@example.com", "wrong-password");

    expect(result).toBeNull();
  });

  it("throws EmailNotVerifiedError when the password is correct but unverified", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 12);
    findUniqueUserMock.mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      passwordHash,
      emailVerified: null,
    });

    await expect(
      verifyCredentials("ada@example.com", "correct-password"),
    ).rejects.toBeInstanceOf(EmailNotVerifiedError);
  });

  it("returns the user when the password is correct and verified", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 12);
    findUniqueUserMock.mockResolvedValue({
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
      image: null,
      passwordHash,
      emailVerified: new Date(),
    });

    const result = await verifyCredentials("ada@example.com", "correct-password");

    expect(result).toEqual({
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
      image: null,
    });
  });
});

describe("verifyEmailToken", () => {
  beforeEach(() => {
    findUniqueTokenMock.mockReset();
    deleteTokenMock.mockReset();
    updateUserMock.mockReset();
    deleteManyUserMock.mockReset();
  });

  it("marks the user verified for a valid token", async () => {
    findUniqueTokenMock.mockResolvedValue({
      identifier: "verify-email:ada@example.com",
      token: "abc123",
      expires: new Date(Date.now() + 60_000),
    });
    deleteTokenMock.mockResolvedValue({});

    await verifyEmailToken("abc123");

    expect(updateUserMock).toHaveBeenCalledWith({
      where: { email: "ada@example.com" },
      data: { emailVerified: expect.any(Date) },
    });
    expect(deleteTokenMock).toHaveBeenCalledWith({ where: { token: "abc123" } });
  });

  it("rejects an expired token and discards the unverified account", async () => {
    findUniqueTokenMock.mockResolvedValue({
      identifier: "verify-email:ada@example.com",
      token: "abc123",
      expires: new Date(Date.now() - 60_000),
    });
    deleteTokenMock.mockResolvedValue({});
    deleteManyUserMock.mockResolvedValue({});

    await expect(verifyEmailToken("abc123")).rejects.toBeInstanceOf(
      AuthServiceError,
    );
    expect(updateUserMock).not.toHaveBeenCalled();
    expect(deleteManyUserMock).toHaveBeenCalledWith({
      where: { email: "ada@example.com", emailVerified: null },
    });
  });

  it("rejects an unknown token", async () => {
    findUniqueTokenMock.mockResolvedValue(null);

    await expect(verifyEmailToken("missing")).rejects.toBeInstanceOf(
      AuthServiceError,
    );
  });
});

describe("resendVerificationEmail", () => {
  beforeEach(() => {
    findUniqueUserMock.mockReset();
    createTokenMock.mockReset();
    sendVerificationEmailMock.mockReset();
  });

  it("no-ops for an already-verified account", async () => {
    findUniqueUserMock.mockResolvedValue({
      email: "ada@example.com",
      emailVerified: new Date(),
    });

    await resendVerificationEmail("ada@example.com");

    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
  });

  it("no-ops for an unknown account without leaking existence", async () => {
    findUniqueUserMock.mockResolvedValue(null);

    await resendVerificationEmail("nobody@example.com");

    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
  });

  it("issues a new token and sends an email for an unverified account", async () => {
    findUniqueUserMock.mockResolvedValue({
      email: "ada@example.com",
      emailVerified: null,
    });
    createTokenMock.mockResolvedValue({});

    await resendVerificationEmail("ada@example.com");

    expect(sendVerificationEmailMock).toHaveBeenCalledWith(
      "ada@example.com",
      expect.any(String),
    );
  });
});

describe("requestPasswordReset / resetPassword", () => {
  beforeEach(() => {
    findUniqueUserMock.mockReset();
    createTokenMock.mockReset();
    findUniqueTokenMock.mockReset();
    deleteTokenMock.mockReset();
    updateUserMock.mockReset();
    sendPasswordResetEmailMock.mockReset();
  });

  it("no-ops requesting a reset for an unknown account", async () => {
    findUniqueUserMock.mockResolvedValue(null);

    await requestPasswordReset("nobody@example.com");

    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });

  it("sends a reset email for a known account", async () => {
    findUniqueUserMock.mockResolvedValue({
      email: "ada@example.com",
      passwordHash: "hash",
    });
    createTokenMock.mockResolvedValue({});

    await requestPasswordReset("ada@example.com");

    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(
      "ada@example.com",
      expect.any(String),
    );
  });

  it("resets the password for a valid token", async () => {
    findUniqueTokenMock.mockResolvedValue({
      identifier: "reset-password:ada@example.com",
      token: "reset-token",
      expires: new Date(Date.now() + 60_000),
    });
    deleteTokenMock.mockResolvedValue({});

    await resetPassword("reset-token", "new-password123");

    expect(updateUserMock).toHaveBeenCalledWith({
      where: { email: "ada@example.com" },
      data: { passwordHash: expect.any(String) },
    });
  });

  it("rejects an invalid reset token", async () => {
    findUniqueTokenMock.mockResolvedValue(null);

    await expect(
      resetPassword("missing", "new-password123"),
    ).rejects.toBeInstanceOf(AuthServiceError);
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});

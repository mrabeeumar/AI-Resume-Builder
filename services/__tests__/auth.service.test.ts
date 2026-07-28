import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueUserMock = vi.fn();
const createUserMock = vi.fn();
const updateUserMock = vi.fn();
const findUniqueTokenMock = vi.fn();
const createTokenMock = vi.fn();
const deleteTokenMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueUserMock(...args),
      create: (...args: unknown[]) => createUserMock(...args),
      update: (...args: unknown[]) => updateUserMock(...args),
    },
    verificationToken: {
      findUnique: (...args: unknown[]) => findUniqueTokenMock(...args),
      create: (...args: unknown[]) => createTokenMock(...args),
      delete: (...args: unknown[]) => deleteTokenMock(...args),
    },
  },
}));

const sendPasswordResetEmailMock = vi.fn();
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: (...args: unknown[]) =>
    sendPasswordResetEmailMock(...args),
}));

const {
  registerUser,
  verifyCredentials,
  requestPasswordReset,
  resetPassword,
  AuthServiceError,
} = await import("@/services/auth.service");

const bcrypt = await import("bcryptjs");

describe("registerUser", () => {
  beforeEach(() => {
    findUniqueUserMock.mockReset();
    createUserMock.mockReset();
  });

  it("creates a user", async () => {
    findUniqueUserMock.mockResolvedValue(null);
    createUserMock.mockResolvedValue({
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
    });

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
  });

  it("rejects registration for an existing email", async () => {
    findUniqueUserMock.mockResolvedValue({
      id: "existing",
      email: "ada@example.com",
    });

    await expect(
      registerUser({
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(AuthServiceError);
    expect(createUserMock).not.toHaveBeenCalled();
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
    });

    const result = await verifyCredentials("ada@example.com", "wrong-password");

    expect(result).toBeNull();
  });

  it("returns the user when the password is correct", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 12);
    findUniqueUserMock.mockResolvedValue({
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
      image: null,
      passwordHash,
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

import { beforeEach, describe, expect, it, vi } from "vitest";

const getOwnedResumeOrThrowMock = vi.fn();
vi.mock("@/services/resume.service", () => ({
  getOwnedResumeOrThrow: (...args: unknown[]) =>
    getOwnedResumeOrThrowMock(...args),
  ResumeServiceError: class ResumeServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
}));

const conversationCreateMock = vi.fn();
const conversationFindManyMock = vi.fn();
const conversationFindUniqueMock = vi.fn();
const conversationDeleteMock = vi.fn();
const conversationUpdateMock = vi.fn();
const chatMessageFindManyMock = vi.fn();
const chatMessageCreateMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversation: {
      create: (...args: unknown[]) => conversationCreateMock(...args),
      findMany: (...args: unknown[]) => conversationFindManyMock(...args),
      findUnique: (...args: unknown[]) => conversationFindUniqueMock(...args),
      delete: (...args: unknown[]) => conversationDeleteMock(...args),
      update: (...args: unknown[]) => conversationUpdateMock(...args),
    },
    chatMessage: {
      findMany: (...args: unknown[]) => chatMessageFindManyMock(...args),
      create: (...args: unknown[]) => chatMessageCreateMock(...args),
    },
  },
}));

const {
  createConversation,
  listConversationsForResume,
  getConversationWithMessages,
  deleteConversation,
  appendMessage,
  getRecentMessages,
} = await import("@/services/chat-history.service");

beforeEach(() => {
  getOwnedResumeOrThrowMock.mockReset();
  conversationCreateMock.mockReset();
  conversationFindManyMock.mockReset();
  conversationFindUniqueMock.mockReset();
  conversationDeleteMock.mockReset();
  conversationUpdateMock.mockReset();
  chatMessageFindManyMock.mockReset();
  chatMessageCreateMock.mockReset();

  getOwnedResumeOrThrowMock.mockResolvedValue({ id: "resume-1", userId: "user-1" });
});

describe("createConversation", () => {
  it("creates a conversation scoped to the owning resume and user", async () => {
    conversationCreateMock.mockResolvedValue({
      id: "conv-1",
      resumeId: "resume-1",
      versionId: null,
      title: "New conversation",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createConversation("resume-1", "user-1", {});

    expect(getOwnedResumeOrThrowMock).toHaveBeenCalledWith("resume-1", "user-1");
    expect(conversationCreateMock).toHaveBeenCalledWith({
      data: {
        resumeId: "resume-1",
        userId: "user-1",
        versionId: null,
        title: "New conversation",
      },
    });
    expect(result.id).toBe("conv-1");
  });
});

describe("listConversationsForResume", () => {
  it("lists conversations only for the owning user's resume", async () => {
    conversationFindManyMock.mockResolvedValue([
      {
        id: "conv-1",
        resumeId: "resume-1",
        versionId: null,
        title: "Chat",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const conversations = await listConversationsForResume("resume-1", "user-1");

    expect(conversationFindManyMock).toHaveBeenCalledWith({
      where: { resumeId: "resume-1", userId: "user-1" },
      orderBy: { updatedAt: "desc" },
    });
    expect(conversations).toHaveLength(1);
  });
});

describe("getConversationWithMessages", () => {
  it("throws when the conversation belongs to a different resume", async () => {
    conversationFindUniqueMock.mockResolvedValue({
      id: "conv-1",
      resumeId: "other-resume",
      userId: "user-1",
      versionId: null,
      title: "Chat",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      getConversationWithMessages("resume-1", "conv-1", "user-1"),
    ).rejects.toThrow("Conversation not found.");
  });

  it("throws when the conversation belongs to a different user", async () => {
    conversationFindUniqueMock.mockResolvedValue({
      id: "conv-1",
      resumeId: "resume-1",
      userId: "other-user",
      versionId: null,
      title: "Chat",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      getConversationWithMessages("resume-1", "conv-1", "user-1"),
    ).rejects.toThrow("Conversation not found.");
  });

  it("returns the conversation with its messages in order", async () => {
    conversationFindUniqueMock.mockResolvedValue({
      id: "conv-1",
      resumeId: "resume-1",
      userId: "user-1",
      versionId: null,
      title: "Chat",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    chatMessageFindManyMock.mockResolvedValue([
      {
        id: "msg-1",
        conversationId: "conv-1",
        role: "USER",
        content: "Hi",
        confidence: null,
        createdAt: new Date(),
      },
    ]);

    const conversation = await getConversationWithMessages(
      "resume-1",
      "conv-1",
      "user-1",
    );

    expect(conversation.messages).toHaveLength(1);
    expect(chatMessageFindManyMock).toHaveBeenCalledWith({
      where: { conversationId: "conv-1" },
      orderBy: { createdAt: "asc" },
    });
  });
});

describe("deleteConversation", () => {
  it("deletes an owned conversation", async () => {
    conversationFindUniqueMock.mockResolvedValue({
      id: "conv-1",
      resumeId: "resume-1",
      userId: "user-1",
      versionId: null,
      title: "Chat",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await deleteConversation("resume-1", "conv-1", "user-1");

    expect(conversationDeleteMock).toHaveBeenCalledWith({ where: { id: "conv-1" } });
  });
});

describe("appendMessage", () => {
  it("persists the message and bumps the conversation's updatedAt", async () => {
    chatMessageCreateMock.mockResolvedValue({
      id: "msg-1",
      conversationId: "conv-1",
      role: "ASSISTANT",
      content: "Hello",
      confidence: 90,
      createdAt: new Date(),
    });

    const message = await appendMessage("conv-1", "ASSISTANT", "Hello", 90);

    expect(chatMessageCreateMock).toHaveBeenCalledWith({
      data: { conversationId: "conv-1", role: "ASSISTANT", content: "Hello", confidence: 90 },
    });
    expect(conversationUpdateMock).toHaveBeenCalledWith({
      where: { id: "conv-1" },
      data: { updatedAt: expect.any(Date) },
    });
    expect(message.role).toBe("ASSISTANT");
  });
});

describe("getRecentMessages", () => {
  it("returns messages oldest-first after fetching newest-first", async () => {
    const older = { id: "msg-1", conversationId: "conv-1", role: "USER", content: "First", confidence: null, createdAt: new Date(2024, 0, 1) };
    const newer = { id: "msg-2", conversationId: "conv-1", role: "ASSISTANT", content: "Second", confidence: 80, createdAt: new Date(2024, 0, 2) };
    chatMessageFindManyMock.mockResolvedValue([newer, older]);

    const messages = await getRecentMessages("conv-1", 10);

    expect(chatMessageFindManyMock).toHaveBeenCalledWith({
      where: { conversationId: "conv-1" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    expect(messages.map((m) => m.id)).toEqual(["msg-1", "msg-2"]);
  });
});

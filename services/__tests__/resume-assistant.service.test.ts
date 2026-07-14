import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/resume.service", () => ({
  ResumeServiceError: class ResumeServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
}));

const buildAssistantContextMock = vi.fn();
vi.mock("@/services/resume-assistant-context.service", () => ({
  buildAssistantContext: (...args: unknown[]) => buildAssistantContextMock(...args),
}));

const appendMessageMock = vi.fn();
const getRecentMessagesMock = vi.fn();
vi.mock("@/services/chat-history.service", () => ({
  appendMessage: (...args: unknown[]) => appendMessageMock(...args),
  getRecentMessages: (...args: unknown[]) => getRecentMessagesMock(...args),
}));

const generateAIJSONMock = vi.fn();
vi.mock("@/services/ai.service", () => ({
  generateAIJSON: (...args: unknown[]) => generateAIJSONMock(...args),
}));

const conversationFindUniqueMock = vi.fn();
const conversationFindUniqueOrThrowMock = vi.fn();
const conversationUpdateMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversation: {
      findUnique: (...args: unknown[]) => conversationFindUniqueMock(...args),
      findUniqueOrThrow: (...args: unknown[]) =>
        conversationFindUniqueOrThrowMock(...args),
      update: (...args: unknown[]) => conversationUpdateMock(...args),
    },
  },
}));

const { sendMessage } = await import("@/services/resume-assistant.service");

function conversation(overrides: Record<string, unknown> = {}) {
  return {
    id: "conv-1",
    resumeId: "resume-1",
    userId: "user-1",
    versionId: null,
    title: "New conversation",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  buildAssistantContextMock.mockReset();
  appendMessageMock.mockReset();
  getRecentMessagesMock.mockReset();
  generateAIJSONMock.mockReset();
  conversationFindUniqueMock.mockReset();
  conversationFindUniqueOrThrowMock.mockReset();
  conversationUpdateMock.mockReset();

  buildAssistantContextMock.mockResolvedValue({
    resumeContext: "Summary: Experienced engineer.",
    reviewContext: "No resume review has been run yet.",
    tailoringContext: "No tailored resume version has been created yet.",
    skillGapContext: "No skill gap analysis has been run yet.",
  });
  getRecentMessagesMock.mockResolvedValue([]);
  appendMessageMock.mockImplementation((conversationId, role, content, confidence = null) =>
    Promise.resolve({
      id: role === "USER" ? "msg-user" : "msg-assistant",
      conversationId,
      role,
      content,
      confidence,
      createdAt: new Date(),
    }),
  );
});

describe("sendMessage", () => {
  it("throws when the conversation does not belong to the resume/user", async () => {
    conversationFindUniqueMock.mockResolvedValue(
      conversation({ resumeId: "other-resume" }),
    );

    await expect(
      sendMessage("resume-1", "conv-1", "user-1", { message: "Hi" }),
    ).rejects.toThrow("Conversation not found.");
  });

  it("persists the user message before calling the AI, and the reply after", async () => {
    conversationFindUniqueMock.mockResolvedValue(conversation());
    conversationFindUniqueOrThrowMock.mockResolvedValue(
      conversation({ title: "How can I improve my resume" }),
    );
    generateAIJSONMock.mockResolvedValue({
      answer: "Your summary is strong.",
      confidence: 85,
      followUpQuestions: ["What about my skills section?"],
    });

    const reply = await sendMessage("resume-1", "conv-1", "user-1", {
      message: "How can I improve my resume?",
    });

    expect(appendMessageMock).toHaveBeenNthCalledWith(
      1,
      "conv-1",
      "USER",
      "How can I improve my resume?",
    );
    expect(appendMessageMock).toHaveBeenNthCalledWith(
      2,
      "conv-1",
      "ASSISTANT",
      "Your summary is strong.",
      85,
    );
    expect(reply.message.role).toBe("ASSISTANT");
    expect(reply.followUpQuestions).toEqual(["What about my skills section?"]);
    expect(reply.warnings).toHaveLength(0);
  });

  it("surfaces a warning when the AI confidence is low", async () => {
    conversationFindUniqueMock.mockResolvedValue(conversation());
    conversationFindUniqueOrThrowMock.mockResolvedValue(conversation());
    generateAIJSONMock.mockResolvedValue({
      answer: "I'm not sure without more context.",
      confidence: 20,
      followUpQuestions: [],
    });

    const reply = await sendMessage("resume-1", "conv-1", "user-1", {
      message: "What should I do?",
    });

    expect(reply.warnings).toHaveLength(1);
  });

  it("renames a fresh conversation from the first message", async () => {
    conversationFindUniqueMock.mockResolvedValue(conversation());
    conversationFindUniqueOrThrowMock.mockResolvedValue(conversation());
    generateAIJSONMock.mockResolvedValue({
      answer: "Sure thing.",
      confidence: 90,
      followUpQuestions: [],
    });

    await sendMessage("resume-1", "conv-1", "user-1", {
      message: "Explain my ATS score.",
    });

    expect(conversationUpdateMock).toHaveBeenCalledWith({
      where: { id: "conv-1" },
      data: { title: "Explain my ATS score." },
    });
  });
});

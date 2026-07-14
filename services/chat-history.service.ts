import type { ChatRole } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { getOwnedResumeOrThrow, ResumeServiceError } from "@/services/resume.service";
import {
  createConversationSchema,
  type ChatMessageItem,
  type ConversationItem,
  type ConversationListItem,
  type CreateConversationInput,
} from "@/types/resume-assistant";

function serializeConversation(conversation: {
  id: string;
  resumeId: string;
  versionId: string | null;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}): ConversationListItem {
  return {
    id: conversation.id,
    resumeId: conversation.resumeId,
    versionId: conversation.versionId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function serializeMessage(message: {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  confidence: number | null;
  createdAt: Date;
}): ChatMessageItem {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role as ChatRole,
    content: message.content,
    confidence: message.confidence,
    createdAt: message.createdAt,
  };
}

async function getOwnedConversationOrThrow(
  resumeId: string,
  conversationId: string,
  userId: string,
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (
    !conversation ||
    conversation.resumeId !== resumeId ||
    conversation.userId !== userId
  ) {
    throw new ResumeServiceError("Conversation not found.", 404);
  }

  return conversation;
}

// Manages Conversation/ChatMessage persistence for the AI Resume
// Assistant — creation, listing, retrieval with history, and deletion. Kept
// separate from ResumeAssistantService (which owns the AI orchestration) so
// history CRUD stays reusable and independently testable, per the layered
// architecture in .claude/docs/architecture.md.
export async function createConversation(
  resumeId: string,
  userId: string,
  input: CreateConversationInput,
): Promise<ConversationListItem> {
  await getOwnedResumeOrThrow(resumeId, userId);
  const { versionId, title } = createConversationSchema.parse(input);

  const conversation = await prisma.conversation.create({
    data: {
      resumeId,
      userId,
      versionId: versionId ?? null,
      title: title?.trim() || "New conversation",
    },
  });

  return serializeConversation(conversation);
}

export async function listConversationsForResume(
  resumeId: string,
  userId: string,
): Promise<ConversationListItem[]> {
  await getOwnedResumeOrThrow(resumeId, userId);

  const conversations = await prisma.conversation.findMany({
    where: { resumeId, userId },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map(serializeConversation);
}

export async function getConversationWithMessages(
  resumeId: string,
  conversationId: string,
  userId: string,
): Promise<ConversationItem> {
  await getOwnedResumeOrThrow(resumeId, userId);
  const conversation = await getOwnedConversationOrThrow(
    resumeId,
    conversationId,
    userId,
  );

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  return {
    ...serializeConversation(conversation),
    messages: messages.map(serializeMessage),
  };
}

export async function deleteConversation(
  resumeId: string,
  conversationId: string,
  userId: string,
): Promise<void> {
  await getOwnedResumeOrThrow(resumeId, userId);
  await getOwnedConversationOrThrow(resumeId, conversationId, userId);

  await prisma.conversation.delete({ where: { id: conversationId } });
}

// Fetches the most recent messages for a conversation to ground the next
// AI turn, oldest first, without pulling the entire history — see the
// token-economy rule in .claude/docs/ai.md.
export async function getRecentMessages(
  conversationId: string,
  limit = 10,
): Promise<ChatMessageItem[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return messages.reverse().map(serializeMessage);
}

export async function appendMessage(
  conversationId: string,
  role: ChatRole,
  content: string,
  confidence: number | null = null,
): Promise<ChatMessageItem> {
  const message = await prisma.chatMessage.create({
    data: { conversationId, role, content, confidence },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return serializeMessage(message);
}

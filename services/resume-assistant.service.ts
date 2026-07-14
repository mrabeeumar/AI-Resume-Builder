import "@/lib/ai/prompts";

import { getPrompt } from "@/lib/ai/prompt-manager";
import { prisma } from "@/lib/prisma";
import { generateAIJSON } from "@/services/ai.service";
import {
  appendMessage,
  getRecentMessages,
} from "@/services/chat-history.service";
import { buildAssistantContext } from "@/services/resume-assistant-context.service";
import { ResumeServiceError } from "@/services/resume.service";
import {
  sendMessageSchema,
  type AssistantReply,
  type ChatMessageItem,
  type SendMessageInput,
} from "@/types/resume-assistant";
import { resumeAssistantAIOutputSchema } from "@/types/resume-assistant.schema";

const LOW_CONFIDENCE_THRESHOLD = 50;

function buildConversationHistory(messages: ChatMessageItem[]): string {
  if (messages.length === 0) return "No prior messages in this conversation.";

  return messages
    .map((message) => `${message.role === "USER" ? "Candidate" : "Assistant"}: ${message.content}`)
    .join("\n");
}

// Derives a short conversation title from the candidate's first message so
// the conversation sidebar shows something meaningful instead of "New
// conversation" for every entry.
function deriveTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

// Orchestrates a single AI Resume Assistant chat turn: loads the resume's
// review/tailoring/skill-gap context (ContextService), loads recent
// conversation history (ChatHistoryService), asks the AI a scoped question,
// validates the structured response, and persists both the candidate's
// message and the assistant's reply. Reuses the same generateAIJSON entry
// point as every other AI feature — see .claude/docs/ai.md.
export async function sendMessage(
  resumeId: string,
  conversationId: string,
  userId: string,
  input: SendMessageInput,
): Promise<AssistantReply> {
  const { message } = sendMessageSchema.parse(input);

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

  const [context, history] = await Promise.all([
    buildAssistantContext(resumeId, userId, conversation.versionId),
    getRecentMessages(conversationId),
  ]);

  await appendMessage(conversationId, "USER", message);

  const template = getPrompt("RESUME_ASSISTANT_CHAT");
  const aiOutput = await generateAIJSON({
    feature: "RESUME_ASSISTANT_CHAT",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({
      resumeContext: context.resumeContext,
      reviewContext: context.reviewContext,
      tailoringContext: context.tailoringContext,
      skillGapContext: context.skillGapContext,
      conversationHistory: buildConversationHistory(history),
      question: message,
    }),
    schema: resumeAssistantAIOutputSchema,
  });

  const assistantMessage = await appendMessage(
    conversationId,
    "ASSISTANT",
    aiOutput.answer,
    aiOutput.confidence,
  );

  const warnings: string[] = [];
  if (aiOutput.confidence < LOW_CONFIDENCE_THRESHOLD) {
    warnings.push(
      "This answer has low confidence — consider running a resume review, " +
        "tailoring, or skill gap analysis for more grounded results.",
    );
  }

  if (conversation.title === "New conversation") {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: deriveTitle(message) },
    });
  }

  const updatedConversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
  });

  return {
    conversation: {
      id: updatedConversation.id,
      resumeId: updatedConversation.resumeId,
      versionId: updatedConversation.versionId,
      title: updatedConversation.title,
      createdAt: updatedConversation.createdAt,
      updatedAt: updatedConversation.updatedAt,
    },
    message: assistantMessage,
    followUpQuestions: aiOutput.followUpQuestions,
    warnings,
  };
}

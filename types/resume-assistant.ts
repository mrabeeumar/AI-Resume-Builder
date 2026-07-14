import { z } from "zod";

import type { ChatRole } from "@/lib/enums";
import type { ResumeAssistantAIOutput } from "@/types/resume-assistant.schema";

export const createConversationSchema = z.object({
  // Anchor the conversation to a specific past version instead of the live
  // resume, mirroring the versionId option on review/skill-gap generation.
  versionId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).max(120).optional(),
});
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export type ChatMessageItem = {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  confidence: number | null;
  createdAt: Date;
};

export type ConversationListItem = {
  id: string;
  resumeId: string;
  versionId: string | null;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ConversationItem = ConversationListItem & {
  messages: ChatMessageItem[];
};

// Read-only warnings surfaced alongside a reply (e.g. low confidence),
// distinct from the AI-generated followUpQuestions in the schema above.
export type AssistantReply = {
  conversation: ConversationListItem;
  message: ChatMessageItem;
  followUpQuestions: ResumeAssistantAIOutput["followUpQuestions"];
  warnings: string[];
};

// Example prompts shown in the chat UI before the user has asked anything —
// see the "Suggested Questions" requirement in
// .claude/roadmap/M19-ai-resume-assistant.md.
export const SUGGESTED_QUESTIONS: string[] = [
  "Review my resume.",
  "Explain my ATS score.",
  "How can I improve my resume?",
  "Which skills should I learn?",
  "Why is this experience weak?",
  "How can I tailor my resume better?",
];

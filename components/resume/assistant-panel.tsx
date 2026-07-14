"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquarePlus, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  SUGGESTED_QUESTIONS,
  type AssistantReply,
  type ChatMessageItem,
  type ConversationItem,
  type ConversationListItem,
} from "@/types/resume-assistant";

type Props = {
  resumeId: string;
  initialConversations: ConversationListItem[];
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString();
}

// The AI Resume Assistant chat: a conversation sidebar (history, new chat,
// delete) alongside a chat window with message history, a typing indicator,
// suggested questions, and a clear-chat option — see the "Chat Interface"
// and "Conversation History" requirements in
// .claude/roadmap/M19-ai-resume-assistant.md.
export function AssistantPanel({ resumeId, initialConversations }: Props) {
  const [conversations, setConversations] =
    useState<ConversationListItem[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingMessageIdRef = useRef(0);

  const loadConversation = async (conversationId: string) => {
    setIsLoadingConversation(true);
    setError(null);
    setFollowUpQuestions([]);
    setWarnings([]);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/assistant/conversations/${conversationId}`,
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      const conversation = data.conversation as ConversationItem;
      setMessages(conversation.messages);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveId(conversationId);
    void loadConversation(conversationId);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleNewChat = async () => {
    setIsStartingChat(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/assistant/conversations`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      const conversation = data.conversation as ConversationListItem;
      setConversations((prev) => [conversation, ...prev]);
      setActiveId(conversation.id);
      setMessages([]);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleDelete = async (conversationId: string) => {
    setDeletingId(conversationId);
    setError(null);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/assistant/conversations/${conversationId}`,
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeId === conversationId) {
        setActiveId(null);
        setMessages([]);
      }
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setDeletingId(null);
    }
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setError(null);
    setFollowUpQuestions([]);
    setWarnings([]);
    setInput("");

    let conversationId = activeId;

    if (!conversationId) {
      setIsStartingChat(true);
      try {
        const response = await fetch(
          `/api/resumes/${resumeId}/assistant/conversations`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
        );
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          setError(data?.error ?? GENERIC_ERROR);
          return;
        }
        const conversation = data.conversation as ConversationListItem;
        conversationId = conversation.id;
        setConversations((prev) => [conversation, ...prev]);
        setActiveId(conversation.id);
        setMessages([]);
      } catch {
        setError(GENERIC_ERROR);
        return;
      } finally {
        setIsStartingChat(false);
      }
    }

    if (!conversationId) return;

    pendingMessageIdRef.current += 1;
    const optimisticMessage: ChatMessageItem = {
      id: `pending-${pendingMessageIdRef.current}`,
      conversationId,
      role: "USER",
      content: trimmed,
      confidence: null,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setIsSending(true);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/assistant/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      const reply = data.reply as AssistantReply;
      setMessages((prev) => [...prev, reply.message]);
      setFollowUpQuestions(reply.followUpQuestions);
      setWarnings(reply.warnings);
      setConversations((prev) => {
        const withoutCurrent = prev.filter((c) => c.id !== reply.conversation.id);
        return [reply.conversation, ...withoutCurrent];
      });
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="flex flex-col gap-4 p-4">
        <Button
          type="button"
          size="sm"
          disabled={isStartingChat}
          onClick={handleNewChat}
        >
          {isStartingChat ? <Spinner /> : <MessageSquarePlus className="size-4" />}
          New chat
        </Button>

        <div className="flex flex-col gap-1">
          <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Conversations
          </h2>
          {conversations.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No conversations yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {conversations.map((conversation) => (
                <li key={conversation.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={cn(
                      "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      conversation.id === activeId
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-accent/50 text-foreground",
                    )}
                  >
                    {conversation.title}
                  </button>
                  <ConfirmDialog
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        disabled={deletingId === conversation.id}
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    }
                    title="Delete this conversation?"
                    description="This cannot be undone."
                    confirmLabel="Delete"
                    onConfirm={() => handleDelete(conversation.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="flex h-[32rem] flex-col gap-0 p-0">
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingConversation ? (
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="text-muted-foreground text-sm">
                Ask me anything about this resume — reviews, tailoring,
                skill gaps, or career advice.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <Button
                    key={question}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-1",
                    message.role === "USER" ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
                      message.role === "USER"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {message.content}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              ))}
              {isSending && (
                <div className="flex items-start">
                  <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-xl px-3 py-2 text-sm">
                    <Spinner />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {warnings.length > 0 && (
          <div className="border-border border-t px-4 py-2">
            {warnings.map((warning) => (
              <p key={warning} className="text-warning text-xs">
                {warning}
              </p>
            ))}
          </div>
        )}

        {followUpQuestions.length > 0 && (
          <div className="border-border flex flex-wrap gap-2 border-t px-4 py-2">
            {followUpQuestions.map((question) => (
              <Button
                key={question}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => sendMessage(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="text-destructive px-4 pt-2 text-sm">
            {error}
          </p>
        )}

        <form
          className="border-border flex items-end gap-2 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
        >
          <Textarea
            rows={1}
            placeholder="Ask about your resume..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            className="max-h-32 min-h-9 resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSending || isStartingChat || !input.trim()}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}

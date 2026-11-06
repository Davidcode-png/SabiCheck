"use client";

import {
  ArrowUp,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { useOrganizations } from "@/components/organizations/organization-provider";
import { cn } from "@/lib/cn";
import { ApiError } from "@/lib/api/client";
import { assistantApi, type AssistantTurn } from "@/lib/api/assistant";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
};

const GREETING =
  "Hi! Ask me about this workspace — products, verification codes, consumer reports, distributors, or code spend. I answer from live SabiCheck data only, and I never issue authenticity verdicts.";

const SUGGESTIONS = [
  "How many codes are still unused?",
  "What are my urgent reports?",
  "Which distributor has the most reports?",
  "How much have I spent on codes?",
];

function greetingMessage(): ChatMessage {
  return {
    id: "greeting",
    role: "assistant",
    content: GREETING,
  };
}

function messageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function historyFrom(messages: ChatMessage[]): AssistantTurn[] {
  return messages
    .filter((message) => !message.error && message.id !== "greeting")
    .map(({ role, content }) => ({ role, content }))
    .slice(-12);
}

export function WorkspaceAssistant({
  variant = "topbar",
}: {
  variant?: "topbar" | "mobile";
}) {
  const { selectedOrganization } = useOrganizations();
  const organizationId = selectedOrganization?.id ?? null;
  const [messages, setMessages] = useState<ChatMessage[]>([greetingMessage()]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadedKeyRef = useRef<string | null>(null);

  const storageKey = organizationId
    ? `sabicheck:assistant:${organizationId}`
    : null;

  useEffect(() => {
    if (!storageKey || loadedKeyRef.current !== storageKey) return;

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // Storage may be unavailable in private mode; chat still works.
    }
  }, [messages, storageKey]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending, open]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function openAssistant() {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Load the saved conversation for this workspace the first time the
    // drawer opens. Doing this in the event handler avoids a render cascade.
    if (storageKey && loadedKeyRef.current !== storageKey) {
      loadedKeyRef.current = storageKey;
      let next: ChatMessage[] = [greetingMessage()];

      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as ChatMessage[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            next = parsed;
          }
        }
      } catch {
        // Ignore unreadable storage and start fresh.
      }

      setMessages(next);
    }

    if (!dialog.open) dialog.showModal();
    setOpen(true);
    document.body.style.overflow = "hidden";
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function closeAssistant() {
    dialogRef.current?.close();
  }

  function handleClose() {
    setOpen(false);
    document.body.style.overflow = "";
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) closeAssistant();
  }

  function resetChat() {
    setMessages([greetingMessage()]);
    setInput("");
    inputRef.current?.focus();
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending || !organizationId) return;

    const history = historyFrom(messages);
    const userMessage: ChatMessage = {
      id: messageId(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);

    try {
      const answer = await assistantApi.ask(
        organizationId,
        trimmed,
        history,
      );
      setMessages((current) => [
        ...current,
        {
          id: messageId(),
          role: "assistant",
          content: answer.answer,
        },
      ]);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again.";
      setMessages((current) => [
        ...current,
        {
          id: messageId(),
          role: "assistant",
          content: message,
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(input);
    }
  }

  const showSuggestions = messages.length <= 1;

  return (
    <>
      <button
        type="button"
        onClick={openAssistant}
        aria-label="Open SabiCheck assistant"
        aria-haspopup="dialog"
        title="Ask SabiCheck"
        className={cn(
          "relative flex items-center justify-center rounded-full text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
          variant === "mobile" ? "h-10 w-10" : "h-9 w-9",
        )}
      >
        <MessageSquareText
          aria-hidden="true"
          className="h-5 w-5"
          strokeWidth={1.8}
        />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="SabiCheck assistant"
        onClose={handleClose}
        onClick={handleDialogClick}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(430px,100vw)] max-w-none border-0 border-l border-dash-line bg-white p-0 text-ink backdrop:bg-brand-ink/35 open:flex open:flex-col"
      >
        <div className="flex h-full min-h-0 flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-dash-line px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dash-tint text-brand-ink">
                <Sparkles
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={1.8}
                />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-brand-ink">
                  SabiCheck Assistant
                </h2>
                <p className="mt-0.5 text-xs leading-5 text-dash-muted">
                  {selectedOrganization
                    ? `Workspace data only · ${selectedOrganization.name}`
                    : "Select a workspace to ask a question"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                aria-label="Start a new chat"
                title="New chat"
                className="flex h-9 w-9 items-center justify-center rounded-full text-dash-muted transition-colors hover:bg-dash-soft hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
              >
                <RotateCcw
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={1.8}
                />
              </button>
              <button
                type="button"
                onClick={closeAssistant}
                aria-label="Close assistant"
                className="flex h-9 w-9 items-center justify-center rounded-full text-dash-muted transition-colors hover:bg-dash-soft hover:text-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
              >
                <X
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={2}
                />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-6",
                      message.role === "user"
                        ? "rounded-br-md bg-brand text-white"
                        : message.error
                          ? "rounded-bl-md border border-red-200 bg-red-50 text-red-700"
                          : "rounded-bl-md border border-dash-line bg-dash-canvas text-brand-ink",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {sending ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-dash-line bg-dash-canvas px-3.5 py-3">
                    <span className="sr-only">Assistant is typing</span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-dash-muted [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-dash-muted [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-dash-muted" />
                  </div>
                </div>
              ) : null}

              {showSuggestions ? (
                <div className="pt-1">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-dash-muted">
                    Try asking
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => void send(suggestion)}
                        disabled={!organizationId || sending}
                        className="rounded-full border border-dash-line bg-white px-3 py-1.5 text-left text-xs font-medium text-brand-ink transition-colors hover:bg-dash-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-dash-line px-4 py-3">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
              }}
              className="flex items-end gap-2 rounded-2xl border border-dash-line bg-white p-2 focus-within:ring-4 focus-within:ring-brand/10"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={2000}
                disabled={!organizationId || sending}
                placeholder={
                  selectedOrganization
                    ? "Ask about this workspace…"
                    : "Select a workspace first"
                }
                aria-label="Ask the SabiCheck assistant"
                className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-[13px] leading-5 text-brand-ink outline-none placeholder:text-dash-muted disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!organizationId || sending || !input.trim()}
                aria-label="Send question"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed disabled:bg-dash-soft disabled:text-dash-muted"
              >
                <ArrowUp
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={2.2}
                />
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] leading-4 text-dash-muted">
              AI answers can be wrong. SabiCheck verification stays
              deterministic.
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}

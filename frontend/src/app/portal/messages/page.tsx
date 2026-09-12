"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

import { usePortal } from "@/components/portal/PortalContext";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { Alert, EmptyState, LoadingPanel } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { clsx } from "@/lib/clsx";
import { formatDateTime } from "@/lib/format";
import type { MessageItem } from "@/lib/types";

export default function PortalMessagesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { dashboard, refresh } = usePortal();
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setMessages(await api.get<MessageItem[]>("/portal/messages", true));
      setError(null);
      // Opening the thread marks staff messages read server-side.
      void refresh();
    } catch {
      setError("We couldn't load your messages. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
    // `refresh` is stable from the provider; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;

    setSending(true);
    try {
      const created = await api.post<MessageItem>("/portal/messages", { body: text }, true);
      setMessages((current) => [...current, created]);
      setBody("");
    } catch {
      toast.error("Message not sent", "Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const specialist = dashboard?.profile.assigned_specialist_name;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="card-surface flex min-h-[26rem] flex-col">
        <div className="border-b border-navy-100 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-navy-900">
            Messages{specialist ? ` with ${specialist}` : ""}
          </h2>
          <p className="text-sm text-muted">
            Everything here is attached to your file, so nothing gets lost in a text thread.
          </p>
        </div>

        <div className="scroll-slim flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <LoadingPanel label="Loading messages…" />
          ) : error ? (
            <Alert tone="error">{error}</Alert>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="size-5" />}
              title="No messages yet"
              description="Send the first message — your specialist replies during business hours."
            />
          ) : (
            <ul className="space-y-4">
              {messages.map((message) => {
                const mine = message.author_role === "client";
                return (
                  <li
                    key={message.id}
                    className={clsx("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div className={clsx("max-w-[85%]", mine && "text-right")}>
                      <div
                        className={clsx(
                          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                          mine
                            ? "rounded-br-sm bg-brand-600 text-white"
                            : "rounded-bl-sm bg-navy-50 text-navy-800",
                        )}
                      >
                        {message.body}
                      </div>
                      <p className="mt-1.5 px-1 text-[0.6875rem] text-muted">
                        {mine ? "You" : message.author_name} ·{" "}
                        {formatDateTime(message.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="border-t border-navy-100 p-4">
          <TextArea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a message to your specialist…"
            className="min-h-20"
            maxLength={4000}
            onKeyDown={(event) => {
              // Cmd/Ctrl+Enter sends without reaching for the mouse.
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                void send(event);
              }
            }}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Don’t include full account numbers or your SSN here.
            </p>
            <Button type="submit" loading={sending} disabled={!body.trim()}>
              {!sending ? <Send className="size-4" aria-hidden /> : null}
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The URL of the refund agent's own service (a separate repository,
 * `ksor-worker`, run as its own FastAPI process — see AGENTS.md's
 * "Operational rules" section for why). Baked in at BUILD time: this site
 * is a static export with no live server of its own, so there's no
 * runtime env var to read here, only `NEXT_PUBLIC_*` values Next inlines
 * when the site is built.
 */
const REFUND_AGENT_URL = process.env.NEXT_PUBLIC_KSOR_WORKER_URL ?? "http://127.0.0.1:8000";

const SESSION_STORAGE_KEY = "ksor-refund-session-id";

interface ChatMessage {
  role: "user" | "assistant" | "error";
  content: string;
}

interface RefundResponse {
  answer: string;
  session_id: string;
}

/**
 * A floating refund-assistant widget, present on every page (mounted once
 * in app/layout.tsx). Talks directly to the refund agent's own FastAPI
 * service in the browser — there is no route in this app to proxy
 * through, since `output: "export"` means no live Next server exists at
 * runtime to host one.
 *
 * Memory persists across a reload, not just within one open panel: the
 * session id is generated once and kept in localStorage, and the same id
 * is sent on every request so the agent's own server-side session
 * (a SQLiteSession, keyed by this id) keeps accumulating the same
 * conversation.
 */
export function RefundWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // A fresh id per browser, not per tab/mount — read once, persisted.
  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (existing !== null) {
        setSessionId(existing);
        return;
      }
      const fresh = crypto.randomUUID();
      window.localStorage.setItem(SESSION_STORAGE_KEY, fresh);
      setSessionId(fresh);
    } catch {
      // Private browsing / storage disabled: fall back to a session-only id
      // so the widget still works, just without surviving a reload.
      setSessionId(crypto.randomUUID());
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(): Promise<void> {
    const query = input.trim();
    if (query === "" || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${REFUND_AGENT_URL}/refund`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, session_id: sessionId }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? `Request failed (${res.status})`);
      }

      const data = (await res.json()) as RefundResponse;
      setSessionId(data.session_id);
      try {
        window.localStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
      } catch {
        // Storage may be unavailable — the conversation still works for
        // this page view, it just won't survive a reload.
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      // Visible, not silent: a fetch failure or a 502/500 renders as a
      // plain error bubble in the thread, never a blank space.
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => [...prev, { role: "error", content: message }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {isOpen && (
        <div
          role="dialog"
          aria-label="Refund assistant"
          className={cn(
            "flex h-[min(32rem,calc(100vh-8rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden",
            "rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-200",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold">Refund Assistant</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close refund assistant"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
            >
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ask about refunds, returns, or how they affect your affiliate commission.
              </p>
            )}
            {messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  message.role === "user" && "ml-auto bg-primary text-primary-foreground",
                  message.role === "assistant" && "bg-muted text-foreground",
                  message.role === "error" &&
                    "border border-destructive/30 bg-destructive/10 text-destructive",
                )}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a refund question…"
              aria-label="Your question"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || input.trim() === ""}>
              <Send className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      )}

      <Button
        type="button"
        size="icon-lg"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close refund assistant" : "Open refund assistant"}
        className={cn(
          "rounded-full shadow-lg hover:scale-105 active:scale-95",
          "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in motion-safe:duration-300",
        )}
      >
        {isOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </div>
  );
}

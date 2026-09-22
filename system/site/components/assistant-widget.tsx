"use client";

import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The URL of ksor-worker's own FastAPI service (a separate repository,
 * run as its own process — see AGENTS.md's "Operational rules" section
 * for why). Baked in at BUILD time: this site is a static export with no
 * live server of its own, so there's no runtime env var to read here,
 * only `NEXT_PUBLIC_*` values Next inlines when the site is built.
 */
const ASSISTANT_URL = process.env.NEXT_PUBLIC_KSOR_WORKER_URL ?? "http://127.0.0.1:8000";

type Mode = "general" | "triage";

// One localStorage key per mode, matching the backend's own separation —
// /chat keeps its history in general_sessions.db, /triage in
// triage_sessions.db (see ksor-worker's triage_agent.py), so a General
// conversation and a Smart Triage conversation never share memory either.
const SESSION_STORAGE_KEY = "ksor-chat-session-id";
const TRIAGE_SESSION_STORAGE_KEY = "ksor-triage-session-id";
const MODE_STORAGE_KEY = "ksor-assistant-mode";

interface ChatMessage {
  role: "user" | "assistant" | "error";
  content: string;
  routedTo?: string;
}

interface ChatApiResponse {
  answer: string;
  session_id: string;
}

interface TriageApiResponse {
  answer: string;
  session_id: string;
  routed_to: string;
}

/**
 * A floating assistant widget, present on every page (mounted once in
 * app/layout.tsx). Two modes, switched by a toggle at the top of the
 * panel:
 * - **General** — ksor-worker's `/chat` endpoint, the unrestricted-by-topic
 *   agent (refunds included, no domain split; see ksor-worker's
 *   `general_agent.py` and CLAUDE.md rule 3/8 for why `/ask` and `/refund`
 *   stay separate and narrower while this one doesn't split at all).
 * - **Smart Triage** — ksor-worker's `/triage` endpoint, a real
 *   orchestration agent (OpenAI Agents SDK `handoffs`, not a keyword
 *   dispatcher) that routes each query to one of 5 specialists and reports
 *   which one actually answered — shown as a "Routed to: X" caption under
 *   each reply so it's visible the orchestration is real, not decorative.
 *   See ksor-worker's `triage_agent.py` and `docs/adr/005-triage-handoffs.md`.
 *
 * Calls the API directly from the browser — there is no route in this app
 * to proxy through, since `output: "export"` means no live Next server
 * exists at runtime to host one.
 *
 * Memory persists across a reload, not just within one open panel, and
 * separately per mode: each mode keeps its own session id (localStorage)
 * and its own message history, matching the backend's own separation
 * (`general_sessions.db` vs `triage_sessions.db` — a General conversation
 * and a Smart Triage conversation never share memory either).
 */
export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("general");
  const [generalMessages, setGeneralMessages] = useState<ChatMessage[]>([]);
  const [triageMessages, setTriageMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generalSessionId, setGeneralSessionId] = useState<string | null>(null);
  const [triageSessionId, setTriageSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = mode === "general" ? generalMessages : triageMessages;
  const setMessages = mode === "general" ? setGeneralMessages : setTriageMessages;

  // A fresh id per browser per mode, not per tab/mount — read once, persisted.
  useEffect(() => {
    function loadOrMint(key: string): string {
      try {
        const existing = window.localStorage.getItem(key);
        if (existing !== null) return existing;
        const fresh = crypto.randomUUID();
        window.localStorage.setItem(key, fresh);
        return fresh;
      } catch {
        // Private browsing / storage disabled: fall back to a session-only
        // id so the widget still works, just without surviving a reload.
        return crypto.randomUUID();
      }
    }
    setGeneralSessionId(loadOrMint(SESSION_STORAGE_KEY));
    setTriageSessionId(loadOrMint(TRIAGE_SESSION_STORAGE_KEY));
    try {
      const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (savedMode === "general" || savedMode === "triage") setMode(savedMode);
    } catch {
      // Storage unavailable — default mode stands.
    }
  }, []);

  function switchMode(next: Mode): void {
    setMode(next);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // Storage unavailable — the toggle still works for this page view.
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(): Promise<void> {
    const query = input.trim();
    if (query === "" || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setInput("");
    setIsLoading(true);

    const endpoint = mode === "general" ? "/chat" : "/triage";
    const sessionId = mode === "general" ? generalSessionId : triageSessionId;
    const sessionStorageKey = mode === "general" ? SESSION_STORAGE_KEY : TRIAGE_SESSION_STORAGE_KEY;
    const setSessionId = mode === "general" ? setGeneralSessionId : setTriageSessionId;

    try {
      const res = await fetch(`${ASSISTANT_URL}${endpoint}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, session_id: sessionId }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? `Request failed (${res.status})`);
      }

      const data = (await res.json()) as ChatApiResponse | TriageApiResponse;
      setSessionId(data.session_id);
      try {
        window.localStorage.setItem(sessionStorageKey, data.session_id);
      } catch {
        // Storage may be unavailable — the conversation still works for
        // this page view, it just won't survive a reload.
      }
      const routedTo = "routed_to" in data ? data.routed_to : undefined;
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, routedTo }]);
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
          aria-label="KSOR assistant"
          className={cn(
            "flex h-[min(32rem,calc(100vh-8rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden",
            "rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-200",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold">KSOR Assistant</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring"
            >
              <X className="size-4" />
            </button>
          </div>

          <div
            role="tablist"
            aria-label="Assistant mode"
            className="flex gap-1 border-b border-border px-3 py-2"
          >
            {(["general", "triage"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {m === "general" ? "General" : "Smart Triage"}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {mode === "general"
                  ? "Ask anything about Amazon affiliate marketing — product hunting, reviews, sourcing, listings, or refunds and returns."
                  : "Smart Triage routes your question to the right specialist automatically — refunds, sensitive data, answer verification, model-selection advice, or general knowledge — and shows which one answered."}
              </p>
            )}
            {messages.map((message, i) => (
              <div key={i} className={cn(message.role === "user" && "flex justify-end")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    message.role === "user" && "bg-primary text-primary-foreground",
                    message.role === "assistant" && "bg-muted text-foreground",
                    message.role === "error" &&
                      "border border-destructive/30 bg-destructive/10 text-destructive",
                  )}
                >
                  {message.content}
                </div>
                {message.role === "assistant" && message.routedTo && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Routed to: {message.routedTo}
                  </p>
                )}
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
              placeholder="Ask a question…"
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
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
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

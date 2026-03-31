"use client";
// components/ChatSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// USAGE: wrap with a fixed-height container so scroll works correctly.
//   <div className="h-[500px]"><ChatSection slug="my-bot" /></div>
//   OR inside FloatingChat which already constrains the height.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, KeyboardEvent } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  slug: string;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          style={{ animationDelay: `${d}ms` }}
          className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
        />
      ))}
    </div>
  );
}

export default function ChatSection({ slug }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // scrollRef → the scrollable messages div (NOT window)
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom inside the messages container only
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const asstMsg: Message = { role: "assistant", content: "" };
    setMessages((p) => [...p, asstMsg]);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api"}/chat/${slug}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...messages, userMsg] }),
        },
      );
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      outer: while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        for (const line of decoder
          .decode(value)
          .split("\n\n")
          .filter(Boolean)) {
          if (line === "data: [DONE]") break outer;
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed?.text) {
                asstMsg.content += parsed.text;
                setMessages((prev) => {
                  const u = [...prev];
                  u[u.length - 1] = { ...asstMsg };
                  return u;
                });
              }
            } catch {
              /* skip bad chunk */
            }
          }
        }
      }
    } catch {
      asstMsg.content = "Алдаа гарлаа. Дахин оролдоно уу.";
      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = { ...asstMsg };
        return u;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const lastIdx = messages.length - 1;
  const canSend = !isLoading && !!input.trim();

  return (
    // h-full fills whatever height the parent gives — scroll is contained here
    <div className="flex flex-col h-full bg-[#13131f] overflow-hidden">
      {/* ── Scrollable messages ───────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-2"
        style={{ overscrollBehavior: "contain" }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 pointer-events-none select-none">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <line x1="12" y1="7" x2="12" y2="11" />
                <line x1="8" y1="15" x2="8" y2="17" />
                <line x1="16" y1="15" x2="16" y2="17" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">Асуултаа бичнэ үү</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLast = i === lastIdx;

          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end mb-3">
                <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[78%] leading-relaxed shadow-lg shadow-violet-500/20 break-words">
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="flex items-end gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow shadow-violet-500/30">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <line x1="12" y1="7" x2="12" y2="11" />
                </svg>
              </div>
              <div className="bg-[#1e1e2e] border border-white/[0.06] text-slate-200 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[78%] leading-relaxed break-words">
                {msg.content.length === 0 && isLoading && isLast ? (
                  <TypingDots />
                ) : (
                  msg.content
                )}
                {isLoading && isLast && msg.content.length > 0 && (
                  <span className="inline-block w-0.5 h-3.5 bg-violet-400 ml-0.5 align-middle animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 py-3 bg-[#16162a] border-t border-white/[0.06]">
        <div className="flex items-end gap-2 bg-[#1e1e2e] border border-white/[0.08] rounded-2xl px-3 py-2.5 focus-within:border-violet-500/50 focus-within:shadow-lg focus-within:shadow-violet-500/10 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Асуулт бичнэ үү…"
            className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-600 text-sm resize-none outline-none leading-relaxed"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={sendMessage}
            disabled={!canSend}
            className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 ${
              canSend
                ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow shadow-violet-500/30 hover:scale-105 active:scale-95"
                : "bg-white/5 text-slate-600 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <svg
                className="animate-spin"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-center text-[10.5px] text-slate-700 mt-2">
          Enter → илгээх &nbsp;·&nbsp; Shift+Enter → мөр
        </p>
      </div>
    </div>
  );
}

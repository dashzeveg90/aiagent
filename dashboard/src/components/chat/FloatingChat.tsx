"use client";
import { useState, useEffect, useRef } from "react";
import ChatSection from "./ChatSection";

interface Props {
  slug: string;
  title?: string;
  subtitle?: string;
  position?: "right" | "left";
}

export default function FloatingChat({
  slug,
  title = "AI Туслагч",
  subtitle = "Онлайн",
  position = "right",
}: Props) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [visible, setVisible] = useState(false); // controls mount for exit animation
  const [animOut, setAnimOut] = useState(false); // triggers slide-out class
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isRight = position !== "left";

  // Open: mount immediately then animate in
  // Close: animate out, then unmount after 220 ms
  const toggle = () => {
    if (open) {
      setAnimOut(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setAnimOut(false);
        setOpen(false);
      }, 220);
    } else {
      setOpen(true);
      setVisible(true);
      setUnread(0);
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const side = isRight ? "right-6" : "left-6";

  return (
    <>
      <style>{`
        @keyframes cwIn  { from{opacity:0;transform:translateY(16px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes cwOut { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(16px) scale(.96)} }
        @keyframes cwPulse { 0%,100%{box-shadow:0 6px 24px #7c3aed55,0 2px 8px #0004} 70%{box-shadow:0 6px 24px #7c3aed55,0 0 0 12px #7c3aed00,0 2px 8px #0004} }
        .cw-in  { animation: cwIn  .25s cubic-bezier(.22,1,.36,1) both; }
        .cw-out { animation: cwOut .22s cubic-bezier(.4,0,1,1)   both; }
        .cw-fab { animation: cwPulse 2.8s infinite; }
      `}</style>

      {/* ── Floating panel ── */}
      {visible && (
        <div
          className={`fixed ${side} bottom-24 z-50 flex flex-col rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl shadow-black/50 ${animOut ? "cw-out" : "cw-in"}`}
          style={{
            width: 380,
            maxWidth: "calc(100vw - 48px)",
            // Fixed height so ChatSection scroll works correctly
            height: 520,
            maxHeight: "calc(100vh - 120px)",
            boxShadow:
              "0 24px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.04), 0 8px 24px #7c3aed22",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-[#16162a] border-b border-white/[0.06] flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
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
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-100 leading-none">
                {title}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-400">{subtitle}</span>
              </div>
            </div>
            <button
              onClick={toggle}
              className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/*
            flex-1 + min-h-0 is critical:
            Without min-h-0 the inner ChatSection cannot shrink and scroll won't work.
          */}
          <div className="flex-1 min-h-0">
            <ChatSection slug={slug} />
          </div>
        </div>
      )}

      {/* ── FAB button ── */}
      <button
        onClick={toggle}
        aria-label={open ? "Хаах" : "Чат нээх"}
        className={`cw-fab fixed ${side} bottom-6 z-50 w-14 h-14 rounded-full border-none bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95`}
      >
        <span
          className="flex items-center justify-center transition-all duration-250"
          style={{ transform: open ? "rotate(90deg) scale(.85)" : "none" }}
        >
          {open ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <line x1="12" y1="7" x2="12" y2="11" />
              <line x1="8" y1="15" x2="8" y2="17" />
              <line x1="16" y1="15" x2="16" y2="17" />
            </svg>
          )}
        </span>

        {/* Unread badge */}
        {!open && unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-[#0f0f1a]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}

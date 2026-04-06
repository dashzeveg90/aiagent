"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
  RobotOutlined,
  CloseOutlined,
  SendOutlined,
  LoadingOutlined,
  UserOutlined,
} from "@ant-design/icons";

interface Props {
  slug: string;
  mode: "floating" | "inline";
  position?: "right" | "left";
}
interface Msg {
  role: "user" | "assistant";
  content: string;
}
interface Cfg {
  name: string;
  brandColor: string;
  logoUrl: string;
  chatBg: string;
  titleColor: string;
  textColor: string;
  subtitle: string;
  greeting: string;
  subscription: { isActive: boolean; endsAt: string | null };
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5005/api";
const isActive = (c: Cfg) => {
  if (!c.subscription?.isActive) return false;
  const end = c.subscription.endsAt;
  if (!end) return true;
  return new Date(end) > new Date();
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  size,
  logoUrl,
  accent,
}: {
  size: "sm" | "lg";
  logoUrl?: string;
  accent: string;
}) {
  const lg = size === "lg";
  return (
    <div
      className={`${lg ? "w-9 h-9 rounded-xl" : "w-6 h-6 rounded-full"} flex items-center justify-center shrink-0 overflow-hidden bg-white/20`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <RobotOutlined style={{ fontSize: lg ? 16 : 11, color: "white" }} />
      )}
    </div>
  );
}

// ─── Animations only ─────────────────────────────────────────────────────────
const CSS = (accent: string) => `
  @keyframes cwIn     { from{opacity:0;transform:translateY(14px) scale(.96)} to{opacity:1;transform:none} }
  @keyframes cwOut    { from{opacity:1} to{opacity:0;transform:translateY(14px) scale(.96)} }
  @keyframes cwPulse  { 0%,100%{box-shadow:0 6px 20px ${accent}55} 70%{box-shadow:0 6px 20px ${accent}55,0 0 0 10px ${accent}00} }
  @keyframes cwBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes cwBlink  { 0%,100%{opacity:1} 50%{opacity:0} }
  .cw-in{animation:cwIn .25s cubic-bezier(.22,1,.36,1) both}
  .cw-out{animation:cwOut .2s ease-in both}
  .cw-fab{animation:cwPulse 3s infinite} .cw-fab:hover{transform:scale(1.08)}
  .cw-dot{animation:cwBounce 1s infinite} .cw-dot:nth-child(2){animation-delay:.15s} .cw-dot:nth-child(3){animation-delay:.3s}
  .cw-blink{animation:cwBlink .8s infinite}
  .cw-bounce{animation:cwBounce 2s infinite}
  ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:4px}
`;

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ cfg, onClose }: { cfg: Cfg; onClose?: () => void }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 shrink-0 border-b border-black/10"
      style={{ background: cfg.brandColor }}
    >
      <Avatar
        size="lg"
        logoUrl={cfg.logoUrl || undefined}
        accent={cfg.brandColor}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold leading-none truncate"
          style={{ color: cfg.titleColor }}
        >
          {cfg.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-300 shrink-0 cw-bounce" />
          <span
            className="text-[11px] opacity-80"
            style={{ color: cfg.titleColor }}
          >
            {cfg.subtitle}
          </span>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/10 transition-colors border-none cursor-pointer bg-transparent"
        >
          <CloseOutlined style={{ fontSize: 13, color: cfg.titleColor }} />
        </button>
      )}
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
function Chat({ slug, cfg }: { slug: string; cfg: Cfg }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const resize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 108) + "px";
  };

  const send = async () => {
    if (!input.trim() || busy) return;
    const user: Msg = { role: "user", content: input.trim() };
    const asst: Msg = { role: "assistant", content: "" };
    setMsgs((p) => [...p, user, asst]);
    setInput("");
    setBusy(true);
    if (taRef.current) taRef.current.style.height = "auto";
    try {
      const res = await fetch(`${BASE}/chat/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...msgs, user] }),
      });
      if (!res.body) throw 0;
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      outer: while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n\n").filter(Boolean)) {
          if (line === "data: [DONE]") break outer;
          if (line.startsWith("data: ")) {
            try {
              const p = JSON.parse(line.slice(6));
              if (p?.text) {
                asst.content += p.text;
                setMsgs((prev) => {
                  const u = [...prev];
                  u[u.length - 1] = { ...asst };
                  return u;
                });
              }
            } catch {}
          }
        }
      }
    } catch {
      asst.content = "Алдаа гарлаа. Дахин оролдоно уу.";
      setMsgs((prev) => {
        const u = [...prev];
        u[u.length - 1] = { ...asst };
        return u;
      });
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };
  const last = msgs.length - 1;
  const can = !busy && !!input.trim();
  const logo = cfg.logoUrl || undefined;

  // Bot bubble background — слегка затемнённый вариант chatBg
  const botBg = `color-mix(in srgb, ${cfg.chatBg} 85%, #000)`;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: cfg.chatBg }}
    >
      {/* messages */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2.5 overscroll-contain"
      >
        {cfg.greeting && msgs.length === 0 && (
          <div className="flex items-end gap-2">
            <Avatar size="sm" logoUrl={logo} accent={cfg.brandColor} />
            <div
              className="text-[13px] leading-relaxed px-3 py-2 rounded-2xl rounded-bl-sm max-w-[82%]"
              style={{ background: botBg, color: cfg.textColor }}
            >
              {cfg.greeting}
            </div>
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end items-end gap-2">
              <div
                className="text-[13px] leading-relaxed px-3 py-2 rounded-2xl rounded-br-sm max-w-[82%] break-words"
                style={{ background: cfg.brandColor, color: cfg.titleColor }}
              >
                {m.content}
              </div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: botBg }}
              >
                <UserOutlined style={{ fontSize: 11, color: cfg.textColor }} />
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-end gap-2">
              <Avatar size="sm" logoUrl={logo} accent={cfg.brandColor} />
              <div
                className="text-[13px] leading-relaxed px-3 py-2 rounded-2xl rounded-bl-sm max-w-[82%] break-words"
                style={{ background: botBg, color: cfg.textColor }}
              >
                {busy && i === last && m.content.length === 0 ? (
                  <span className="inline-flex gap-1">
                    {[0, 1, 2].map((j) => (
                      <span
                        key={j}
                        className="w-1.5 h-1.5 rounded-full inline-block cw-dot"
                        style={{
                          background: cfg.brandColor,
                          animationDelay: j ? `${j * 0.15}s` : undefined,
                        }}
                      />
                    ))}
                  </span>
                ) : (
                  m.content
                )}
                {busy && i === last && m.content.length > 0 && (
                  <span
                    className="inline-block w-0.5 h-3 ml-0.5 align-middle cw-blink"
                    style={{ background: cfg.brandColor }}
                  />
                )}
              </div>
            </div>
          ),
        )}
      </div>

      {/* input */}
      <div
        className="shrink-0 px-3 pb-3 pt-2 border-t border-black/5"
        style={{ background: cfg.chatBg }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2 border transition-all"
          style={{ background: botBg, borderColor: "rgba(0,0,0,0.08)" }}
        >
          <textarea
            ref={taRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resize();
            }}
            onKeyDown={onKey}
            disabled={busy}
            placeholder="Асуулт бичнэ үү…"
            className="flex-1 bg-transparent border-none outline-none text-[13px] leading-relaxed resize-none font-[inherit] max-h-[108px] min-h-5"
            style={{ color: cfg.textColor }}
          />
          <button
            onClick={send}
            disabled={!can}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border-none cursor-pointer transition-opacity disabled:opacity-40"
            style={{ background: cfg.brandColor }}
          >
            {busy ? (
              <LoadingOutlined
                style={{ fontSize: 12, color: cfg.titleColor }}
              />
            ) : (
              <SendOutlined style={{ fontSize: 12, color: cfg.titleColor }} />
            )}
          </button>
        </div>
        <p
          className="text-center text-[10px] mt-1.5 opacity-30"
          style={{ color: cfg.textColor }}
        >
          Enter → илгээх · Shift+Enter → мөр
        </p>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function WidgetRoot({ slug, mode, position = "right" }: Props) {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [anim, setAnim] = useState<"in" | "out" | null>(null);
  const [unread, setUnread] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    fetch(`${BASE}/companies/slug/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { status: string; data: { company: Cfg } } | null) => {
        if (d?.status === "success") setCfg(d.data.company);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [slug]);

  const openP = () => {
    setShow(true);
    setAnim("in");
    setOpen(true);
    setUnread(0);
  };
  const closeP = () => {
    setAnim("out");
    timer.current = setTimeout(() => {
      setShow(false);
      setAnim(null);
      setOpen(false);
    }, 210);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    window.parent?.postMessage({ type: "cw:toggle", open }, "*");
  }, [open]);

  if (!ready || !cfg || !isActive(cfg)) return null;

  const accent = cfg.brandColor || "#7c3aed";
  const logoUrl = cfg.logoUrl || undefined;
  const pos = position === "left" ? "left-5" : "right-5";

  const Panel = (withClose?: boolean) => (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-black/10 shadow-2xl">
      <Header cfg={cfg} onClose={withClose ? closeP : undefined} />
      <div className="flex-1 min-h-0">
        <Chat slug={slug} cfg={cfg} />
      </div>
    </div>
  );

  if (mode === "inline")
    return (
      <>
        <style>{CSS(accent)}</style>
        <div className="flex flex-col h-screen">{Panel()}</div>
      </>
    );

  return (
    <>
      <style>{CSS(accent)}</style>
      {show && (
        <div
          className={`fixed ${pos} bottom-[84px] w-[calc(100vw-40px)] max-w-sm h-[calc(100vh-110px)] max-h-[500px] flex flex-col z-[99] ${anim === "out" ? "cw-out" : "cw-in"}`}
        >
          {Panel(true)}
        </div>
      )}
      <button
        className={`cw-fab fixed ${pos} bottom-5 rounded-full border-none cursor-pointer flex items-center justify-center z-[100] transition-transform`}
        style={{ background: accent, width: 52, height: 52 }}
        onClick={open ? closeP : openP}
      >
        <span
          className="flex items-center justify-center transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg) scale(.85)" : "none" }}
        >
          {open ? (
            <CloseOutlined style={{ fontSize: 20, color: cfg.titleColor }} />
          ) : logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="w-7 h-7 object-contain rounded"
            />
          ) : (
            <RobotOutlined style={{ fontSize: 22, color: cfg.titleColor }} />
          )}
        </span>
        {!open && unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-red-500 text-white text-[9.5px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}

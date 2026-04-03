import { useState, useMemo } from "react";
import {
  CopyOutlined,
  CheckOutlined,
  CodeOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  slug: string;
  baseUrl?: string;
}

interface Config {
  mode: "floating" | "inline";
  position: "right" | "left";
  subtitle: string;
  greeting: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildSrc(base: string, slug: string, cfg: Config) {
  const p = new URLSearchParams({
    mode: cfg.mode,
    position: cfg.position,
    subtitle: cfg.subtitle,
    greeting: cfg.greeting,
  });
  return `${base}/widget/${slug}?${p}`;
}

function buildEmbed(src: string, mode: "floating" | "inline") {
  if (mode === "inline") {
    return `<iframe\n  src="${src}"\n  style="width:100%;height:600px;border:none;border-radius:16px"\n  allow="clipboard-write"\n></iframe>`;
  }
  return `<style>
  #cw { position:fixed;bottom:0;right:0;width:420px;height:90px;border:none;z-index:9999;transition:height .25s }
</style>
<iframe id="cw" src="${src}" allow="clipboard-write"></iframe>
<script>
  window.addEventListener("message",function(e){
    if(e.data?.type==="cw:toggle")
      document.getElementById("cw").style.height=e.data.open?"600px":"90px";
  });
</script>`;
}

// ─── Small UI atoms ───────────────────────────────────────────────────────────
function CopyBtn({ text, label = "Хуулах" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  border-none cursor-pointer transition-all whitespace-nowrap
                  ${ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
    >
      {ok ? <CheckOutlined /> : <CopyOutlined />}
      {ok ? "Хуулагдлаа" : label}
    </button>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border-none cursor-pointer
        ${active ? "bg-white text-slate-900 shadow-sm" : "bg-transparent text-slate-500 hover:text-slate-700"}`}
    >
      {children}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function EmbedCode({ slug, baseUrl }: Props) {
  const base =
    baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");

  const [cfg, setCfg] = useState<Config>({
    mode: "floating",
    position: "right",
    subtitle: "Онлайн",
    greeting: "Сайн байна уу! Та надаас юу асуухыг хүсч байна вэ?",
  });
  const [showCode, setShowCode] = useState(false);

  const patch = (k: Partial<Config>) => setCfg((p) => ({ ...p, ...k }));

  const src = useMemo(() => buildSrc(base, slug, cfg), [base, slug, cfg]);
  const embed = useMemo(() => buildEmbed(src, cfg.mode), [src, cfg.mode]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
            <CodeOutlined className="text-slate-500 text-sm" />
          </div>
          <span className="text-sm font-semibold text-slate-800">
            Widget суулгах
          </span>
        </div>

        {/* Mode toggle */}
        <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
          <Tab
            active={cfg.mode === "floating"}
            onClick={() => patch({ mode: "floating" })}
          >
            Floating
          </Tab>
          <Tab
            active={cfg.mode === "inline"}
            onClick={() => patch({ mode: "inline" })}
          >
            Inline
          </Tab>
        </div>
      </div>

      {/* ── Options strip ── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
        {cfg.mode === "floating" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Байршил</span>
            <select
              value={cfg.position}
              onChange={(e) =>
                patch({ position: e.target.value as "right" | "left" })
              }
              className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="right">Баруун доод</option>
              <option value="left">Зүүн доод</option>
            </select>
          </div>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            Subtitle
          </span>
          <input
            value={cfg.subtitle}
            onChange={(e) => patch({ subtitle: e.target.value })}
            className="flex-1 text-xs rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Онлайн"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            Мэндчилгээ
          </span>
          <input
            value={cfg.greeting}
            onChange={(e) => patch({ greeting: e.target.value })}
            className="flex-1 text-xs rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Сайн байна уу!..."
          />
        </div>
      </div>

      {/* ── Live iframe preview ── */}
      <div
        className="relative bg-[#f0f2f5]"
        style={{ height: cfg.mode === "inline" ? 480 : 520 }}
      >
        {/* Decorative browser bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white border-b border-slate-200">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 mx-3 bg-slate-100 rounded-md px-3 py-1 text-[11px] text-slate-400 font-mono truncate">
            {src}
          </div>
          <a
            href={src}
            target="_blank"
            rel="noopener"
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FullscreenOutlined className="text-sm" />
          </a>
        </div>

        {/* The actual iframe */}
        {cfg.mode === "inline" ? (
          <iframe
            key={src}
            src={src}
            className="w-full border-none"
            style={{ height: "calc(100% - 41px)" }}
            allow="clipboard-write"
          />
        ) : (
          /* Floating preview: show inside a constrained container */
          <div
            className="relative w-full"
            style={{ height: "calc(100% - 41px)" }}
          >
            <iframe
              key={src}
              src={src}
              className="absolute inset-0 w-full h-full border-none"
              allow="clipboard-write"
            />
          </div>
        )}
      </div>

      {/* ── Embed code strip ── */}
      <div className="border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowCode((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm text-slate-600
                     hover:bg-slate-50 transition-colors border-none cursor-pointer bg-transparent"
        >
          <span className="font-medium">Embed код харах</span>
          <span className="text-slate-400 text-xs">
            {showCode ? "▲ Хаах" : "▼ Нээх"}
          </span>
        </button>

        {showCode && (
          <div className="px-5 pb-5 space-y-3">
            {/* URL row */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
              <span className="flex-1 text-xs font-mono text-slate-500 truncate">
                {src}
              </span>
              <CopyBtn text={src} label="URL хуулах" />
            </div>

            {/* Code block */}
            <div className="relative">
              <pre
                className="bg-slate-900 text-slate-300 text-xs font-mono leading-relaxed
                              rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all max-h-52 overflow-y-auto"
              >
                {embed}
              </pre>
              <div className="absolute top-3 right-3">
                <CopyBtn text={embed} label="Код хуулах" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

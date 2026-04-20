import { useEffect, useState, useRef } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import apiService from "@/lib/api";
import { RobotOutlined, UserOutlined, SendOutlined } from "@ant-design/icons";
import EmbedCode from "@/components/embed/EmbedCode";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  name: string;
  slug: string;
  brandColor: string;
  chatColor: string;
  chatBg: string;
  titleColor: string;
  textColor: string;
  systemPrompt: string;
  logoUrl: string;
  greeting: string;
  subtitle: string;
  [key: string]: unknown;
}

// ─── Color picker row ─────────────────────────────────────────────────────────
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <div
          className="w-7 h-7 rounded-lg border border-slate-200 shadow-sm"
          style={{ background: value }}
        />
        <span className="text-xs text-slate-400 font-mono">{value}</span>
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </div>
    </div>
  );
}

// ─── Live preview ─────────────────────────────────────────────────────────────
function Preview({ f }: { f: FormData }) {
  const botBg =
    f.chatColor?.trim() && f.chatColor !== "#f1f5f9"
      ? f.chatColor
      : `color-mix(in srgb, ${f.chatBg} 85%, #000)`;

  return (
    <div
      className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg w-full max-w-[320px]"
      style={{ fontFamily: "inherit" }}
    >
      {/* header */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 border-b border-black/10"
        style={{ background: f.brandColor }}
      >
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
          {f.logoUrl ? (
            <img
              src={f.logoUrl}
              alt="logo"
              className="w-full h-full object-contain"
            />
          ) : (
            <RobotOutlined style={{ fontSize: 16, color: "white" }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-none truncate"
            style={{ color: f.titleColor }}
          >
            {f.name || "Company нэр"}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 shrink-0" />
            <p
              className="text-[11px] opacity-80"
              style={{ color: f.titleColor }}
            >
              {f.subtitle || "Онлайн"}
            </p>
          </div>
        </div>
      </div>

      {/* messages */}
      <div
        className="px-3 py-3 space-y-2.5 min-h-[140px]"
        style={{ background: f.chatBg }}
      >
        {f.greeting && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-white/20">
              {f.logoUrl ? (
                <img src={f.logoUrl} className="w-full h-full object-contain" />
              ) : (
                <RobotOutlined style={{ fontSize: 11, color: "white" }} />
              )}
            </div>
            <div
              className="text-[13px] leading-relaxed px-3 py-2 rounded-2xl rounded-bl-sm max-w-[82%]"
              style={{ background: botBg, color: f.textColor }}
            >
              {f.greeting}
            </div>
          </div>
        )}

        {/* user bubble */}
        <div className="flex justify-end items-end gap-2">
          <div
            className="text-[13px] leading-relaxed px-3 py-2 rounded-2xl rounded-br-sm max-w-[82%]"
            style={{ background: f.brandColor, color: f.titleColor }}
          >
            Сайн байна уу?
          </div>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ background: botBg }}
          >
            <UserOutlined style={{ fontSize: 11, color: f.textColor }} />
          </div>
        </div>

        {/* bot bubble */}
        <div className="flex items-end gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: botBg }}
          >
            {f.logoUrl ? (
              <img src={f.logoUrl} className="w-full h-full object-contain" />
            ) : (
              <RobotOutlined style={{ fontSize: 11, color: "white" }} />
            )}
          </div>
          <div
            className="text-[13px] leading-relaxed px-3 py-2 rounded-2xl rounded-bl-sm max-w-[82%]"
            style={{ background: botBg, color: f.textColor }}
          >
            Тийм, танд хэрхэн туслах вэ?
          </div>
        </div>
      </div>

      {/* input — widget-root-тай яг ижил */}
      <div
        className="shrink-0 px-3 pb-3 pt-2 border-t border-black/5"
        style={{ background: f.chatBg }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2 border"
          style={{ background: botBg, borderColor: "rgba(0,0,0,0.08)" }}
        >
          <div
            className="flex-1 text-[13px] leading-relaxed opacity-40"
            style={{ color: f.textColor }}
          >
            Асуулт бичнэ үү…
          </div>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-40"
            style={{ background: f.brandColor }}
          >
            <SendOutlined style={{ fontSize: 12, color: f.titleColor }} />
          </div>
        </div>
        <p
          className="text-center text-[10px] mt-1.5 opacity-30"
          style={{ color: f.textColor }}
        >
          Enter → илгээх · Shift+Enter → мөр
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    brandColor: "#2563eb",
    chatColor: "#f1f5f9",
    chatBg: "#ffffff",
    titleColor: "#ffffff",
    textColor: "#1e293b",
    systemPrompt: "",
    logoUrl: "",
    greeting: "",
    subtitle: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: Partial<FormData>) => setFormData((p) => ({ ...p, ...k }));

  useEffect(() => {
    apiService.company
      .getCurrent()
      .then((res) => {
        const c = res.data.company;
        set({
          name: c.name || "",
          slug: c.slug || "",
          brandColor: c.brandColor || "#2563eb",
          chatColor: c.chatColor || "#f1f5f9",
          chatBg: c.chatBg || "#ffffff",
          titleColor: c.titleColor || "#ffffff",
          textColor: c.textColor || "#1e293b",
          systemPrompt: c.systemPrompt || "",
          logoUrl: c.logoUrl || "",
          greeting: c.greeting || "",
          subtitle: c.subtitle || "",
        });
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Алдаа гарлаа"),
      );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.company.updateCurrent(formData);
      toast.success("Тохиргоо хадгалагдлаа");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    placeholder: string,
    key: keyof FormData,
    opts?: { required?: boolean },
  ) => (
    <input
      value={formData[key] as string}
      onChange={(e) => set({ [key]: e.target.value })}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
      placeholder={placeholder}
      required={opts?.required}
    />
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen ml-64 bg-slate-100 md:flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          <h1 className="text-2xl font-bold text-slate-900">Тохиргоо</h1>
          <p className="mt-1 text-sm text-slate-500">
            Компаний мэдээлэл болон чатны дизайн тохируулах.
          </p>
          <EmbedCode slug={formData.slug} />
          <form
            onSubmit={handleSubmit}
            className="mt-6 flex flex-col lg:flex-row gap-6"
          >
            {/* ── Left column ── */}
            <div className="flex-1 space-y-5">
              {/* Company */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <h2 className="text-sm font-semibold text-slate-700">
                  Компани
                </h2>
                {field("Компани нэр", "name", { required: true })}
                {field("Slug", "slug", { required: true })}
                {field("Logo URL", "logoUrl")}
              </section>

              {/* Chat texts */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <h2 className="text-sm font-semibold text-slate-700">
                  Чат текст
                </h2>
                {field("Subtitle (жишээ: Онлайн)", "subtitle")}
                {field("Мэндчилгээ (greeting)", "greeting")}
              </section>

              {/* Colors */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-1">
                  Өнгө
                </h2>
                <ColorField
                  label="Brand / гол өнгө"
                  value={formData.brandColor}
                  onChange={(v) => set({ brandColor: v })}
                />
                <ColorField
                  label="Bot bubble өнгө"
                  value={formData.chatColor}
                  onChange={(v) => set({ chatColor: v })}
                />
                <ColorField
                  label="Header текст өнгө"
                  value={formData.titleColor}
                  onChange={(v) => set({ titleColor: v })}
                />
                <ColorField
                  label="Чат дэвсгэр өнгө"
                  value={formData.chatBg}
                  onChange={(v) => set({ chatBg: v })}
                />
                <ColorField
                  label="Мессежийн текст өнгө"
                  value={formData.textColor}
                  onChange={(v) => set({ textColor: v })}
                />
              </section>

              {/* System prompt */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <h2 className="text-sm font-semibold text-slate-700">
                  System prompt
                </h2>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => set({ systemPrompt: e.target.value })}
                  rows={7}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition resize-none"
                  placeholder="System prompt..."
                />
              </section>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-5 py-3 text-sm font-medium transition-colors"
              >
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </button>
            </div>

            {/* ── Preview ── */}
            <div className="lg:w-72 shrink-0">
              <div className="sticky top-8">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  Урьдчилж харах
                </p>
                <Preview f={formData} />
              </div>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}

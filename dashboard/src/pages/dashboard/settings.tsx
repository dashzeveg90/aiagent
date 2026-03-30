import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import apiService from "@/lib/api";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    brandColor: "#2563eb",
    systemPrompt: "",
    logoUrl: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiService.company.getCurrent();
        const company = response.data.company;
        setFormData({
          name: company.name || "",
          slug: company.slug || "",
          brandColor: company.brandColor || "#2563eb",
          systemPrompt: company.systemPrompt || "",
          logoUrl: company.logoUrl || "",
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Алдаа гарлаа");
      }
    };

    load();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await apiService.company.updateCurrent(formData);
      setMessage("Company тохиргоо хадгалагдлаа");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-100 md:flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Company settings</h1>
          <p className="mt-2 text-slate-500">
            Brand болон system prompt суурь тохиргоо.
          </p>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 space-y-5"
          >
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Company нэр"
              required
            />
            <input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Slug"
              required
            />
            <input
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Logo URL"
            />
            <div>
              <label className="block text-sm text-slate-600 mb-2">Brand color</label>
              <input
                type="color"
                value={formData.brandColor}
                onChange={(e) =>
                  setFormData({ ...formData, brandColor: e.target.value })
                }
                className="h-12 w-24 rounded-xl border border-slate-200"
              />
            </div>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) =>
                setFormData({ ...formData, systemPrompt: e.target.value })
              }
              rows={8}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="System prompt"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-5 py-3 text-sm font-medium"
            >
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}

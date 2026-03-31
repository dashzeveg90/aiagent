import { useCallback, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth";
import apiService from "@/lib/api";

type PackageItem = {
  _id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = {
  name: "",
  code: "",
  description: "",
  price: "10",
  durationDays: "30",
  features: "AI chatbot\nKnowledge base upload\nDashboard management",
  sortOrder: "0",
  isActive: true,
};

export default function PackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedPackage = useMemo(
    () => packages.find((item) => item._id === selectedId) || null,
    [packages, selectedId],
  );

  const loadPackages = useCallback(async () => {
    try {
      const response = await apiService.packages.getAll();
      const items = response.data as PackageItem[];
      setPackages(items);

      if (!selectedId && items.length) {
        setSelectedId(items[0]._id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Алдаа гарлаа");
    }
  }, [selectedId]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    if (!selectedPackage) {
      setFormData(emptyForm);
      return;
    }

    setFormData({
      name: selectedPackage.name,
      code: selectedPackage.code,
      description: selectedPackage.description,
      price: String(selectedPackage.price),
      durationDays: String(selectedPackage.durationDays),
      features: (selectedPackage.features || []).join("\n"),
      sortOrder: String(selectedPackage.sortOrder || 0),
      isActive: selectedPackage.isActive,
    });
  }, [selectedPackage]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      price: Number(formData.price),
      durationDays: Number(formData.durationDays),
      features: formData.features
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      sortOrder: Number(formData.sortOrder),
      isActive: formData.isActive,
      currency: "MNT",
    };

    try {
      if (selectedPackage) {
        await apiService.packages.update(selectedPackage._id, payload);
        setMessage("Багц шинэчлэгдлээ");
      } else {
        await apiService.packages.create(payload);
        setMessage("Шинэ багц үүслээ");
      }

      await loadPackages();
      if (!selectedPackage) {
        setFormData(emptyForm);
      }
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
          <h1 className="text-3xl font-bold text-slate-900">Packages</h1>
          <p className="mt-2 text-slate-500">
            Subscription багц, үнэ, хугацааг super admin эндээс тохируулна.
          </p>

          {user?.role !== "superadmin" ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Энэ хэсэгт зөвхөн super admin хандана.
            </div>
          ) : null}

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

          <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Багцууд</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId("");
                    setFormData(emptyForm);
                    setMessage("");
                    setError("");
                  }}
                  className="text-sm font-medium text-blue-600"
                >
                  Шинэ багц
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {packages.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedId(item._id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left ${
                      item._id === selectedId
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                          {item.code}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          item.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      {item.price.toLocaleString()} {item.currency} /{" "}
                      {item.durationDays} хоног
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5"
            >
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedPackage ? "Багц засах" : "Шинэ багц үүсгэх"}
              </h2>

              <input
                value={formData.name}
                onChange={(event) =>
                  setFormData({ ...formData, name: event.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Package нэр"
                required
                disabled={user?.role !== "superadmin"}
              />

              <input
                value={formData.code}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    code: event.target.value.toUpperCase().replace(/\s+/g, "_"),
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Package код"
                required
                disabled={!!selectedPackage || user?.role !== "superadmin"}
              />

              <textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Тайлбар"
                disabled={user?.role !== "superadmin"}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(event) =>
                    setFormData({ ...formData, price: event.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Үнэ"
                  required
                  disabled={user?.role !== "superadmin"}
                />
                <input
                  type="number"
                  min="1"
                  value={formData.durationDays}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      durationDays: event.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Хугацаа"
                  required
                  disabled={user?.role !== "superadmin"}
                />
                <input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(event) =>
                    setFormData({ ...formData, sortOrder: event.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Дараалал"
                  disabled={user?.role !== "superadmin"}
                />
              </div>

              <textarea
                value={formData.features}
                onChange={(event) =>
                  setFormData({ ...formData, features: event.target.value })
                }
                rows={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Feature бүрийг шинэ мөрөөр бичнэ"
                disabled={user?.role !== "superadmin"}
              />

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(event) =>
                    setFormData({ ...formData, isActive: event.target.checked })
                  }
                  disabled={user?.role !== "superadmin"}
                />
                Идэвхтэй багц
              </label>

              <button
                type="submit"
                disabled={saving || user?.role !== "superadmin"}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {saving
                  ? "Хадгалж байна..."
                  : selectedPackage
                    ? "Шинэчлэх"
                    : "Үүсгэх"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

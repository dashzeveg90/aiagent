import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await register(formData);
      router.push(
        hasActiveSubscription(user.company) ? "/dashboard" : "/dashboard/billing",
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Бүртгүүлэхэд алдаа гарлаа",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
            AI
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Company бүртгүүлэх
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Company admin account болон tenant company-г нэг дор үүсгээд дараа нь
            Billing дээрээс QPay төлбөрөө хийнэ.
          </p>
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Таны нэр"
            required
          />
          <input
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Company нэр"
            required
          />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="you@company.com"
            required
          />
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Нууц үг"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-3 text-sm font-medium"
          >
            {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Бүртгэлтэй юу?{" "}
          <Link href="/login" className="text-blue-600 font-medium">
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}

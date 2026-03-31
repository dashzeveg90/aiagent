import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(email, password);
      router.push(
        hasActiveSubscription(user.company) ? "/dashboard" : "/dashboard/billing",
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Нэвтрэхэд алдаа гарлаа",
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
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Нэвтрэх</h1>
          <p className="mt-2 text-sm text-slate-500">
            Superadmin болон company admin эрхээр нэвтэрнэ.
          </p>
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="you@company.com"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Нууц үг"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-3 text-sm font-medium"
          >
            {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Company бүртгэл байхгүй юу?{" "}
          <Link href="/register" className="text-blue-600 font-medium">
            Бүртгүүлэх
          </Link>
        </p>
      </div>
    </div>
  );
}

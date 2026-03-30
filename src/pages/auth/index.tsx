import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/router";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else router.push("/dashboard");
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        await supabase.from("organizations").insert({
          name: email.split("@")[0] + "-company",
          owner_id: data.user!.id,
        });
        router.push("/dashboard");
      }
    }
    setLoading(false);
  };

  const toggle = () => {
    setError("");
    setEmail("");
    setPassword("");
    setIsLogin((v) => !v);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo mark */}

        <h1 className="text-white text-2xl font-semibold tracking-tight mb-1">
          {isLogin ? "Нэвтрэх" : "Бүртгүүлэх"}
        </h1>
        <p className="text-zinc-500 text-sm mb-8">
          {isLogin
            ? "Өөрийн бүртгэлээр нэвтэрнэ үү"
            : "Шинэ бүртгэл үүсгэнэ үү"}
        </p>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
              И-мэйл
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
              Нууц үг
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="mt-1 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {loading ? "Түр хүлээнэ үү..." : isLogin ? "Нэвтрэх" : "Бүртгүүлэх"}
          </button>
        </div>

        <p className="text-center text-sm text-zinc-600 mt-6">
          {isLogin ? "Бүртгэл байхгүй юу?" : "Бүртгэлтэй юу?"}
          <button
            onClick={toggle}
            className="ml-1.5 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            {isLogin ? "Бүртгүүлэх" : "Нэвтрэх"}
          </button>
        </p>
      </div>
    </div>
  );
}

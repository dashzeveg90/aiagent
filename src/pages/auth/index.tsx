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
        // Шинэ org үүсгэнэ
        await supabase.from("organizations").insert({
          name: email.split("@")[0] + "-company",
          owner_id: data.user!.id,
        });
        router.push("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-blue-100 p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-xl font-medium text-gray-900 mb-6">
          {isLogin ? "Нэвтрэх" : "Бүртгүүлэх"}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="И-мэйл"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
          <input
            type="password"
            placeholder="Нууц үг"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? "Түр хүлээнэ үү..." : isLogin ? "Нэвтрэх" : "Бүртгүүлэх"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          {isLogin ? "Бүртгэл байхгүй юу?" : "Бүртгэлтэй юу?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-blue-600 hover:underline"
          >
            {isLogin ? "Бүртгүүлэх" : "Нэвтрэх"}
          </button>
        </p>
      </div>
    </div>
  );
}

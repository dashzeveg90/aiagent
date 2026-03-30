import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.push(isAuthenticated ? "/dashboard" : "/login");
    }
  }, [loading, isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      Loading...
    </div>
  );
}

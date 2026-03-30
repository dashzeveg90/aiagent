import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Түр хүлээнэ үү...
      </div>
    );
  }

  return <>{children}</>;
}

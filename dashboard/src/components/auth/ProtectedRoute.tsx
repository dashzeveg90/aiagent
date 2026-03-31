import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";

export default function ProtectedRoute({
  children,
  allowExpiredSubscription = false,
}: {
  children: React.ReactNode;
  allowExpiredSubscription?: boolean;
}) {
  const router = useRouter();
  const { loading, isAuthenticated, user } = useAuth();
  const canAccessWithExpiredSubscription =
    allowExpiredSubscription || router.pathname === "/dashboard/billing";
  const needsBillingRedirect =
    !loading &&
    isAuthenticated &&
    user?.role === "company_admin" &&
    !hasActiveSubscription(user.company) &&
    !canAccessWithExpiredSubscription;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (needsBillingRedirect) {
      router.push("/dashboard/billing");
    }
  }, [needsBillingRedirect, router]);

  if (loading || !isAuthenticated || needsBillingRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Түр хүлээнэ үү...
      </div>
    );
  }

  return <>{children}</>;
}

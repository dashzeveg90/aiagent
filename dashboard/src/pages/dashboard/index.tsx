import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth";
import apiService from "@/lib/api";
import FloatingChat from "@/components/chat/FloatingChat";
import WidgetRoot from "@/components/chat/WidgetRoot";
import { toast } from "sonner";

type DashboardPayload = {
  stats: Record<string, number>;
  companies?: Array<Record<string, unknown>>;
  company?: Record<string, unknown>;
  documents?: Array<Record<string, unknown>>;
  messages?: Array<Record<string, unknown>>;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const company = (payload?.company || {}) as Record<string, unknown>;
  const currentPackage = (company.currentPackage || {}) as Record<
    string,
    unknown
  >;

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiService.dashboard.getHome();
        setPayload(response.data);
      } catch (loadError) {
        toast.error(
          loadError instanceof Error ? loadError.message : "Алдаа гарлаа",
        );
      }
    };

    load();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-100 md:flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-500">
            {user?.role === "superadmin"
              ? "Platform superadmin хянах самбар"
              : `${user?.company?.name || "Company"} admin самбар`}
          </p>
          <WidgetRoot
            slug={String(company.slug || "")}
            mode={"floating"}
            position={"right"}
          />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Object.entries(payload?.stats || {}).map(([key, value]) => (
              <div
                key={key}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">{key}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {user?.role === "superadmin" ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Company list</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {(payload?.companies || []).map((company) => (
                  <Link
                    key={String(company._id)}
                    href={`/dashboard/companies/${String(company._id)}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {String(company.name)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        /{String(company.slug)}
                      </p>
                    </div>
                    <span className="text-sm text-slate-500">
                      {String(company.status)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_380px]">
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="font-semibold text-slate-900">Documents</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {(payload?.documents || []).map((doc) => (
                    <div
                      key={String(doc._id)}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {String(doc.filename)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {String(doc.chunkCount)} chunk
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-900">Company info</h2>
                <p className="mt-4 text-sm text-slate-500">
                  Public slug: /chat/{String(company.slug || "")}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Verify token: {String(company.verifyToken || "-")}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Subscription: {String(company.subscriptionStatus || "-")}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Package: {String(currentPackage.name || "-")}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Ends at:{" "}
                  {company.subscriptionEndsAt
                    ? new Date(
                        String(company.subscriptionEndsAt),
                      ).toLocaleString()
                    : "-"}
                </p>
                <Link
                  href="/dashboard/settings"
                  className="mt-5 inline-block text-sm font-medium text-blue-600"
                >
                  Тохиргоо руу орох
                </Link>
                <Link
                  href="/dashboard/billing"
                  className="mt-3 block text-sm font-medium text-blue-600"
                >
                  Billing харах
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

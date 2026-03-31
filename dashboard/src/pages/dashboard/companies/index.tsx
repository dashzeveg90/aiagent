import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth";
import apiService from "@/lib/api";

function formatDate(value: unknown) {
  if (!value) {
    return "-";
  }

  return new Date(String(value)).toLocaleString();
}

function getStatusTone(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700";
    case "expired":
      return "bg-amber-100 text-amber-700";
    case "pending":
      return "bg-blue-100 text-blue-700";
    case "cancelled":
      return "bg-slate-200 text-slate-700";
    case "suspended":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Array<Record<string, unknown>>>(
    [],
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiService.companies.getAll();
        setCompanies(response.data);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Алдаа гарлаа",
        );
      }
    };

    if (user?.role === "superadmin") {
      load();
    }
  }, [user]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-100 md:flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Company list</h1>
          <p className="mt-2 text-slate-500">
            Зөвхөн superadmin энэ хэсгийг харна.
          </p>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_1fr_180px] gap-4 border-b border-slate-200 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Company</span>
              <span>Subscription</span>
              <span>Package / Expiry</span>
              <span>Renewal history</span>
              <span className="text-right">Status</span>
            </div>

            <div className="divide-y divide-slate-100">
              {companies.map((company) => (
                <Link
                  key={String(company._id)}
                  href={`/dashboard/companies/${String(company._id)}`}
                  className="block px-5 py-4 hover:bg-slate-50"
                >
                  <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_180px] md:items-center">
                    <div>
                      <p className="font-medium text-slate-900">
                        {String(company.name)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        /{String(company.slug)}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(
                          String(
                            (company.subscription as Record<string, unknown>)
                              ?.status ||
                              company.subscriptionStatus ||
                              "",
                          ),
                        )}`}
                      >
                        {String(
                          (company.subscription as Record<string, unknown>)
                            ?.status ||
                            company.subscriptionStatus ||
                            "-",
                        )}
                      </span>
                      <p className="mt-2 text-sm text-slate-500">
                        Last paid:{" "}
                        {formatDate(
                          (
                            company.renewalHistorySummary as Record<
                              string,
                              unknown
                            >
                          )?.lastPaidAt,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {String(
                          (company.currentPackage as Record<string, unknown>)
                            ?.name || "-",
                        )}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Ends: {formatDate(company.subscriptionEndsAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-900">
                        Paid renewals:{" "}
                        {String(
                          (
                            company.renewalHistorySummary as Record<
                              string,
                              unknown
                            >
                          )?.paidRenewals || 0,
                        )}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Last tx:{" "}
                        {String(
                          (
                            company.renewalHistorySummary as Record<
                              string,
                              unknown
                            >
                          )?.lastTransactionStatus || "-",
                        )}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Extended to:{" "}
                        {formatDate(
                          (
                            company.renewalHistorySummary as Record<
                              string,
                              unknown
                            >
                          )?.lastActivatedEndsAt,
                        )}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(
                          String(company.status || ""),
                        )}`}
                      >
                        {String(company.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

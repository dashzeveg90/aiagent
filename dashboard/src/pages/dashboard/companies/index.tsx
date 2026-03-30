import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth";
import apiService from "@/lib/api";

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiService.companies.getAll();
        setCompanies(response.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Алдаа гарлаа");
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
          <p className="mt-2 text-slate-500">Зөвхөн superadmin энэ хэсгийг харна.</p>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="divide-y divide-slate-100">
              {companies.map((company) => (
                <Link
                  key={String(company._id)}
                  href={`/dashboard/companies/${String(company._id)}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{String(company.name)}</p>
                    <p className="mt-1 text-sm text-slate-500">/{String(company.slug)}</p>
                  </div>
                  <span className="text-sm text-slate-500">{String(company.status)}</span>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import apiService from "@/lib/api";
import { toast } from "sonner";

function formatDate(value: unknown) {
  if (!value) {
    return "-";
  }

  return new Date(String(value)).toLocaleString();
}

function getTone(status: string) {
  switch (status) {
    case "paid":
    case "active":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-blue-100 text-blue-700";
    case "expired":
      return "bg-amber-100 text-amber-700";
    case "failed":
    case "cancelled":
    case "suspended":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async (companyId: string) => {
    try {
      const response = await apiService.companies.getById(companyId);
      setPayload(response.data);
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : "Алдаа гарлаа");
    }
  };

  useEffect(() => {
    if (typeof id === "string") {
      load(id);
    }
  }, [id]);

  const updateStatus = async (status: string) => {
    if (typeof id !== "string") {
      return;
    }

    setSaving(true);

    try {
      await apiService.companies.updateStatus(id, status);
      await load(id);
      toast.success("Статус шинэчлэгдлээ");
    } catch (updateError) {
      toast.error(
        updateError instanceof Error ? updateError.message : "Алдаа гарлаа",
      );
    } finally {
      setSaving(false);
    }
  };

  const company = (payload?.company || {}) as Record<string, unknown>;
  const owner = (payload?.owner || {}) as Record<string, unknown>;
  const documents = ((payload?.documents as Array<Record<string, unknown>>) || []);
  const transactions =
    ((payload?.transactions as Array<Record<string, unknown>>) || []);
  const subscription = (payload?.subscription || {}) as Record<string, unknown>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-100 md:flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Company detail</h1>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_360px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                {String(company.name || "")}
              </h2>
              <p className="mt-2 text-slate-500">/{String(company.slug || "")}</p>
              <p className="mt-4 text-sm text-slate-500">
                Owner: {String(owner.name || "")} ({String(owner.email || "")})
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Plan: {String(company.plan || "")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Subscription status: {String(subscription.status || company.subscriptionStatus || "")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Package: {String((company.currentPackage as Record<string, unknown>)?.name || "-")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Ends at:{" "}
                {company.subscriptionEndsAt
                  ? new Date(String(company.subscriptionEndsAt)).toLocaleString()
                  : "-"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Namespace: {String(company.pineconeNamespace || "")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Verify token: {String(company.verifyToken || "")}
              </p>

              <div className="mt-6">
                <h3 className="font-semibold text-slate-900">Documents</h3>
                <div className="mt-4 space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={String(doc._id)}
                      className="rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <p className="font-medium text-slate-900">
                        {String(doc.filename)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {String(doc.chunkCount)} chunk
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-slate-900">Renewal history</h3>
                <div className="mt-4 space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={String(tx._id)}
                      className="rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-900">
                          {String((tx.package as Record<string, unknown>)?.name || "Package")}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTone(
                            String(tx.status || ""),
                          )}`}
                        >
                          {String(tx.status || "")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {String(tx.amount || "")} {String(tx.currency || "")}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Invoice ID: {String(tx.invoiceId || "-")}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Paid at: {formatDate(tx.paidAt)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Renewed until: {formatDate(tx.activatedEndsAt)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Created at: {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  ))}
                  {!transactions.length ? (
                    <p className="text-sm text-slate-500">
                      Одоогоор subscription renewal/payment түүх алга байна.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 h-fit">
              <h3 className="font-semibold text-slate-900">Status</h3>
              <p className="mt-2 text-sm text-slate-500">
                Current: {String(company.status || "")}
              </p>
              <div className="mt-6 grid gap-3">
                <button
                  disabled={saving}
                  onClick={() => updateStatus("active")}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white py-3 text-sm font-medium"
                >
                  Active болгох
                </button>
                <button
                  disabled={saving}
                  onClick={() => updateStatus("suspended")}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 py-3 text-sm font-medium"
                >
                  Suspend хийх
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

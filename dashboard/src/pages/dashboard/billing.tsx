import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import apiService from "@/lib/api";
import {
  getSubscriptionLabel,
  hasActiveSubscription,
} from "@/lib/subscription";

type BillingPackage = {
  _id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
};

type BillingTransaction = {
  _id: string;
  status: string;
  amount: number;
  currency: string;
  invoiceId?: string | null;
  paymentId?: string | null;
  expiresAt?: string | null;
  paidAt?: string | null;
  qrText?: string;
  qrImage?: string;
  bankUrls?: Array<{ name?: string; description?: string; link?: string }>;
  package?: BillingPackage | null;
};

type BillingPayload = {
  company: {
    name: string;
    subscription: {
      status: string;
      isActive: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      currentPackage?: BillingPackage | null;
    };
  };
  packages: BillingPackage[];
  activeTransaction: BillingTransaction | null;
  recentTransactions: BillingTransaction[];
  qpayConfigured: boolean;
  qpayConfig?: {
    configured: boolean;
    missing: string[];
    baseUrl?: string;
    backendPublicUrl?: string;
  };
};

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

export default function BillingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [payload, setPayload] = useState<BillingPayload | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [configHint, setConfigHint] = useState<string[]>([]);

  const selectedPackage = useMemo(
    () =>
      payload?.packages.find((item) => item._id === selectedPackageId) || null,
    [payload?.packages, selectedPackageId],
  );

  const loadBilling = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const response = await apiService.billing.getCurrent();
        const nextPayload = response.data as BillingPayload;
        setPayload(nextPayload);
        setConfigHint(nextPayload.qpayConfig?.missing || []);

        if (!selectedPackageId && nextPayload.packages.length) {
          const defaultPackageId =
            nextPayload.company.subscription.currentPackage?._id ||
            nextPayload.packages[0]._id;
          setSelectedPackageId(defaultPackageId);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Алдаа гарлаа",
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedPackageId],
  );

  useEffect(() => {
    if (user?.role === "superadmin") {
      router.replace("/dashboard");
    }
  }, [router, user?.role]);

  useEffect(() => {
    loadBilling(true);
  }, [loadBilling]);

  useEffect(() => {
    if (
      !payload?.activeTransaction ||
      payload.activeTransaction.status !== "pending"
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadBilling(false);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [loadBilling, payload?.activeTransaction]);

  const createInvoice = async () => {
    if (!selectedPackageId) {
      setError("Багцаа сонгоно уу");
      return;
    }

    setPaying(true);
    setError("");
    setMessage("");

    try {
      await apiService.billing.createInvoice(selectedPackageId);
      setMessage("QPay нэхэмжлэл үүслээ. QR кодоор төлбөрөө хийнэ үү.");
      await loadBilling(false);
    } catch (invoiceError) {
      if (invoiceError instanceof ApiError) {
        const qpayConfig = (
          invoiceError.data as { qpayConfig?: { missing?: string[] } }
        )?.qpayConfig;
        if (qpayConfig?.missing?.length) {
          setConfigHint(qpayConfig.missing);
        }
      }
      setError(
        invoiceError instanceof Error ? invoiceError.message : "Алдаа гарлаа",
      );
    } finally {
      setPaying(false);
    }
  };

  const refreshTransaction = async () => {
    if (!payload?.activeTransaction?._id) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await apiService.billing.getTransaction(
        payload.activeTransaction._id,
      );
      const transaction = response.data as BillingTransaction;
      setPayload((current) =>
        current
          ? {
              ...current,
              activeTransaction: transaction,
            }
          : current,
      );

      await loadBilling(false);

      if (transaction.status === "paid") {
        await refreshUser();
        setMessage("Төлбөр амжилттай баталгаажлаа.");
      }
    } catch (refreshError) {
      setError(
        refreshError instanceof Error ? refreshError.message : "Алдаа гарлаа",
      );
    }
  };

  if (user?.role === "superadmin") {
    return (
      <ProtectedRoute allowExpiredSubscription>
        <div className="min-h-screen flex items-center justify-center text-slate-500">
          Түр хүлээнэ үү...
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowExpiredSubscription>
      <div className="min-h-screen bg-slate-100 md:flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
          <p className="mt-2 text-slate-500">
            Subscription багцаа сонгож QPay-аар monthly төлбөрөө хийнэ.
          </p>

          {!hasActiveSubscription(user?.company) ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Subscription идэвхгүй байна. Dashboard-ийн бусад хэсэг нээгдэхийн
              тулд төлбөрөө баталгаажуулна уу.
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">
              Billing мэдээлэл ачаалж байна...
            </div>
          ) : null}

          {!loading && payload ? (
            <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_420px]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Current subscription
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Status: {getSubscriptionLabel(user?.company)}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Package:{" "}
                        {payload.company.subscription.currentPackage?.name ||
                          "-"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Started at:{" "}
                        {formatDate(payload.company.subscription.startsAt)}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Ends at:{" "}
                        {formatDate(payload.company.subscription.endsAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => loadBilling(false)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Available packages
                  </h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {payload.packages.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => setSelectedPackageId(item._id)}
                        className={`rounded-2xl border p-5 text-left ${
                          selectedPackageId === item._id
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-slate-900">
                              {item.name}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                              {item.description ||
                                "Monthly subscription package"}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {item.durationDays} хоног
                          </span>
                        </div>

                        <p className="mt-5 text-2xl font-bold text-slate-900">
                          {item.price.toLocaleString()} {item.currency}
                        </p>

                        <div className="mt-4 space-y-2 text-sm text-slate-500">
                          {item.features.map((feature) => (
                            <p key={feature}>• {feature}</p>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={createInvoice}
                    disabled={
                      paying || !selectedPackage || !payload.qpayConfigured
                    }
                    className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {paying
                      ? "Нэхэмжлэл үүсгэж байна..."
                      : "QPay нэхэмжлэл үүсгэх"}
                  </button>

                  <button
                    type="button"
                    onClick={refreshTransaction}
                    disabled={!payload.activeTransaction}
                    className="mt-3 ml-3 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Төлбөр шалгах
                  </button>

                  {!payload.qpayConfigured ? (
                    <p className="mt-3 text-sm text-amber-700">
                      QPay тохиргоо дутуу байна
                      {configHint.length ? `: ${configHint.join(", ")}` : "."}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Pending payment
                  </h2>

                  {payload.activeTransaction ? (
                    <>
                      <p className="mt-3 text-sm text-slate-500">
                        Status: {payload.activeTransaction.status}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Package:{" "}
                        {payload.activeTransaction.package?.name || "-"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Amount:{" "}
                        {payload.activeTransaction.amount.toLocaleString()}{" "}
                        {payload.activeTransaction.currency}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Invoice ID: {payload.activeTransaction.invoiceId || "-"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Expires at:{" "}
                        {formatDate(payload.activeTransaction.expiresAt)}
                      </p>

                      {payload.activeTransaction.qrImage ? (
                        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          <Image
                            src={`data:image/png;base64,${payload.activeTransaction.qrImage}`}
                            alt="QPay QR"
                            className="w-full"
                            width={480}
                            height={480}
                          />
                        </div>
                      ) : null}

                      {payload.activeTransaction.bankUrls?.length ? (
                        <div className="mt-5 space-y-3">
                          {payload.activeTransaction.bankUrls.map((item) => (
                            <a
                              key={`${item.name}-${item.link}`}
                              href={item.link}
                              className="block rounded-xl border border-slate-200 px-4 py-3 text-sm text-blue-600 hover:bg-slate-50"
                            >
                              {item.name || item.description || "QPay link"}
                            </a>
                          ))}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={refreshTransaction}
                        className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Төлбөр шалгах
                      </button>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      Одоогоор идэвхтэй pending invoice алга
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Paid renewal history
                  </h2>
                  <div className="mt-4 space-y-3">
                    {payload.recentTransactions.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-xl border border-slate-200 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-900">
                            {item.package?.name || "Package"}
                          </p>
                          <span className="text-sm text-slate-500">
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {item.amount.toLocaleString()} {item.currency}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Paid at: {formatDate(item.paidAt)}
                        </p>
                      </div>
                    ))}

                    {!payload.recentTransactions.length ? (
                      <p className="text-sm text-slate-500">
                        Төлбөрийн түүх хараахан байхгүй байна.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </ProtectedRoute>
  );
}

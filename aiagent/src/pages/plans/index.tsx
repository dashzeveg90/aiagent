import { useState } from "react";
import { useRouter } from "next/router";
import { dashboardUrl } from "@/lib/config";

const plans = [
  {
    key: "free",
    name: "Free",
    price: 0,
    description: "Get started at no cost",
    features: [
      "1 workspace",
      "Up to 3 projects",
      "500MB storage",
      "Community support",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    key: "pro",
    name: "Pro",
    price: 29,
    description: "For individuals and small teams",
    features: [
      "5 workspaces",
      "Unlimited projects",
      "20GB storage",
      "Priority email support",
      "Advanced analytics",
      "API access",
    ],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    key: "business",
    name: "Business",
    price: 79,
    description: "For growing teams and organizations",
    features: [
      "Unlimited workspaces",
      "Unlimited projects",
      "200GB storage",
      "Dedicated support",
      "Advanced analytics",
      "API access",
      "SSO & SAML",
      "Audit logs",
    ],
    cta: "Start Business",
    highlighted: false,
  },
];

export default function Plans() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSelect = async (planKey: string) => {
    setSelected(planKey);
    setLoading(true);
    router.push(`${dashboardUrl}/register?plan=${planKey}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            Үнийн төлөвлөгөө
          </div>
          <h1 className="text-white text-3xl font-semibold tracking-tight mb-3">
            Өөрт тохирох төлөвлөгөөгөө сонгоно уу
          </h1>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            Хүссэн үедээ сайжруулах эсвэл цуцлах боломжтой.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-xl border p-6 flex flex-col ${
                plan.highlighted
                  ? "bg-indigo-600/10 border-indigo-500/40"
                  : "bg-zinc-900 border-zinc-800"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-medium">
                    Popular
                  </span>
                </div>
              )}

              {/* Plan name & price */}
              <div className="mb-5">
                <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest mb-2">
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-white text-3xl font-semibold">
                    ${plan.price}
                  </span>
                  <span className="text-zinc-500 text-sm mb-1">/сар</span>
                </div>
                <p className="text-zinc-500 text-sm">{plan.description}</p>
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-800 mb-5" />

              {/* Features */}
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-sm text-zinc-300"
                  >
                    <svg
                      className="w-4 h-4 text-indigo-400 shrink-0"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleSelect(plan.key)}
                disabled={loading && selected === plan.key}
                className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.highlighted
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                }`}
              >
                {loading && selected === plan.key && (
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
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-zinc-600 text-xs mt-10">
          Асуулт байна уу?{" "}
          <a
            href="mailto:support@example.com"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Бидэнтэй холбогдоно уу
          </a>
        </p>
      </div>
    </div>
  );
}

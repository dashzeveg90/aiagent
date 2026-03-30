import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth";

export default function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const navigation =
    user?.role === "superadmin"
      ? [
          { name: "Хянах самбар", href: "/dashboard" },
          { name: "Company list", href: "/dashboard/companies" },
        ]
      : [
          { name: "Хянах самбар", href: "/dashboard" },
          { name: "Тохиргоо", href: "/dashboard/settings" },
        ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-screen bg-gray-950 border-r border-gray-800">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              AI
            </div>
            <div className="ml-3">
              <h1 className="text-white font-semibold">BotFlow</h1>
              <p className="text-xs text-gray-400">Dashboard</p>
            </div>
          </div>

          <div className="flex-shrink-0 border-b border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "Хэрэглэгч"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.role === "superadmin" ? "Superadmin" : user?.company?.name}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive =
                router.pathname === item.href ||
                (item.href !== "/dashboard" && router.pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex-shrink-0 border-t border-gray-800 p-4">
            <button
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
            >
              Гарах
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

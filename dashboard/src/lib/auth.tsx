import { createContext, useContext, useEffect, useState } from "react";
import apiService from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "company_admin";
  isActive?: boolean;
  company?: {
    _id?: string;
    id?: string;
    name: string;
    slug: string;
    status: string;
  } | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: Record<string, unknown>) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.auth.getMe();
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiService.auth.login({ email, password });
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (payload: Record<string, unknown>) => {
    const response = await apiService.auth.register(payload);
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async () => {
    try {
      await apiService.auth.logout();
    } catch {
      // Ignore logout API failures and clear local auth anyway.
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

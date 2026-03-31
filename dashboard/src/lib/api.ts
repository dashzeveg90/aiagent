const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: unknown;

  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

async function request(path: string, init?: RequestInit) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.message || "Алдаа гарлаа",
      response.status,
      payload?.code,
      payload?.data,
    );
  }

  return payload;
}

const apiService = {
  auth: {
    register: (data: Record<string, unknown>) =>
      request("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (data: Record<string, unknown>) =>
      request("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    logout: () =>
      request("/auth/logout", {
        method: "POST",
      }),
    getMe: () => request("/auth/me"),
    updateProfile: (data: Record<string, unknown>) =>
      request("/auth/update-profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  dashboard: {
    getHome: () => request("/dashboard"),
  },
  companies: {
    getAll: () => request("/companies"),
    getById: (id: string) => request(`/companies/${id}`),
    updateStatus: (id: string, status: string) =>
      request(`/companies/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
  packages: {
    getAll: () => request("/packages"),
    create: (data: Record<string, unknown>) =>
      request("/packages", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/packages/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  billing: {
    getCurrent: () => request("/billing/current"),
    createInvoice: (packageId: string) =>
      request("/billing/invoices", {
        method: "POST",
        body: JSON.stringify({ packageId }),
      }),
    getTransaction: (id: string) => request(`/billing/transactions/${id}`),
  },
  company: {
    getCurrent: () => request("/company/current"),
    updateCurrent: (data: Record<string, unknown>) =>
      request("/company/current", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    uploadDocument: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return request("/company/current/documents", {
        method: "POST",
        body: formData,
      });
    },
    deleteDocument: (id: string) =>
      request(`/company/current/documents/${id}`, {
        method: "DELETE",
      }),
  },
};

export default apiService;

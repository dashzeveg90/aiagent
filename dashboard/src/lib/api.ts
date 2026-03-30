const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";

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
    throw new Error(payload?.message || "Алдаа гарлаа");
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

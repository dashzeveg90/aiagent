function normalizeBaseUrl(value) {
  const raw = String(value || "").trim().replace(/\/+$/, "");
  if (!raw) {
    return "";
  }

  return raw.endsWith("/v2") ? raw.slice(0, -3) : raw;
}

function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

const QPAY_BASE_URL = normalizeBaseUrl(
  readEnv("QPAY_BASE_URL") || "https://merchant-sandbox.qpay.mn",
);

let cachedToken = {
  accessToken: null,
  expiresAt: 0,
};

function getRequiredEnv(name) {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`${name} тохируулагдаагүй байна`);
  }

  return value;
}

function buildBasicAuthHeader() {
  const username = readEnv("QPAY_USERNAME", "QPAY_CLIENT_ID");
  const password = readEnv("QPAY_PASSWORD", "QPAY_CLIENT_SECRET");
  if (!username) {
    throw new Error("QPAY_USERNAME тохируулагдаагүй байна");
  }
  if (!password) {
    throw new Error("QPAY_PASSWORD тохируулагдаагүй байна");
  }
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function getBackendPublicUrl() {
  return (
    readEnv("BACKEND_PUBLIC_URL") ||
    `http://localhost:${process.env.PORT || 5005}`
  );
}

function getConfigStatus() {
  const missing = [];

  if (!readEnv("QPAY_USERNAME", "QPAY_CLIENT_ID")) {
    missing.push("QPAY_USERNAME");
  }

  if (!readEnv("QPAY_PASSWORD", "QPAY_CLIENT_SECRET")) {
    missing.push("QPAY_PASSWORD");
  }

  if (!readEnv("QPAY_INVOICE_CODE")) {
    missing.push("QPAY_INVOICE_CODE");
  }

  return {
    configured: missing.length === 0,
    missing,
    baseUrl: QPAY_BASE_URL,
    backendPublicUrl: getBackendPublicUrl(),
  };
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      payload?.msg ||
      `QPay API алдаа (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

async function getAccessToken() {
  if (cachedToken.accessToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.accessToken;
  }

  const response = await fetch(`${QPAY_BASE_URL}/v2/auth/token`, {
    method: "POST",
    headers: {
      Authorization: buildBasicAuthHeader(),
      Accept: "application/json",
    },
  });

  const payload = await parseResponse(response);
  const accessToken =
    payload?.access_token || payload?.accessToken || payload?.token;

  if (!accessToken) {
    throw new Error("QPay access token ирсэнгүй");
  }

  const expiresInSeconds = Number(payload?.expires_in || payload?.expiresIn || 300);
  cachedToken = {
    accessToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };

  return accessToken;
}

async function authorizedRequest(path, init) {
  const token = await getAccessToken();
  const response = await fetch(`${QPAY_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  return parseResponse(response);
}

function isConfigured() {
  return getConfigStatus().configured;
}

function getInvoiceCode() {
  return getRequiredEnv("QPAY_INVOICE_CODE");
}

function getCallbackToken() {
  return process.env.QPAY_CALLBACK_TOKEN || "";
}

async function createInvoice(payload) {
  return authorizedRequest("/v2/invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function getInvoice(invoiceId) {
  return authorizedRequest(`/v2/invoice/${invoiceId}`, {
    method: "GET",
  });
}

async function checkInvoicePayment(invoiceId) {
  return authorizedRequest("/v2/payment/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: {
        page_number: 1,
        page_limit: 100,
      },
    }),
  });
}

module.exports = {
  QPAY_BASE_URL,
  checkInvoicePayment,
  createInvoice,
  getBackendPublicUrl,
  getCallbackToken,
  getConfigStatus,
  getInvoice,
  getInvoiceCode,
  isConfigured,
};

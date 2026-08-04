import { getShiprocketConfig } from "./settingsCache.js";

const BASE = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = "";
let tokenExpires = 0;

async function login() {
  const cfg = await getShiprocketConfig();
  if (cfg.token) {
    cachedToken = cfg.token;
    tokenExpires = Date.now() + 8 * 24 * 60 * 60 * 1000;
    return cachedToken;
  }
  if (!cfg.email || !cfg.password) {
    throw new Error("Shiprocket credentials not configured");
  }
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: cfg.email, password: cfg.password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    throw new Error(data.message || "Shiprocket login failed");
  }
  cachedToken = data.token;
  tokenExpires = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

async function authHeaders() {
  if (!cachedToken || Date.now() > tokenExpires) {
    await login();
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${cachedToken}`,
  };
}

export async function trackByAwb(awb) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/courier/track/awb/${encodeURIComponent(awb)}`, {
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Shiprocket tracking failed");
  }
  return data;
}

export async function createShipment(payload) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/orders/create/adhoc`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || "Shiprocket create order failed");
  }
  return data;
}

export async function shiprocketConfigured() {
  const cfg = await getShiprocketConfig();
  return !!(cfg.enabled && (cfg.token || (cfg.email && cfg.password)));
}

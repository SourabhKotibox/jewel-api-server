import Setting from "../models/Setting.js";

export async function getSettingValue(key, fallback = null) {
  try {
    const doc = await Setting.findOne({ key });
    return doc?.value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getPaymentsConfig() {
  const fromDb = await getSettingValue("payments");
  if (fromDb && typeof fromDb === "object") return fromDb;
  return {
    razorpay: {
      enabled: true,
      keyId: process.env.RAZORPAY_KEY_ID || "",
      keySecret: process.env.RAZORPAY_KEY_SECRET || "",
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
      testMode: true,
    },
    cashOnDelivery: { enabled: true },
  };
}

export async function getShiprocketConfig() {
  const fromDb = await getSettingValue("shiprocket");
  if (fromDb && typeof fromDb === "object") return fromDb;
  return {
    email: process.env.SHIPROCKET_EMAIL || "",
    password: process.env.SHIPROCKET_PASSWORD || "",
    token: process.env.SHIPROCKET_TOKEN || "",
    enabled: !!(process.env.SHIPROCKET_EMAIL || process.env.SHIPROCKET_TOKEN),
  };
}

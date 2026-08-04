/**
 * Strip secrets from settings for public / storefront consumption.
 */
function scrubPayments(payments = {}) {
  const next = { ...payments };
  if (next.razorpay) {
    const { keySecret, webhookSecret, ...safe } = next.razorpay;
    next.razorpay = {
      ...safe,
      keyId: safe.keyId || "",
      enabled: safe.enabled !== false,
      hasSecret: !!(keySecret || process.env.RAZORPAY_KEY_SECRET),
    };
  }
  if (next.bankTransfer) {
    const { accountNumber, ...safe } = next.bankTransfer;
    next.bankTransfer = {
      ...safe,
      accountNumber: accountNumber ? `****${String(accountNumber).slice(-4)}` : "",
    };
  }
  return next;
}

function scrubMail(mail = {}) {
  const { password, ...safe } = mail;
  return { ...safe, password: password ? "********" : "" };
}

function scrubShiprocket(sr = {}) {
  const { password, token, ...safe } = sr;
  return {
    ...safe,
    password: password ? "********" : "",
    token: token ? "********" : "",
    hasCredentials: !!(password || token || process.env.SHIPROCKET_TOKEN),
  };
}

export function sanitizeSettingsForPublic(map = {}) {
  const out = { ...map };
  if (out.payments) out.payments = scrubPayments(out.payments);
  if (out.mail) out.mail = scrubMail(out.mail);
  if (out.shiprocket) out.shiprocket = scrubShiprocket(out.shiprocket);
  if (out.shipping?.shiprocket) {
    out.shipping = {
      ...out.shipping,
      shiprocket: scrubShiprocket(out.shipping.shiprocket),
    };
  }
  return out;
}

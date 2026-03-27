const LOG_ENDPOINT = "/api/log-error";
const MAX_EVENTS_PER_SESSION = 25;
const DEDUPE_WINDOW_MS = 30_000;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_STACK_LENGTH = 4000;
const MAX_META_KEYS = 20;

const ALLOWED_META_KEYS = new Set([
  "component",
  "action",
  "page",
  "section",
  "status",
  "flow",
  "sdk",
  "sdkStep",
  "errorCode",
]);

const SENSITIVE_KEY_PARTS = [
  "mobile",
  "phone",
  "fullname",
  "card",
  "cvd",
  "cvv",
  "number",
  "expiry",
  "dob",
  "address",
  "token",
  "password",
  "authorization",
  "cookie",
  "secret",
  "key",
];

let installed = false;
let sentCount = 0;
const fingerprintLastSeen = new Map();

function trimString(value, max = MAX_MESSAGE_LENGTH) {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

function sanitizeEmail(value) {
  if (typeof value !== "string") return undefined;
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return undefined;
  return email.slice(0, 254);
}

function isSensitiveKey(key) {
  const lower = key.toLowerCase();
  if (lower === "email") return false;
  return SENSITIVE_KEY_PARTS.some((token) => lower.includes(token));
}

function sanitizeMeta(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return undefined;
  const out = {};
  let count = 0;

  for (const [key, value] of Object.entries(input)) {
    if (count >= MAX_META_KEYS) break;
    if (!ALLOWED_META_KEYS.has(key)) continue;
    if (isSensitiveKey(key)) continue;
    if (typeof value === "string") {
      out[key] = trimString(value);
      count += 1;
    } else if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
      count += 1;
    }
  }

  return Object.keys(out).length ? out : undefined;
}

function normalizeError(errorLike) {
  if (errorLike instanceof Error) {
    return {
      message: trimString(errorLike.message || "unknown error"),
      name: trimString(errorLike.name || "Error", 80),
      stack: trimString(errorLike.stack || "", MAX_STACK_LENGTH),
    };
  }

  return {
    message: trimString(String(errorLike || "unknown error")),
    name: "NonError",
    stack: "",
  };
}

function toFingerprint(payload) {
  return `${payload.kind}|${payload.name}|${payload.message}|${payload.url || ""}`;
}

function isDuplicateWithinWindow(payload) {
  const fingerprint = toFingerprint(payload);
  const now = Date.now();
  const prev = fingerprintLastSeen.get(fingerprint);
  if (prev && now - prev < DEDUPE_WINDOW_MS) return true;
  fingerprintLastSeen.set(fingerprint, now);
  return false;
}

function buildPayload(errorLike, context = {}) {
  const normalized = normalizeError(errorLike);
  const email = sanitizeEmail(context.email);

  const payload = {
    kind: trimString(String(context.kind || "manual"), 60),
    message: normalized.message,
    name: normalized.name,
    stack: normalized.stack,
    url: trimString(window.location.href.split("?")[0]),
    route: trimString(window.location.pathname, 300),
    timestamp: new Date().toISOString(),
    userAgent: trimString(navigator.userAgent, 300),
    build: trimString(import.meta.env.MODE || "unknown", 40),
    meta: sanitizeMeta(context.meta),
  };

  if (email) payload.email = email;
  return payload;
}

async function sendPayload(payload) {
  const body = JSON.stringify(payload);
  const hasBeacon =
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function";
  if (hasBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    const sent = navigator.sendBeacon(LOG_ENDPOINT, blob);
    if (sent) return;
  }

  await fetch(LOG_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  });
}

export async function reportClientError(errorLike, context = {}) {
  try {
    if (sentCount >= MAX_EVENTS_PER_SESSION) return;
    const payload = buildPayload(errorLike, context);
    if (isDuplicateWithinWindow(payload)) return;
    sentCount += 1;
    await sendPayload(payload);
  } catch {
    // Never throw from telemetry path.
  }
}

export function installGlobalErrorHandlers() {
  if (installed) return;
  installed = true;

  window.addEventListener("error", (event) => {
    reportClientError(event?.error || event?.message || "window error", {
      kind: "window_error",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportClientError(event?.reason || "unhandled promise rejection", {
      kind: "unhandled_rejection",
    });
  });
}

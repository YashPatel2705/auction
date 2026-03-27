const MAX_BODY_BYTES = 16 * 1024;
const MAX_STRING_LENGTH = 1000;
const MAX_STACK_LENGTH = 4000;
const MAX_META_KEYS = 20;

const ALLOWED_ROOT_KEYS = new Set([
  "email",
  "message",
  "stack",
  "name",
  "url",
  "route",
  "build",
  "userAgent",
  "kind",
  "timestamp",
  "meta",
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
  "registrationId",
  "supabaseOp",
  "httpStatus",
]);

function trimString(value, max = MAX_STRING_LENGTH) {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

function sanitizeEmail(value) {
  if (typeof value !== "string") return undefined;
  const email = value.trim().toLowerCase();
  if (!email) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return undefined;
  return trimString(email, 254);
}

function sanitizeUrl(value) {
  if (typeof value !== "string" || !value) return undefined;

  try {
    const parsed = new URL(value);
    parsed.search = "";
    parsed.hash = "";
    return trimString(parsed.toString(), MAX_STRING_LENGTH);
  } catch {
    return trimString(value.split("?")[0], MAX_STRING_LENGTH);
  }
}

function isSensitiveKey(key) {
  const lower = key.toLowerCase();
  if (lower === "email") return false;
  return SENSITIVE_KEY_PARTS.some((token) => lower.includes(token));
}

function sanitizeMeta(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const out = {};
  let count = 0;

  for (const [key, raw] of Object.entries(value)) {
    if (count >= MAX_META_KEYS) break;
    if (!ALLOWED_META_KEYS.has(key)) continue;
    if (isSensitiveKey(key)) continue;

    if (typeof raw === "string") {
      out[key] = trimString(raw);
      count += 1;
      continue;
    }

    if (typeof raw === "number" || typeof raw === "boolean") {
      out[key] = raw;
      count += 1;
      continue;
    }
  }

  return Object.keys(out).length ? out : undefined;
}

function sanitizePayload(input) {
  const safe = {};
  const body = input && typeof input === "object" ? input : {};

  for (const key of ALLOWED_ROOT_KEYS) {
    if (!(key in body)) continue;
    if (isSensitiveKey(key)) continue;

    const raw = body[key];
    switch (key) {
      case "email":
        safe.email = sanitizeEmail(raw);
        break;
      case "url":
        safe.url = sanitizeUrl(raw);
        break;
      case "timestamp":
        safe.timestamp = trimString(String(raw), 80);
        break;
      case "stack":
        safe.stack = trimString(typeof raw === "string" ? raw : "", MAX_STACK_LENGTH);
        break;
      case "meta":
        safe.meta = sanitizeMeta(raw);
        break;
      default:
        safe[key] = trimString(String(raw));
        break;
    }
  }

  if (!safe.kind) safe.kind = "unknown";
  if (!safe.message) safe.message = "unknown error";
  if (!safe.timestamp) safe.timestamp = new Date().toISOString();

  if (!safe.url && typeof body?.route === "string") safe.url = sanitizeUrl(body.route);

  return safe;
}

function getRawBodyLength(req) {
  const rawLen = Number(req.headers["content-length"]);
  if (!Number.isFinite(rawLen) || rawLen < 0) return 0;
  return rawLen;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  if (getRawBodyLength(req) > MAX_BODY_BYTES) {
    return res.status(413).json({ ok: false, error: "payload_too_large" });
  }

  try {
    const payload = sanitizePayload(req.body);
    console.error("client_error", payload);
    return res.status(200).json({ ok: true });
  } catch {
    // Preserve 200 to avoid client retry storms.
    return res.status(200).json({ ok: true });
  }
}

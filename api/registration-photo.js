import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

/** Keys needed by this handler; merged from .env then .env.local (local wins). */
const SUPABASE_ENV_KEYS = [
  "SUPABASE_URL",
  "VITE_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function parseDotenvContents(contents) {
  const out = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * `vercel dev` does not always inject vars from gitignored `.env` / `.env.local`
 * into the serverless runtime. Read them from the project root when missing.
 */
function hydrateSupabaseEnvFromFiles() {
  const cwd = process.cwd();
  let merged = {};
  for (const name of [".env", ".env.local"]) {
    const filePath = path.join(cwd, name);
    try {
      if (!fs.existsSync(filePath)) continue;
      merged = { ...merged, ...parseDotenvContents(fs.readFileSync(filePath, "utf8")) };
    } catch {
      // ignore missing / unreadable files
    }
  }
  for (const key of SUPABASE_ENV_KEYS) {
    const v = merged[key];
    if (v && !process.env[key]) process.env[key] = v;
  }
}

hydrateSupabaseEnvFromFiles();

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function mimeFromPath(path) {
  const dot = path.lastIndexOf(".");
  const ext = dot >= 0 ? path.slice(dot + 1).toLowerCase() : "";
  if (ext === "webp") return "image/webp";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  return "";
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase admin env vars.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isProdEnv() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function validatePath(rid, path) {
  if (typeof path !== "string") return false;
  const parts = path.split("/").filter(Boolean);
  if (parts.length !== 2 || parts[0] !== "registration") return false;
  const file = parts[1];
  const dot = file.lastIndexOf(".");
  if (dot <= 0) return false;
  const base = file.slice(0, dot);
  const ext = file.slice(dot + 1).toLowerCase();
  if (base.toLowerCase() !== rid.toLowerCase()) return false;
  return ["webp", "jpg", "jpeg", "png"].includes(ext);
}

function devLog(...args) {
  if (process.env.VERCEL_ENV === "production") return;
  console.log("[registration-photo]", ...args);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const rid = String(req.body?.rid || "").trim();
  const path = String(req.body?.path || "").trim();
  devLog("POST", { path });
  if (!isUuid(rid)) {
    return res.status(400).json({ ok: false, error: "invalid_rid" });
  }
  if (!validatePath(rid, path)) {
    return res.status(400).json({ ok: false, error: "invalid_photo_path" });
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    devLog("missing env", {
      hasUrl: Boolean(url),
      hasServiceRole: Boolean(serviceRoleKey),
    });
    const missingUrl = !url;
    const body = {
      ok: false,
      error: missingUrl ? "missing_supabase_url" : "missing_supabase_service_role",
      ...(isProdEnv()
        ? {}
        : {
            hint: missingUrl
              ? "Add SUPABASE_URL to .env.local (same as VITE_SUPABASE_URL). VITE_* is not always available to /api on vercel dev."
              : "Set SUPABASE_SERVICE_ROLE_KEY in .env.local (or Vercel env). If it is set, this build hydrates from .env/.env.local when vercel dev omits gitignored files.",
          }),
    };
    return res.status(503).json(body);
  }

  try {
    const supabase = getSupabaseAdmin();
    // Use Storage API — querying `storage.objects` via PostgREST can hang or fail
    // when that schema/table is not exposed the same way to the REST layer.
    devLog("storage.download start");
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("player-photos")
      .download(path);

    if (downloadError || !fileBlob) {
      devLog("storage.download miss", downloadError?.message || downloadError);
      return res.status(404).json({ ok: false, error: "photo_not_found" });
    }

    devLog("storage.download ok");
    const size =
      typeof fileBlob.size === "number" ? fileBlob.size : Number(fileBlob.size) || 0;
    const mimeFromBlob = String(fileBlob.type || "").toLowerCase();
    const mimeType = mimeFromBlob || mimeFromPath(path);
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({ ok: false, error: "photo_mime_not_allowed" });
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_OUTPUT_BYTES) {
      return res.status(400).json({ ok: false, error: "photo_size_limit_exceeded" });
    }

    const { data: urlData } = supabase.storage.from("player-photos").getPublicUrl(path);
    const publicUrl = urlData?.publicUrl || null;
    if (!publicUrl) {
      return res.status(500).json({ ok: false, error: "photo_url_missing" });
    }

    devLog("registrations.update start");
    const { data: updatedRows, error: updateError } = await supabase
      .from("registrations")
      .update({ photo_url: publicUrl })
      .eq("unique_id", rid)
      .select("unique_id");

    if (updateError) {
      devLog("registrations.update fail", updateError.message);
      return res.status(500).json({ ok: false, error: "registration_update_failed" });
    }
    const n = updatedRows?.length ?? 0;
    if (n === 0) {
      devLog("registrations.update no matching row", { rid });
      return res.status(404).json({ ok: false, error: "registration_not_found" });
    }
    if (n > 1) {
      devLog("registrations.update unexpected row count", { n, rid });
      return res.status(500).json({ ok: false, error: "registration_update_ambiguous" });
    }

    devLog("done");
    return res.status(200).json({ ok: true, photoUrl: publicUrl });
  } catch (e) {
    devLog("exception", e?.message || e);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}


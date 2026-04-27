import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { reportClientError } from "../lib/errorLogger";
import {
  compressImageToTarget,
  MAX_INPUT_BYTES,
} from "../lib/imageCompression";
import { supabase } from "../lib/supabase";
import "../styles/pay-registration.css";

function toMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function extensionForMime(mimeType) {
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  return "bin";
}

async function finalizePhotoUpdate({ rid, path }) {
  const response = await fetch("/api/registration-photo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ rid, path }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok) {
    const code = data?.error;
    const msg =
      code === "registration_not_found"
        ? "Registration not found for this link."
        : code || "Failed to finalize photo update.";
    throw new Error(msg);
  }
  return data.photoUrl;
}

export default function PhotoUploadPage() {
  const [searchParams] = useSearchParams();
  const rid = (searchParams.get("rid") || "").trim();

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [wantsUpdate, setWantsUpdate] = useState(true);
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);
  const [sourceFileName, setSourceFileName] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const prev = document.title;
    document.title = "Photo Upload || HPBCT 2026";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    if (!rid) {
      reportClientError(new Error("Missing rid query param"), {
        kind: "photo_upload_error",
        meta: {
          component: "PhotoUploadPage",
          action: "load_registration",
          page: "photo-upload",
          section: "bootstrap",
          status: "failed",
          flow: "photo_upload_link",
          sdk: "router",
          sdkStep: "read_rid",
          errorCode: "PHOTO_RID_MISSING",
        },
      });
      setError("Invalid photo link. Missing registration id.");
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error: fetchError } = await supabase
        .from("registrations")
        .select("unique_id, full_name, mobile, email, photo_url")
        .eq("unique_id", rid)
        .single();

      if (fetchError || !data) {
        reportClientError(fetchError || new Error("Registration not found"), {
          kind: "photo_upload_error",
          meta: {
            component: "PhotoUploadPage",
            action: "load_registration",
            page: "photo-upload",
            section: "bootstrap",
            status: "failed",
            flow: "photo_upload_link",
            sdk: "supabase",
            sdkStep: "fetch_registration",
            errorCode: "PHOTO_REG_NOT_FOUND",
            rid,
            supabaseOp: "select_registration",
          },
        });
        setError("Registration not found for this link.");
        setLoading(false);
        return;
      }

      setRegistration(data);
      setWantsUpdate(!data.photo_url);
      setLoading(false);
    })();
  }, [rid]);

  const currentPhotoUrl = useMemo(() => {
    const rawPhotoUrl = String(registration?.photo_url || "").trim();
    if (!rawPhotoUrl) return "";

    let normalizedPublicUrl = rawPhotoUrl;
    if (!/^https?:\/\//i.test(rawPhotoUrl)) {
      const storagePath = rawPhotoUrl.replace(/^\/+/, "");
      const { data } = supabase.storage
        .from("player-photos")
        .getPublicUrl(storagePath);
      normalizedPublicUrl = data?.publicUrl || "";
    }
    if (!normalizedPublicUrl) return "";

    const cacheBust = `v=${Date.now()}`;
    return normalizedPublicUrl.includes("?")
      ? `${normalizedPublicUrl}&${cacheBust}`
      : `${normalizedPublicUrl}?${cacheBust}`;
  }, [registration?.photo_url]);

  const onFileChosen = (event) => {
    const rawFile = event.target.files?.[0];
    setError("");
    setSuccess("");

    if (!rawFile) {
      setPendingFile(null);
      setSourceFileName("");
      return;
    }

    if (!rawFile.type || !rawFile.type.startsWith("image/")) {
      setError("Unsupported file type. Use an image file.");
      setPendingFile(null);
      setSourceFileName("");
      event.target.value = "";
      return;
    }

    if (rawFile.size > MAX_INPUT_BYTES) {
      setError("Image too large. Max source size is 10MB.");
      setPendingFile(null);
      setSourceFileName("");
      event.target.value = "";
      return;
    }

    setPendingFile(rawFile);
    setSourceFileName(rawFile.name);
  };

  const onUploadClick = async () => {
    const rawFile = pendingFile;
    if (!rawFile || !registration?.unique_id) return;

    setError("");
    setSuccess("");
    setPreviewError(false);

    setBusy(true);
    setProcessingStep("compress_image");
    const photoErrorCodeByStep = {
      compress_image: "PHOTO_COMPRESS_FAILED",
      upload_photo: "PHOTO_UPLOAD_FAILED",
      finalize_photo: "PHOTO_FINALIZE_FAILED",
    };
    let submitStep = "compress_image";
    let uploadedPath = "";
    try {
      const compressed = await compressImageToTarget(rawFile);
      const ext = extensionForMime(compressed.mimeType);
      uploadedPath = `registration/${registration.unique_id}.${ext}`;
      setProcessingStep("upload_photo");
      submitStep = "upload_photo";

      const { error: uploadError } = await supabase.storage
        .from("player-photos")
        .upload(uploadedPath, compressed.file, {
          upsert: true,
          contentType: compressed.mimeType,
          cacheControl: "3600",
        });

      if (uploadError) throw new Error(uploadError.message);

      setProcessingStep("finalize_photo");
      submitStep = "finalize_photo";
      const finalizedPhotoUrl = await finalizePhotoUpdate({
        rid: registration.unique_id,
        path: uploadedPath,
      });

      setRegistration((prev) => ({ ...prev, photo_url: finalizedPhotoUrl }));
      setWantsUpdate(false);
      setPreviewError(false);
      setPendingFile(null);
      setSourceFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccess("Photo uploaded successfully.");
    } catch (uploadErr) {
      reportClientError(uploadErr, {
        kind: "photo_upload_error",
        email: registration?.email,
        meta: {
          component: "PhotoUploadPage",
          action: "submit",
          page: "photo-upload",
          section: "upload",
          status: "failed",
          flow: "photo_upload_link",
          sdk: submitStep === "finalize_photo" ? "vercel-function" : "supabase",
          sdkStep: submitStep,
          errorCode: photoErrorCodeByStep[submitStep] || "PHOTO_UPLOAD_UNKNOWN",
          rid: registration?.unique_id,
          supabaseOp:
            submitStep === "upload_photo" ? "upload_player_photo" : "none",
        },
      });
      setError(uploadErr?.message || "Failed to upload photo.");
    } finally {
      setBusy(false);
      setProcessingStep("");
    }
  };

  if (loading) {
    return (
      <div className="pr-page-outer pr-page-outer--loading">
        <div className="pr-loading-overlay" aria-live="polite">
          <div className="pr-spinner" aria-hidden="true" />
          <span className="pr-loading-text">Loading...</span>
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="pr-page-outer">
        <div className="pr-card pr-card--pay">
          <h1 className="teko pr-title">Photo upload</h1>
          <output className="pr-error" role="alert" aria-live="assertive">
            ❌ {error || "Registration not found for this link."}
          </output>
        </div>
      </div>
    );
  }

  return (
    <div className="pr-page-outer">
      {busy && (
        <div className="pr-loading-overlay" aria-live="polite">
          <div className="pr-spinner" aria-hidden="true" />
          <span className="pr-loading-text">
            {processingStep === "compress_image"
              ? "Compressing image..."
              : processingStep === "upload_photo"
                ? "Uploading photo..."
                : "Finalizing..."}
          </span>
        </div>
      )}
      <div className="pr-card pr-card--pay">
        <h1 className="teko pr-title">Photo upload</h1>

        <div className="pr-row-2-summary">
          <div>
            <span className="pr-field-label">Name</span>
            <div className="pr-value">{registration?.full_name || "-"}</div>
          </div>
          <div>
            <span className="pr-field-label">Mobile</span>
            <div className="pr-value">{registration?.mobile || "-"}</div>
          </div>
          <div className="pr-span-2">
            <span className="pr-field-label">Email</span>
            <div className="pr-value">{registration?.email || "-"}</div>
          </div>
        </div>

        {registration?.photo_url && (
          <div className="pr-photo-preview-wrap">
            <div className="pr-field-label">Current photo</div>
            {!previewError && currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt="Current uploaded player portrait"
                className="pr-photo-preview"
                onError={() => {
                  setPreviewError(true);
                  reportClientError(new Error("Photo preview failed to load"), {
                    kind: "photo_upload_error",
                    email: registration?.email,
                    meta: {
                      component: "PhotoUploadPage",
                      action: "preview",
                      page: "photo-upload",
                      section: "preview",
                      status: "failed",
                      flow: "photo_upload_link",
                      sdk: "browser",
                      sdkStep: "render_image",
                      errorCode: "PHOTO_PREVIEW_LOAD_FAILED",
                      rid: registration?.unique_id,
                    },
                  });
                }}
              />
            ) : (
              <div className="pr-help-text">
                Current image preview unavailable. You can still upload/update.
              </div>
            )}
            {/* {!wantsUpdate && (
              <div className="pr-submit-wrap">
                <button
                  type="button"
                  className="pr-outline-btn full"
                  onClick={() => {
                    setSuccess("");
                    setError("");
                    setPreviewError(false);
                    setPendingFile(null);
                    setSourceFileName("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    setWantsUpdate(true);
                  }}
                  disabled={busy}
                >
                  Update photo
                </button>
              </div>
            )} */}
          </div>
        )}

        {wantsUpdate && (
          <div className="pr-row-2-form">
            <label className="pr-field pr-span-2">
              <span className="pr-field-label">Choose photo</span>
              <input
                ref={fileInputRef}
                className="pr-input"
                type="file"
                name="photo"
                accept="image/png,image/jpeg,image/webp,image/*"
                onChange={onFileChosen}
                disabled={busy}
              />
              <div className="pr-help-text">
                Up to 10MB.
                {sourceFileName ? (
                  <span> Selected: {sourceFileName}</span>
                ) : null}
              </div>
            </label>
            <div className="pr-submit-wrap pr-span-2">
              <button
                type="button"
                className="pr-primary-btn full"
                onClick={onUploadClick}
                disabled={busy || !pendingFile}
              >
                {busy ? "Working..." : "Upload"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <output className="pr-error" role="alert" aria-live="assertive">
            ❌ {error}
          </output>
        )}
        {success && (
          <output className="pr-success" aria-live="polite">
            ✅ {success}
          </output>
        )}
      </div>
    </div>
  );
}

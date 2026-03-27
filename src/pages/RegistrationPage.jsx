import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  parseRegistrationForm,
  toRegistrationInsertPayload,
  toYdsRegistrationSubmissionData,
} from "../lib/formSubmit";
import { YdsPaymentSdk } from "yds-payment-sdk";
import "./pay-registration.css";

const initialForm = {
  fullName: "",
  mobileNumber: "",
  email: "",
  dob: "",
  battingRating: 5,
  bowlingRating: 5,
  tshirtSize: "",
  role: "batsman",
  participatedIn2025: "no",
  referenceName: "",
};

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payLaterLink, setPayLaterLink] = useState("");

  useEffect(() => {
    const prev = document.title;
    document.title = "Registration || HPBCT 2026";
    return () => {
      document.title = prev;
    };
  }, []);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadPhoto = async () => {
    if (!photoFile) throw new Error("Photo is required");

    const path = `registration/${Date.now()}-${sanitizeFileName(photoFile.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("player-photos")
      .upload(path, photoFile, { upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from("player-photos").getPublicUrl(path);
    return { path, publicUrl: data?.publicUrl ?? null };
  };

  const submit = async (paymentChoice) => {
    const parsed = parseRegistrationForm(form);
    if (!parsed.ok) {
      setError(parsed.error);
      setSuccess("");
      return;
    }
    const reg = parsed.data;

    setBusy(true);
    setError("");
    setSuccess("");
    setPayLaterLink("");

    let uniqueId = null;

    try {
      const { data: existingRows, error: existingError } = await supabase
        .from("registrations")
        .select("unique_id")
        .eq("email", reg.email)
        .limit(1);

      if (existingError) throw new Error(existingError.message);

      const existingId = existingRows?.[0]?.unique_id;
      if (existingId) {
        navigate(`/pay?registrationId=${existingId}`);
        return;
      }

      if (!photoFile) {
        setError("Photo is required");
        return;
      }

      const { publicUrl: photoUrl } = await uploadPhoto();

      const payload = toRegistrationInsertPayload(reg, photoUrl);

      const { data, error: insertError } = await supabase
        .from("registrations")
        .insert(payload)
        .select("unique_id")
        .single();
      if (insertError) throw new Error(insertError.message);
      uniqueId = data.unique_id;
      if (paymentChoice === "pay_now") {
        navigate(`/pay?registrationId=${data.unique_id}`);
        return;
      }

      const paymentLink = `${window.location.origin}/pay?registrationId=${data.unique_id}`;
      await YdsPaymentSdk.submit(import.meta.env.VITE_YDS_PAYMENT_SDK_URL, {
        formId: import.meta.env.VITE_YDS_PAYMENT_SDK_FORM_ID,
        submissionData: toYdsRegistrationSubmissionData(reg, paymentLink),
      });

      setPayLaterLink(paymentLink);
      setSuccess("pay_later_success");
    } catch (err) {
      if (uniqueId) {
        await supabase.from("registrations").delete().eq("unique_id", uniqueId);
      }
      setError(err.message || "Failed to submit registration");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pr-page-outer">
      <div className="pr-card pr-card--reg">
        <h1 className="teko pr-title">Registration</h1>

        <div className="pr-info-box">
          <div className="pr-box-title">
            HariPrabodham Box Cricket Tournament 2026
          </div>

          <div className="pr-details">
            <div>
              <span className="pr-detail-label">DATE:</span> May 10, 2026
            </div>
            <div>
              <span className="pr-detail-label">VENUE:</span> University of
              Waterloo, 220 Columbia St W, Waterloo, ON N2L 0A1
            </div>
            <div>
              <span className="pr-detail-label">FEES:</span> $30
            </div>

            <div className="pr-contact-block">
              <div className="pr-contact-heading">CONTACT DETAILS:</div>
              <div>
                Het Patel:{" "}
                <a href="tel:+15199824792" className="pr-link">
                  +1 (519) 982-4792
                </a>
              </div>
              <div>
                Nirmal Patel:{" "}
                <a href="tel:+16476877565" className="pr-link">
                  +1 (647) 687-7565
                </a>
              </div>
            </div>
          </div>

          <div className="pr-section-left">
            <div className="pr-strict-title">Strictly Note:</div>
            <ul className="pr-strict-list">
              <li>
                Your registration is only confirmed once you pay the fees.
              </li>
              <li>Fees are non-refundable.</li>
            </ul>
          </div>
        </div>

        {success !== "pay_later_success" ? (
          <>
            <div className="reg-form-grid">
              <label className="pr-field">
                <span className="pr-field-label">Full Name</span>
                <input
                  className="pr-input"
                  name="fullName"
                  placeholder="Atmiya Patel"
                  value={form.fullName}
                  onChange={(e) => onChange("fullName", e.target.value)}
                  required
                  autoComplete="name"
                />
              </label>

              <label className="pr-field">
                <span className="pr-field-label">Mobile Number</span>
                <input
                  className="pr-input"
                  name="mobileNumber"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={15}
                  placeholder="6471234567"
                  value={form.mobileNumber}
                  onChange={(e) =>
                    onChange("mobileNumber", e.target.value.replace(/\D/g, ""))
                  }
                  required
                  autoComplete="tel"
                />
              </label>

              <label className="pr-field">
                <span className="pr-field-label">Email</span>
                <input
                  className="pr-input"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>

              <label className="pr-field">
                <span className="pr-field-label">Date of Birth</span>
                <input
                  className="pr-input"
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => onChange("dob", e.target.value)}
                  required
                />
              </label>

              <label className="pr-field">
                <span className="pr-field-label">India T-shirt Size</span>
                <select
                  className="pr-input"
                  name="tshirtSize"
                  value={form.tshirtSize}
                  onChange={(e) => onChange("tshirtSize", e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select size
                  </option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="XXXL">XXXL</option>
                </select>
              </label>

              <label className="pr-field">
                <span className="pr-field-label">Batting Rating (1-10)</span>
                <input
                  className="pr-input"
                  name="battingRating"
                  type="number"
                  min={1}
                  max={10}
                  placeholder="1-10"
                  value={form.battingRating}
                  onChange={(e) => onChange("battingRating", e.target.value)}
                  required
                  inputMode="numeric"
                />
              </label>

              <label className="pr-field">
                <span className="pr-field-label">Bowling Rating (1-10)</span>
                <input
                  className="pr-input"
                  name="bowlingRating"
                  type="number"
                  min={1}
                  max={10}
                  placeholder="1-10"
                  value={form.bowlingRating}
                  onChange={(e) => onChange("bowlingRating", e.target.value)}
                  required
                  inputMode="numeric"
                />
              </label>

              <label className="pr-field">
                <span className="pr-field-label">Role</span>
                <select
                  className="pr-input"
                  name="role"
                  value={form.role}
                  onChange={(e) => onChange("role", e.target.value)}
                  required
                >
                  <option value="batsman">Batsman</option>
                  <option value="bowler">Bowler</option>
                  <option value="all-rounder">All-rounder</option>
                  <option value="wicket-keeper">Wicket-keeper</option>
                </select>
              </label>

              <label className="pr-field">
                <span className="pr-field-label">
                  Participated in 2025 box cricket tournament?
                </span>
                <select
                  className="pr-input"
                  name="participatedIn2025"
                  value={form.participatedIn2025}
                  onChange={(e) =>
                    onChange("participatedIn2025", e.target.value)
                  }
                  required
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label className="pr-field">
                <span className="pr-field-label">
                  Reference Name (Optional)
                </span>
                <input
                  className="pr-input"
                  name="referenceName"
                  placeholder="Friend/Team Captain"
                  value={form.referenceName}
                  onChange={(e) => onChange("referenceName", e.target.value)}
                  autoComplete="off"
                />
              </label>

              <label className="pr-field">
                <span className="pr-field-label">Photo Upload</span>
                <input
                  className="pr-input"
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  required
                />
                <div className="pr-help-text">
                  Simple face only photo. Passport style photo will be ideal,
                  2MB Max.
                </div>
              </label>
            </div>

            <div className="pr-form-actions">
              <button
                type="button"
                onClick={() => submit("pay_later")}
                disabled={busy}
                className="pr-outline-btn"
              >
                {busy ? "Submitting..." : "Pay Later"}
              </button>
              <button
                type="button"
                onClick={() => submit("pay_now")}
                disabled={busy}
                className="pr-primary-btn"
              >
                {busy ? "Submitting..." : "Pay Now"}
              </button>
            </div>
          </>
        ) : (
          <div className="pr-pay-confirmed" aria-live="polite">
            <h2 className="teko pr-title">Registration successful</h2>
            <p className="pr-reg-success-message">
              Your registration was successful, but your spot is{" "}
              <span className="pr-reg-success-highlight">NOT CONFIRMED</span>{" "}
              yet, it will only be confirmed after you have paid your fees.{" "}
              <span className="pr-reg-success-highlight">
                You&apos;ll receive a payment link on your email to pay your
                fees.
              </span>
            </p>
            <div className="pr-submit-wrap">
              <button
                type="button"
                className="pr-primary-btn full"
                onClick={() => window.location.assign(payLaterLink)}
              >
                Pay now to book your spot
              </button>
            </div>
          </div>
        )}

        {error && (
          <output className="pr-error" role="alert" aria-live="assertive">
            ❌ {error}
          </output>
        )}
        {success && success !== "pay_later_success" && (
          <output className="pr-success" aria-live="polite">
            ✅ {success}
          </output>
        )}
      </div>
    </div>
  );
}

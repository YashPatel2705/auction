import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { YdsPaymentSdk } from "yds-payment-sdk";
import { reportClientError } from "../lib/errorLogger";
import { parsePaymentCardForm } from "../lib/formSubmit";
import { supabase } from "../lib/supabase";
import "../styles/pay-registration.css";

export default function PayPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const registrationUuid = searchParams.get("registrationId");

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cardForm, setCardForm] = useState({
    number: "",
    expiryMonth: "",
    expiryYear: "",
    cvd: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const prev = document.title;
    document.title = "Pay || HPBCT 2026";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    if (!registrationUuid) {
      navigate("/registration", { replace: true });
      return;
    }

    (async () => {
      const { data, error: fetchError } = await supabase
        .from("registrations")
        .select("unique_id, full_name, mobile, email, status")
        .eq("unique_id", registrationUuid)
        .single();

      if (fetchError || !data) {
        navigate("/registration", { replace: true });
        return;
      }

      setRegistration(data);
      setLoading(false);
    })();
  }, [registrationUuid, navigate]);

  const onCardChange = (key, value) => {
    setCardForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    const parsed = parsePaymentCardForm(cardForm);
    if (!parsed.ok) {
      setError(parsed.error);
      setSuccess("");
      return;
    }
    const card = parsed.data;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await YdsPaymentSdk.submit(import.meta.env.VITE_YDS_PAYMENT_SDK_URL, {
        formId: import.meta.env.VITE_YDS_PAYMENT_SDK_FORM_ID,
        paymentInfo: {
          amount: 30,
          card,
        },
        submissionData: {
          fullName: registration.full_name,
          email: registration.email,
          phoneNumber: registration.mobile,
        },
      });

      const { error: updateError } = await supabase
        .from("registrations")
        .update({ status: "paid" })
        .eq("unique_id", registrationUuid);
      if (updateError) throw new Error(updateError.message);

      setSuccess(
        "Payment successful! Your spot is confirmed, we'll see you on the ground with infectious enthusiasm!",
      );
      setRegistration((prev) => ({ ...prev, status: "paid" }));
    } catch (err) {
      reportClientError(err, {
        kind: "payment_submit_error",
        email: registration?.email,
        meta: {
          component: "PayPage",
          action: "submit",
          page: "pay",
          section: "submit",
          status: "failed",
          flow: "pay_now",
          sdk: "yds-payment-sdk",
        },
      });
      setError(err.message || "Payment failed");
    } finally {
      setBusy(false);
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

  const alreadyPaid = registration?.status === "paid";

  return (
    <div className="pr-page-outer">
      {busy && (
        <div className="pr-loading-overlay" aria-live="polite">
          <div className="pr-spinner" aria-hidden="true" />
          <span className="pr-loading-text">Processing payment...</span>
        </div>
      )}
      <div className="pr-card pr-card--pay">
        <h1 className="teko pr-title">
          {alreadyPaid ? "Payment confirmed" : "Pay now"}
        </h1>

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

        <div className="pr-row-2-summary">
          <div>
            <span className="pr-field-label">Name</span>
            <div className="pr-value">{registration.full_name}</div>
          </div>
          <div>
            <span className="pr-field-label">Mobile</span>
            <div className="pr-value">{registration.mobile}</div>
          </div>
          <div className="pr-span-2">
            <span className="pr-field-label">Email</span>
            <div className="pr-value">{registration.email}</div>
          </div>
        </div>

        {alreadyPaid ? (
          <div className="pr-pay-confirmed">
            We've received your fees, your spot is confirmed, we'll see you on
            the ground with infectious enthusiasm!
          </div>
        ) : (
          <>
            <div className="pr-row-2-form">
              <label className="pr-field pr-span-2">
                <span className="pr-field-label">Credit Card Number</span>
                <input
                  name="number"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={16}
                  placeholder="1234123412341234"
                  value={cardForm.number}
                  onChange={(e) =>
                    onCardChange("number", e.target.value.replace(/\D/g, ""))
                  }
                  required
                  autoComplete="cc-number"
                  className="pr-input"
                />
              </label>

              <label className="pr-field">
                <span className="pr-field-label">Expiry Month</span>
                <input
                  name="expiryMonth"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  placeholder="MM"
                  value={cardForm.expiryMonth}
                  onChange={(e) =>
                    onCardChange(
                      "expiryMonth",
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                  required
                  autoComplete="cc-exp-month"
                  className="pr-input"
                />
              </label>

              <label className="pr-field">
                <span className="pr-field-label">Expiry Year</span>
                <input
                  name="expiryYear"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  placeholder="YY"
                  value={cardForm.expiryYear}
                  onChange={(e) =>
                    onCardChange(
                      "expiryYear",
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                  required
                  autoComplete="cc-exp-year"
                  className="pr-input"
                />
              </label>

              <label className="pr-field pr-span-2">
                <span className="pr-field-label">Security Code</span>
                <input
                  name="cvd"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="CVV"
                  value={cardForm.cvd}
                  onChange={(e) =>
                    onCardChange("cvd", e.target.value.replace(/\D/g, ""))
                  }
                  required
                  autoComplete="cc-csc"
                  className="pr-input"
                />
              </label>
            </div>

            {error && (
              <output className="pr-error" role="alert" aria-live="assertive">
                {error}
              </output>
            )}
            {success && (
              <output className="pr-success" aria-live="polite">
                {success}
              </output>
            )}

            <div className="pr-submit-wrap">
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="pr-primary-btn full"
              >
                {busy ? "Processing..." : "Pay now $30"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

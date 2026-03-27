/** @typedef {{ fullName: string; mobile: string; email: string; dob: string; tshirtSize: string; role: string; participatedIn2025: boolean; referenceName: string | null; battingRating: number; bowlingRating: number; isKeeper: boolean }} RegistrationNormalized */

const ROLES = new Set(["batsman", "bowler", "all-rounder", "wicket-keeper"]);
const TSHIRT_SIZES = new Set(["S", "M", "L", "XL", "XXL", "XXXL"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates and normalizes registration form state (all fields except photo).
 * Check `photoFile` before insert/upload.
 * @param {Record<string, unknown>} form
 * @returns {{ ok: true; data: RegistrationNormalized } | { ok: false; error: string }}
 */
export function parseRegistrationForm(form) {
  const fullName = String(form.fullName ?? "").trim();
  const mobile = String(form.mobileNumber ?? "").replace(/\D/g, "");
  const email = String(form.email ?? "")
    .trim()
    .toLowerCase();
  const dob = String(form.dob ?? "").trim();
  const tshirtSize = String(form.tshirtSize ?? "").trim();
  const role = String(form.role ?? "").trim();
  const participatedRaw = String(form.participatedIn2025 ?? "");
  const refRaw = String(form.referenceName ?? "").trim();

  let battingRating = Number(form.battingRating);
  let bowlingRating = Number(form.bowlingRating);

  if (!fullName) return { ok: false, error: "Full name is required" };
  if (!mobile) return { ok: false, error: "Mobile number is required" };
  if (!/^\d+$/.test(mobile))
    return { ok: false, error: "Mobile number must contain only digits" };
  if (!email) return { ok: false, error: "Email is required" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email" };
  if (!dob) return { ok: false, error: "Date of birth is required" };
  if (!tshirtSize || !TSHIRT_SIZES.has(tshirtSize))
    return { ok: false, error: "India T-shirt size is required" };
  if (!ROLES.has(role)) return { ok: false, error: "Role is required" };
  if (participatedRaw !== "yes" && participatedRaw !== "no")
    return {
      ok: false,
      error: "Please answer the 2025 participation question",
    };

  if (
    !Number.isFinite(battingRating) ||
    battingRating < 1 ||
    battingRating > 10
  )
    return { ok: false, error: "Batting rating must be between 1 and 10" };
  if (
    !Number.isFinite(bowlingRating) ||
    bowlingRating < 1 ||
    bowlingRating > 10
  )
    return { ok: false, error: "Bowling rating must be between 1 and 10" };

  battingRating = Math.round(battingRating);
  bowlingRating = Math.round(bowlingRating);

  return {
    ok: true,
    data: {
      fullName,
      mobile,
      email,
      dob,
      tshirtSize,
      role,
      participatedIn2025: participatedRaw === "yes",
      referenceName: refRaw || null,
      battingRating,
      bowlingRating,
      isKeeper: role === "wicket-keeper",
    },
  };
}

/**
 * @param {RegistrationNormalized} data
 * @param {string | null} photoUrl
 */
export function toRegistrationInsertPayload(data, photoUrl) {
  return {
    full_name: data.fullName,
    mobile: data.mobile,
    email: data.email,
    dob: data.dob,
    reference_name: data.referenceName,
    batting_rating: data.battingRating,
    bowling_rating: data.bowlingRating,
    tshirt_size: data.tshirtSize,
    participated_2025: data.participatedIn2025,
    status: "pending",
    role: data.role,
    is_keeper: data.isKeeper,
    photo_url: photoUrl,
  };
}

/**
 * @param {RegistrationNormalized} data
 */
export function toYdsRegistrationSubmissionData(data) {
  return {
    fullName: data.fullName,
    email: data.email,
    phoneNumber: data.mobile,
  };
}

function isAmexCard(cardNumber) {
  return /^3[47]\d{13}$/.test(cardNumber);
}

/**
 * @param {Record<string, unknown>} form
 * @returns {{ ok: true; data: { number: string; expiryMonth: string; expiryYear: string; cvd: string } } | { ok: false; error: string }}
 */
export function parsePaymentCardForm(form) {
  const number = String(form.number ?? "").replace(/\D/g, "");
  const expiryMonthRaw = String(form.expiryMonth ?? "").replace(/\D/g, "");
  const expiryYearRaw = String(form.expiryYear ?? "").replace(/\D/g, "");
  const cvd = String(form.cvd ?? "").replace(/\D/g, "");

  const amex = isAmexCard(number);
  if (amex) {
    if (!/^3[47]\d{13}$/.test(number))
      return {
        ok: false,
        error: "Amex card number must be 15 digits and start with 34 or 37",
      };
  } else if (!/^\d{16}$/.test(number)) {
    return {
      ok: false,
      error: "Card number must be 16 digits (Amex: 15 digits)",
    };
  }

  if (!/^\d{2}$/.test(expiryMonthRaw))
    return { ok: false, error: "Expiry month must be 2 digits" };
  const month = Number(expiryMonthRaw);
  if (month < 1 || month > 12)
    return { ok: false, error: "Expiry month must be between 01 and 12" };
  if (!/^\d{2}$/.test(expiryYearRaw))
    return { ok: false, error: "Expiry year must be 2 digits" };

  if (amex) {
    if (!/^\d{4}$/.test(cvd))
      return { ok: false, error: "Amex security code must be 4 digits" };
  } else if (!/^\d{3}$/.test(cvd)) {
    return {
      ok: false,
      error: "Security code must be 3 digits (Amex: 4 digits)",
    };
  }

  const expiryMonth = expiryMonthRaw.padStart(2, "0").slice(0, 2);
  const expiryYear = expiryYearRaw.padStart(2, "0").slice(0, 2);

  return {
    ok: true,
    data: { number, expiryMonth, expiryYear, cvd },
  };
}

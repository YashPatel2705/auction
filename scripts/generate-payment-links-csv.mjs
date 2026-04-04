import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.resolve(__dirname, "../registrations_rows.csv");
const OUTPUT_CSV_PATH = path.resolve(__dirname, "../registrations_payment_links.csv");
const OUTPUT_JSON_PATH = path.resolve(__dirname, "../registrations_payment_links.json");
const BASE_URL = "https://hpkboxcricketauction.vercel.app";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      value = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    if (row.some((cell) => cell !== "")) rows.push(row);
  }

  return rows;
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildPaymentLink(registrationId) {
  return `${BASE_URL}/pay?rid=${encodeURIComponent(registrationId)}`;
}

async function main() {
  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const rows = parseCsv(raw);

  if (rows.length === 0) {
    throw new Error("Input CSV is empty.");
  }

  const header = rows[0];
  const emailIdx = header.indexOf("email");
  const registrationIdIdx = header.indexOf("unique_id");

  if (emailIdx === -1 || registrationIdIdx === -1) {
    throw new Error("Input CSV must contain email and unique_id columns.");
  }

  const outRows = [["email", "payment_link"]];
  const outJson = [];

  for (let i = 1; i < rows.length; i += 1) {
    const src = rows[i];
    const email = (src[emailIdx] || "").trim();
    const registrationId = (src[registrationIdIdx] || "").trim();
    if (!email || !registrationId) continue;
    const paymentLink = buildPaymentLink(registrationId);
    outRows.push([email, paymentLink]);
    outJson.push({ email, paymentLink });
  }

  const outCsv = outRows
    .map((r) => r.map((cell) => csvEscape(cell)).join(","))
    .join("\n");

  await fs.writeFile(OUTPUT_CSV_PATH, `${outCsv}\n`, "utf8");
  await fs.writeFile(
    OUTPUT_JSON_PATH,
    `${JSON.stringify(outJson, null, 2)}\n`,
    "utf8"
  );
  console.log(
    `Created ${OUTPUT_CSV_PATH} and ${OUTPUT_JSON_PATH} with ${outJson.length} rows`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

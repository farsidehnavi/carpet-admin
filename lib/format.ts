/** Helpers shared by the browser and the server. */

/** Persian/Arabic digits -> ASCII digits. */
export function toAsciiDigits(text: string): string {
  const digits = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩";
  return text.replace(/[۰-۹٠-٩]/g, (ch) => String(digits.indexOf(ch) % 10));
}

/**
 * Read a price typed by a person. Accepts Persian digits and thousands
 * separators ("1,200,000", "۱٬۲۰۰٬۰۰۰"). Empty text means "no price".
 */
export function parsePrice(input: string): { ok: true; value: number | null } | { ok: false } {
  const text = toAsciiDigits(input)
    .trim()
    .replace(/[,\u060C\u066C\s]/g, "")
    .replace(/\u066B/g, ".");
  if (text === "") return { ok: true, value: null };
  if (!/^\d+(\.\d+)?$/.test(text)) return { ok: false };
  const value = Number(text);
  return Number.isFinite(value) ? { ok: true, value } : { ok: false };
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

/** Lower-case, unify Arabic/Persian letter variants, drop diacritics - for searching. */
export function normalizeForSearch(text: string): string {
  return toAsciiDigits(text)
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0640]/g, "")
    .trim();
}

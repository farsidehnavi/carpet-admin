import "server-only";
import { parsePrice } from "./format";
import { SAFE_NAME } from "./api";
import type { NewProduct, ProductPatch } from "./types";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_PHOTOS = 30;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function readText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : null;
}

function readPrice(value: unknown): { ok: true; value: number | undefined } | { ok: false } {
  if (value === undefined || value === null || value === "") return { ok: true, value: undefined };
  const parsed = typeof value === "number" ? { ok: true as const, value } : typeof value === "string" ? parsePrice(value) : { ok: false as const };
  if (!parsed.ok) return { ok: false };
  if (parsed.value === null) return { ok: true, value: undefined };
  if (!Number.isFinite(parsed.value) || parsed.value < 0) return { ok: false };
  return { ok: true, value: parsed.value };
}

function readNames(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_PHOTOS) return null;
  const names = value.filter((x): x is string => typeof x === "string" && SAFE_NAME.test(x));
  return names.length === value.length ? names : null;
}

export function parseNewProduct(body: unknown): Result<NewProduct> {
  if (!isRecord(body)) return { ok: false, error: "Invalid request." };

  const name = readText(body.name, 200);
  if (!name) return { ok: false, error: "The English name is required." };
  const nameFa = readText(body.nameFa, 200);
  if (!nameFa) return { ok: false, error: "The Farsi name is required." };

  const description = body.description === undefined ? "" : readText(body.description, 5000);
  const descriptionFa = body.descriptionFa === undefined ? "" : readText(body.descriptionFa, 5000);
  if (description === null || descriptionFa === null) return { ok: false, error: "A description is too long." };

  const price = readPrice(body.price);
  if (!price.ok) return { ok: false, error: "The price must be a number." };

  const images = readNames(body.images);
  if (!images) return { ok: false, error: "Invalid photo list." };

  const value: NewProduct = { name, nameFa, description, descriptionFa, images };
  if (price.value !== undefined) value.price = price.value;       // no price -> the key is absent
  return { ok: true, value };
}

export function parsePatch(body: unknown): Result<ProductPatch> {
  if (!isRecord(body)) return { ok: false, error: "Invalid request." };
  const patch: ProductPatch = {};

  if (body.name !== undefined) {
    const name = readText(body.name, 200);
    if (!name) return { ok: false, error: "The English name can't be empty." };
    patch.name = name;
  }
  if (body.nameFa !== undefined) {
    const nameFa = readText(body.nameFa, 200);
    if (!nameFa) return { ok: false, error: "The Farsi name can't be empty." };
    patch.nameFa = nameFa;
  }
  if (body.description !== undefined) {
    const description = readText(body.description, 5000);
    if (description === null) return { ok: false, error: "The description is too long." };
    patch.description = description;
  }
  if (body.descriptionFa !== undefined) {
    const descriptionFa = readText(body.descriptionFa, 5000);
    if (descriptionFa === null) return { ok: false, error: "The Farsi description is too long." };
    patch.descriptionFa = descriptionFa;
  }
  if (body.price !== undefined) {
    const price = readPrice(body.price);
    if (!price.ok || price.value === undefined) return { ok: false, error: "The price must be a number." };
    patch.price = price.value;
  }

  const addImages = readNames(body.addImages);
  const removeImages = readNames(body.removeImages);
  if (!addImages || !removeImages) return { ok: false, error: "Invalid photo list." };
  if (addImages.length) patch.addImages = addImages;
  if (removeImages.length) patch.removeImages = removeImages;

  return { ok: true, value: patch };
}

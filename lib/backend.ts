import "server-only";
import { config } from "./config";
import type { NewProduct, Product, ProductPatch } from "./types";

/**
 * Everything that talks to the existing backend API and image server lives here.
 *
 * Rules:
 *  - every request has a timeout, so nothing can hang forever;
 *  - GETs are retried, writes are not (a retry could create an item twice);
 *  - after every write we WAIT until the backend really returns the change
 *    (waitFor) before answering, so the screen never shows stale data.
 */

const REQUEST_TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 30_000;
const GET_RETRIES = 2;
const RETRY_DELAY_MS = 500;
const WAIT_TRIES = 8;
const WAIT_DELAY_MS = 600;

export class BackendError extends Error {}
export class NotFoundError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type RequestOptions = {
  json?: unknown;
  body?: FormData;
  timeoutMs?: number;
  retries?: number;
};

async function request(method: string, url: string, options: RequestOptions = {}): Promise<Response> {
  const retries = options.retries ?? 0;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, {
        method,
        headers: options.json !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
        cache: "no-store",
        signal: AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (attempt >= retries) {
        throw new BackendError(`${method} ${url} failed: ${(error as Error).message}`);
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
}

/** A write to the backend: any non-2xx answer is an error. */
async function write(method: string, path: string, json?: unknown): Promise<void> {
  const response = await request(method, `${config.apiUrl}${path}`, { json });
  if (!response.ok) throw new BackendError(`${method} ${path} returned HTTP ${response.status}`);
}

/** Poll `check` until it is true, to give the backend time to finish a write. */
async function waitFor(check: () => Promise<boolean>): Promise<boolean> {
  for (let attempt = 0; attempt < WAIT_TRIES; attempt++) {
    try {
      if (await check()) return true;
    } catch {
      /* a failed look just counts as "not yet" */
    }
    if (attempt < WAIT_TRIES - 1) await sleep(WAIT_DELAY_MS);
  }
  return false;
}

// ---- reading ---------------------------------------------------------------

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toProduct(raw: Record<string, unknown>): Product {
  const price = raw.price === null || raw.price === undefined || raw.price === "" ? null : Number(raw.price);
  return {
    id: String(raw.id),
    name: text(raw.name),
    nameFa: text(raw[config.nameFaField]),
    description: text(raw.description),
    descriptionFa: text(raw[config.descriptionFaField]),
    price: price !== null && Number.isFinite(price) ? price : null,
    images: Array.isArray(raw.image_url) ? raw.image_url.filter((x): x is string => typeof x === "string") : [],
  };
}

export async function listProducts(): Promise<Product[]> {
  const path = config.parentId ? `/product/all?parent_id=${encodeURIComponent(config.parentId)}` : "/product/all";
  const response = await request("GET", `${config.apiUrl}${path}`, {
    retries: GET_RETRIES,
  });
  if (!response.ok) throw new BackendError(`GET ${path} returned HTTP ${response.status}`);

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new BackendError(`GET ${path} did not return JSON`);
  }
  const items = data && typeof data === "object" ? (data as { Data?: unknown }).Data : null;
  if (!Array.isArray(items)) return [];
  return items.filter((x): x is Record<string, unknown> => !!x && typeof x === "object").map(toProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  return (await listProducts()).find((product) => product.id === id) ?? null;
}

// ---- writing ---------------------------------------------------------------

/** Create a product. Returns its id (null if the backend hasn't listed it yet). */
export async function createProduct(input: NewProduct): Promise<string | null> {
  const before = new Set((await listProducts()).map((product) => product.id));

  const fields: Record<string, unknown> = {
    name: input.name,
    [config.nameFaField]: input.nameFa,
    description: input.description,
    [config.descriptionFaField]: input.descriptionFa,
    image_url: input.images,
  };
  if (input.price !== undefined) fields.price = input.price;        // no price given -> not sent at all
  if (config.parentId) fields.parent_id = /^\d+$/.test(config.parentId) ? Number(config.parentId) : config.parentId;

  await write("POST", "/product/add", fields);

  let createdId: string | null = null;
  await waitFor(async () => {
    const fresh = (await listProducts()).filter((product) => !before.has(product.id));
    if (fresh.length === 0) return false;
    createdId = (fresh.find((product) => product.name === input.name) ?? fresh[0]).id;
    return true;
  });
  return createdId;
}

/** Apply only what changed. Returns true once the backend shows the change. */
export async function updateProduct(id: string, patch: ProductPatch): Promise<boolean> {
  const current = await getProduct(id);
  if (!current) throw new NotFoundError();

  const fields: Record<string, unknown> = {};
  if (patch.name !== undefined) fields.name = patch.name;
  if (patch.nameFa !== undefined) fields[config.nameFaField] = patch.nameFa;
  if (patch.description !== undefined) fields.description = patch.description;
  if (patch.descriptionFa !== undefined) fields[config.descriptionFaField] = patch.descriptionFa;
  if (patch.price !== undefined) fields.price = patch.price;
  if (patch.removePrice) fields.price = true;                    // the backend removes the price when it receives `true`
  if (Object.keys(fields).length > 0) await write("POST", "/product/add", { id, ...fields });

  const addImages = patch.addImages ?? [];
  for (const name of addImages) {
    await write("POST", "/product/img/", { url: name, image_owner_id: id });
  }

  const removeImages = (patch.removeImages ?? []).filter((name) => current.images.includes(name));
  let remaining = [...current.images, ...addImages];
  for (const name of removeImages) {
    remaining = remaining.filter((existing) => existing !== name);
    await write("DELETE", `/product/img/${encodeURIComponent(id)}/${encodeURIComponent(name)}`, {
      image_url: remaining,
      id,
    });
    await deleteStoredImage(name);
  }

  return waitFor(async () => {
    const now = await getProduct(id);
    if (!now) return false;
    return (
      (patch.name === undefined || now.name === patch.name) &&
      (patch.nameFa === undefined || now.nameFa === patch.nameFa) &&
      (patch.description === undefined || now.description === patch.description) &&
      (patch.descriptionFa === undefined || now.descriptionFa === patch.descriptionFa) &&
      (patch.price === undefined || now.price === patch.price) &&
      (!patch.removePrice || now.price === null) &&
      addImages.every((name) => now.images.includes(name)) &&
      removeImages.every((name) => !now.images.includes(name))
    );
  });
}

/** Delete a product, then its photo files. The product goes first: if that fails nothing else is touched. */
export async function deleteProduct(id: string): Promise<void> {
  const product = await getProduct(id);
  if (!product) return;
  await write("DELETE", `/product/delete/${encodeURIComponent(id)}`);
  await Promise.all(product.images.map(deleteStoredImage));
  await waitFor(async () => (await getProduct(id)) === null);
}

// ---- photos ----------------------------------------------------------------

/** Upload a photo to the image server. Returns the file name it was stored under. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file, file.name || "photo.jpg");
  const response = await request("POST", `${config.imageServerUrl}upload/`, {
    body: form,
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });
  if (!response.ok) throw new BackendError(`image upload returned HTTP ${response.status}`);
  const data = (await response.json().catch(() => null)) as { imageUrl?: unknown } | null;
  if (!data || typeof data.imageUrl !== "string" || !data.imageUrl) {
    throw new BackendError("image server did not return a file name");
  }
  return data.imageUrl;
}

/** Delete a photo file. Best effort: a failure is only logged. */
export async function deleteStoredImage(name: string): Promise<void> {
  try {
    await write("DELETE", `/img/delete/${encodeURIComponent(name)}`);
  } catch (error) {
    console.error(`Could not delete image ${name}:`, (error as Error).message);
  }
}

/** Fetch a photo from the image server (for the /api/img proxy). */
export async function fetchImage(name: string): Promise<Response> {
  return request("GET", `${config.imageServerUrl}images/${encodeURIComponent(name)}`, {
    timeoutMs: UPLOAD_TIMEOUT_MS,
    retries: 1,
  });
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, photoUrl } from "@/lib/client";
import { parsePrice } from "@/lib/format";
import { prepareImage } from "@/lib/image";
import type { Product } from "@/lib/types";
import { ImageIcon, PlusIcon, UndoIcon, XIcon } from "./icons";

/* eslint-disable @next/next/no-img-element */

const MAX_PHOTOS = 20;

type NewPhoto = { key: number; file: File; preview: string };
type Errors = Partial<Record<"name" | "nameFa" | "price", string>>;

/** Add / edit form. Pass `product` to edit it, or nothing to create a new one. */
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const editing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [nameFa, setNameFa] = useState(product?.nameFa ?? "");
  const [priceText, setPriceText] = useState(product?.price != null ? String(product.price) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [descriptionFa, setDescriptionFa] = useState(product?.descriptionFa ?? "");

  const existing = product?.images ?? [];
  const [removed, setRemoved] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");

  const fileInput = useRef<HTMLInputElement>(null);
  const counter = useRef(0);
  const previews = useRef<string[]>([]);

  useEffect(() => {
    const list = previews.current;
    return () => list.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const keptCount = existing.length - removed.length;
  const photoCount = keptCount + newPhotos.length;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const room = Math.max(0, MAX_PHOTOS - photoCount);
    const accepted = Array.from(list)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, room);
    const added = accepted.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      return { key: counter.current++, file, preview };
    });
    setNewPhotos((current) => [...current, ...added]);
    if (fileInput.current) fileInput.current.value = "";
  }

  /** Typing in a field removes that field's error message straight away. */
  function clearError(field: keyof Errors) {
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function removeNew(key: number) {
    setNewPhotos((current) => current.filter((photo) => photo.key !== key));
  }

  function validate() {
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter the English name.";
    if (!nameFa.trim()) next.nameFa = "Enter the Farsi name.";
    const price = parsePrice(priceText);
    if (!price.ok) next.price = "Enter a number, or leave it empty.";
    return { next, price };
  }

  function cancel() {
    router.push(product ? `/products/${encodeURIComponent(product.id)}` : "/");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setFormError(null);

    const { next, price } = validate();
    setErrors(next);
    const firstInvalid = (["name", "nameFa", "price"] as const).find((field) => next[field]);
    if (firstInvalid || !price.ok) {
      document.getElementById(`field-${firstInvalid ?? "price"}`)?.focus();
      return;
    }

    // Edit: send only what changed.
    const changes: Record<string, unknown> = {};
    if (product) {
      if (name.trim() !== product.name) changes.name = name.trim();
      if (nameFa.trim() !== product.nameFa) changes.nameFa = nameFa.trim();
      if (description.trim() !== product.description) changes.description = description.trim();
      if (descriptionFa.trim() !== product.descriptionFa) changes.descriptionFa = descriptionFa.trim();
      if (price.value !== null && price.value !== product.price) changes.price = price.value;
      if (price.value === null && product.price !== null) changes.removePrice = true;   // field emptied -> remove the price
      if (Object.keys(changes).length === 0 && removed.length === 0 && newPhotos.length === 0) {
        cancel();
        return;
      }
    }

    setSaving(true);
    const uploaded: string[] = [];
    try {
      for (let i = 0; i < newPhotos.length; i++) {
        setProgress(`Uploading photo ${i + 1} of ${newPhotos.length}…`);
        const file = await prepareImage(newPhotos[i].file);
        const body = new FormData();
        body.append("file", file, file.name);
        const result = await api<{ name: string }>("/api/upload", { method: "POST", body, timeoutMs: 60_000 });
        uploaded.push(result.name);
      }

      setProgress("Saving…");
      if (product) {
        await api(`/api/products/${encodeURIComponent(product.id)}`, {
          method: "PATCH",
          json: { ...changes, addImages: uploaded, removeImages: removed },
          timeoutMs: 60_000,
        });
        router.replace(`/products/${encodeURIComponent(product.id)}`);
      } else {
        const payload: Record<string, unknown> = {
          name: name.trim(),
          nameFa: nameFa.trim(),
          description: description.trim(),
          descriptionFa: descriptionFa.trim(),
          images: uploaded,
        };
        if (price.value !== null) payload.price = price.value;       // no price -> not sent
        const created = await api<{ id: string | null }>("/api/products", { method: "POST", json: payload, timeoutMs: 60_000 });
        router.replace(created.id ? `/products/${encodeURIComponent(created.id)}` : "/");
      }
      router.refresh();
    } catch (error) {
      // Nothing was saved: remove the photos that were already uploaded, so they don't pile up on the server.
      await Promise.allSettled(uploaded.map((photo) => api(`/api/img/${encodeURIComponent(photo)}`, { method: "DELETE" })));
      setFormError(
        `${error instanceof ApiError ? error.message : "Something went wrong."} ${
          uploaded.length ? "Nothing was saved — please try again." : ""
        }`.trim(),
      );
      setSaving(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-2xl pb-28 sm:pb-0">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">{editing ? "Edit product" : "New product"}</h1>

      <div className="space-y-5">
        {/* Names */}
        <section className="card space-y-4 p-4 sm:p-6">
          <div>
            <label htmlFor="field-name" className="label">
              <span>Name (English)</span>
              <span className="text-xs font-normal text-danger">Required</span>
            </label>
            <input
              id="field-name"
              className="input"
              value={name}
              onChange={(e) => { setName(e.target.value); clearError("name"); }}
              aria-invalid={Boolean(errors.name)}
              autoComplete="off"
              maxLength={200}
            />
            {errors.name ? <p className="field-error">{errors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="field-nameFa" className="label">
              <span>Name (Farsi)</span>
              <span className="fa text-[13px] font-normal text-muted" lang="fa">نام فارسی</span>
            </label>
            <input
              id="field-nameFa"
              className="input fa"
              lang="fa"
              dir="rtl"
              value={nameFa}
              onChange={(e) => { setNameFa(e.target.value); clearError("nameFa"); }}
              aria-invalid={Boolean(errors.nameFa)}
              autoComplete="off"
              maxLength={200}
            />
            {errors.nameFa ? <p className="field-error">{errors.nameFa}</p> : null}
          </div>

          <div>
            <label htmlFor="field-price" className="label">
              <span>Price (Toman)</span>
              <span className="text-xs font-normal text-muted">Optional</span>
            </label>
            <input
              id="field-price"
              className="input"
              inputMode="decimal"
              value={priceText}
              onChange={(e) => { setPriceText(e.target.value); clearError("price"); }}
              aria-invalid={Boolean(errors.price)}
              placeholder="e.g. 1,200,000"
              autoComplete="off"
            />
            {errors.price ? (
              <p className="field-error">{errors.price}</p>
            ) : (
              <p className="hint">
                {product && product.price !== null ? "Empty this field to remove the price." : "Leave empty if the product has no price."}
              </p>
            )}
          </div>
        </section>

        {/* Descriptions */}
        <section className="card space-y-4 p-4 sm:p-6">
          <div>
            <label htmlFor="field-description" className="label">
              <span>Description (English)</span>
              <span className="text-xs font-normal text-muted">Optional</span>
            </label>
            <textarea
              id="field-description"
              className="input min-h-28 resize-y"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
            />
          </div>
          <div>
            <label htmlFor="field-descriptionFa" className="label">
              <span>Description (Farsi)</span>
              <span className="fa text-[13px] font-normal text-muted" lang="fa">توضیحات فارسی</span>
            </label>
            <textarea
              id="field-descriptionFa"
              className="input fa min-h-28 resize-y"
              lang="fa"
              dir="rtl"
              rows={4}
              value={descriptionFa}
              onChange={(e) => setDescriptionFa(e.target.value)}
              maxLength={5000}
            />
          </div>
        </section>

        {/* Photos */}
        <section className="card p-4 sm:p-6">
          <div className="label">
            <span>Photos</span>
            <span className="text-xs font-normal text-muted">
              {photoCount} / {MAX_PHOTOS}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {existing.map((photo) => {
              const isRemoved = removed.includes(photo);
              return (
                <div key={photo} className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
                  <img src={photoUrl(photo)} alt="" loading="lazy" className={`size-full object-cover transition ${isRemoved ? "opacity-25" : ""}`} />
                  <button
                    type="button"
                    onClick={() => setRemoved((list) => (isRemoved ? list.filter((p) => p !== photo) : [...list, photo]))}
                    aria-label={isRemoved ? "Keep this photo" : "Remove this photo"}
                    className={`absolute grid place-items-center rounded-full text-white backdrop-blur ${
                      isRemoved ? "inset-0 m-auto size-11 bg-black/60" : "right-1.5 top-1.5 size-8 bg-black/60"
                    }`}
                  >
                    {isRemoved ? <UndoIcon width={18} height={18} /> : <XIcon width={16} height={16} />}
                  </button>
                </div>
              );
            })}

            {newPhotos.map((photo) => (
              <div key={photo.key} className="relative aspect-square overflow-hidden rounded-xl bg-surface-2 ring-2 ring-accent">
                <img src={photo.preview} alt="" className="size-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-fg">New</span>
                <button
                  type="button"
                  onClick={() => removeNew(photo.key)}
                  aria-label="Remove this photo"
                  className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur"
                >
                  <XIcon width={16} height={16} />
                </button>
              </div>
            ))}

            {photoCount < MAX_PHOTOS ? (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line text-muted transition hover:border-accent hover:text-accent"
              >
                <span className="flex flex-col items-center gap-1 text-xs font-medium">
                  {photoCount === 0 ? <ImageIcon width={24} height={24} /> : <PlusIcon width={24} height={24} />}
                  Add photos
                </span>
              </button>
            ) : null}
          </div>

          <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        </section>
      </div>

      {formError ? (
        <p role="alert" className="mt-5 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      {/* Phone: pinned to the bottom of the screen */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        {progress ? <p className="mb-2 text-center text-sm text-muted sm:text-left" aria-live="polite">{progress}</p> : null}
        <div className="mx-auto flex max-w-2xl gap-3 sm:justify-end">
          <button type="button" className="btn btn-secondary flex-1 sm:flex-none" onClick={cancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary flex-1 sm:min-w-36 sm:flex-none" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add product"}
          </button>
        </div>
      </div>
    </form>
  );
}

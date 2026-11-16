"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/client";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { Gallery } from "./Gallery";
import { ArrowLeftIcon, PencilIcon, TrashIcon } from "./icons";

function Field({ label, children, fa }: { label: string; children: React.ReactNode; fa?: boolean }) {
  return (
    <div>
      <dt className={`text-xs font-medium uppercase tracking-wide text-muted ${fa ? "fa text-[13px] normal-case tracking-normal" : ""}`}>{label}</dt>
      <dd className={`mt-1 whitespace-pre-wrap break-words ${fa ? "fa" : "leading-relaxed"}`} lang={fa ? "fa" : undefined}>
        {children}
      </dd>
    </div>
  );
}

const Empty = () => <span className="text-muted">—</span>;

export function ProductView({ product }: { product: Product }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      await api(`/api/products/${encodeURIComponent(product.id)}`, { method: "DELETE", timeoutMs: 60_000 });
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete the product.");
      setDeleting(false);
    }
  }

  const actions = (
    <>
      <Link href={`/products/${encodeURIComponent(product.id)}/edit`} className="btn btn-primary flex-1 sm:flex-none">
        <PencilIcon width={18} height={18} /> Edit
      </Link>
      <button type="button" className="btn btn-danger flex-1 sm:flex-none" onClick={() => setConfirming(true)}>
        <TrashIcon width={18} height={18} /> Delete
      </button>
    </>
  );

  return (
    <div className="pb-24 sm:pb-0">
      <Link href="/" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted hover:text-fg">
        <ArrowLeftIcon width={18} height={18} /> All products
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <Gallery images={product.images} alt={product.name || product.nameFa} />

        <div className="min-w-0">
          <div className="card p-5 sm:p-6">
            <h1 className="fa text-2xl font-bold leading-snug" lang="fa">
              {product.nameFa || <Empty />}
            </h1>
            <p className="mt-0.5 break-words text-lg font-medium text-muted">{product.name}</p>

            <p className="mt-4 text-2xl font-semibold">
              {product.price !== null ? (
                <>
                  {formatPrice(product.price)} <span className="text-sm font-normal text-muted">Toman</span>
                </>
              ) : (
                <span className="text-base font-normal text-muted">No price set</span>
              )}
            </p>

            <dl className="mt-6 space-y-5 border-t border-line pt-5">
              <Field label="Description">{product.description || <Empty />}</Field>
              <Field label="توضیحات" fa>
                {product.descriptionFa || <Empty />}
              </Field>
            </dl>
          </div>

          <div className="mt-4 hidden gap-3 sm:flex">{actions}</div>
        </div>
      </div>

      {/* Phone: actions pinned to the bottom of the screen */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-line bg-bg/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden">
        {actions}
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete this product?"
        message={`“${product.name || product.nameFa}” and all of its photos will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        busy={deleting}
        busyLabel="Deleting… please wait"
        error={error}
        onConfirm={remove}
        onCancel={() => {
          setConfirming(false);
          setError(null);
        }}
      />
    </div>
  );
}

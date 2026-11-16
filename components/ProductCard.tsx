import Link from "next/link";
import { photoUrl } from "@/lib/client";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ImageIcon } from "./icons";

/* eslint-disable @next/next/no-img-element */

export function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];
  const title = product.nameFa || product.name;

  return (
    <Link
      href={`/products/${encodeURIComponent(product.id)}`}
      className="card group flex min-w-0 flex-col overflow-hidden transition hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        {cover ? (
          <img
            src={photoUrl(cover)}
            alt=""
            loading="lazy"
            draggable={false}
            className="size-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted">
            <ImageIcon width={32} height={32} />
          </div>
        )}
        {product.images.length > 1 ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
            {product.images.length} photos
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 p-3">
        <p className="fa truncate text-[15px] font-semibold leading-snug" lang="fa" dir="rtl">
          {title}
        </p>
        {product.nameFa && product.name ? <p className="truncate text-sm text-muted">{product.name}</p> : null}
        <p className="mt-1.5 text-sm font-medium">
          {product.price !== null ? (
            <>
              {formatPrice(product.price)} <span className="text-xs font-normal text-muted">Toman</span>
            </>
          ) : (
            <span className="text-xs font-normal text-muted">No price</span>
          )}
        </p>
      </div>
    </Link>
  );
}

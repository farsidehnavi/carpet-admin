"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { normalizeForSearch } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ImageIcon, PlusIcon, SearchIcon, XIcon } from "./icons";
import { ProductCard } from "./ProductCard";

const PAGE = 24;

export function ProductList({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    if (!q) return products;
    return products.filter((product) =>
      normalizeForSearch(`${product.name} ${product.nameFa} ${product.description} ${product.descriptionFa}`).includes(q),
    );
  }, [products, query]);

  return (
    <div className="pb-24 sm:pb-0">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-0.5 text-sm text-muted">
            {query ? `${filtered.length} of ${products.length}` : products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="relative mb-5">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(PAGE);
            }}
            placeholder="Search by name or description…"
            aria-label="Search products"
            className="input pl-11 pr-11"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-fg"
            >
              <XIcon width={18} height={18} />
            </button>
          ) : null}
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
            <ImageIcon width={28} height={28} />
          </span>
          <h2 className="text-lg font-semibold">No products yet</h2>
          <p className="max-w-xs text-sm text-muted">Add your first product with its photos, names and description.</p>
          <Link href="/products/new" className="btn btn-primary mt-2">
            <PlusIcon width={18} height={18} /> Add product
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="card px-6 py-12 text-center text-sm text-muted">Nothing matches “{query}”.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {filtered.slice(0, visible).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {visible < filtered.length ? (
            <div className="mt-6 flex justify-center">
              <button type="button" className="btn btn-secondary" onClick={() => setVisible((v) => v + PAGE)}>
                Show more ({filtered.length - visible} left)
              </button>
            </div>
          ) : null}
        </>
      )}

      {/* Phone: floating add button */}
      <Link
        href="/products/new"
        aria-label="Add product"
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-20 grid size-14 place-items-center rounded-full bg-accent text-accent-fg shadow-card transition active:scale-95 sm:hidden"
      >
        <PlusIcon width={26} height={26} />
      </Link>
    </div>
  );
}

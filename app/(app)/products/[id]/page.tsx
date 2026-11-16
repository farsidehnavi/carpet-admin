import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/ProductView";
import { requireLogin } from "@/lib/auth";
import { getProduct } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Product" };

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireLogin();
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  return <ProductView product={product} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { requireLogin } from "@/lib/auth";
import { getProduct } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireLogin();
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  return <ProductForm product={product} />;
}

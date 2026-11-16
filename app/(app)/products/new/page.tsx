import type { Metadata } from "next";
import { ProductForm } from "@/components/ProductForm";
import { requireLogin } from "@/lib/auth";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireLogin();
  return <ProductForm />;
}

import { ProductList } from "@/components/ProductList";
import { requireLogin } from "@/lib/auth";
import { listProducts } from "@/lib/backend";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireLogin();                         // every page checks, not only the layout
  const products = await listProducts();

  // Newest first (ids grow over time).
  const numeric = products.every((product) => /^\d+$/.test(product.id));
  if (numeric) products.sort((a, b) => Number(b.id) - Number(a.id));

  return <ProductList products={products} />;
}

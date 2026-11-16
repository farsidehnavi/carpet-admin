import { guard } from "@/lib/auth";
import { fail, handleError, json, readJson } from "@/lib/api";
import { createProduct, listProducts } from "@/lib/backend";
import { parseNewProduct } from "@/lib/validate";

export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    return json({ products: await listProducts() });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;

  const parsed = parseNewProduct(await readJson(request));
  if (!parsed.ok) return fail(parsed.error);

  try {
    const id = await createProduct(parsed.value);
    return json({ id }, 201);
  } catch (error) {
    return handleError(error);
  }
}

import { guard } from "@/lib/auth";
import { fail, handleError, json, readJson, SAFE_NAME } from "@/lib/api";
import { deleteProduct, getProduct, updateProduct } from "@/lib/backend";
import { parsePatch } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const denied = await guard(request);
  if (denied) return denied;
  const { id } = await params;
  if (!SAFE_NAME.test(id)) return fail("Invalid id.", 400);

  try {
    const product = await getProduct(id);
    return product ? json({ product }) : fail("This product no longer exists.", 404);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const denied = await guard(request);
  if (denied) return denied;
  const { id } = await params;
  if (!SAFE_NAME.test(id)) return fail("Invalid id.", 400);

  const parsed = parsePatch(await readJson(request));
  if (!parsed.ok) return fail(parsed.error);

  try {
    const verified = await updateProduct(id, parsed.value);
    return json({ ok: true, verified });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const denied = await guard(request);
  if (denied) return denied;
  const { id } = await params;
  if (!SAFE_NAME.test(id)) return fail("Invalid id.", 400);

  try {
    await deleteProduct(id);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

import { guard } from "@/lib/auth";
import { fail, json, SAFE_NAME } from "@/lib/api";
import { deleteStoredImage, fetchImage } from "@/lib/backend";

type Context = { params: Promise<{ name: string }> };

/** Shows a stored photo (the browser only ever talks to this site, never to the image server). */
export async function GET(request: Request, { params }: Context) {
  const denied = await guard(request);
  if (denied) return denied;
  const { name } = await params;
  if (!SAFE_NAME.test(name)) return fail("Invalid photo name.", 400);

  try {
    const upstream = await fetchImage(name);
    if (!upstream.ok || !upstream.body) return fail("Photo not found.", 404);
    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "private, max-age=86400, immutable",     // file names are unique, so caching is safe
      },
    });
  } catch {
    return fail("The image server didn't answer.", 502);
  }
}

/** Removes a photo that was uploaded but never saved with a product. */
export async function DELETE(request: Request, { params }: Context) {
  const denied = await guard(request);
  if (denied) return denied;
  const { name } = await params;
  if (!SAFE_NAME.test(name)) return fail("Invalid photo name.", 400);

  await deleteStoredImage(name);
  return json({ ok: true });
}

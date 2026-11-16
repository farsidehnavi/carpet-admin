import { guard } from "@/lib/auth";
import { fail, handleError, json } from "@/lib/api";
import { uploadImage } from "@/lib/backend";

const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Invalid upload.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) return fail("No photo was sent.");
  if (!file.type.startsWith("image/")) return fail("Only photos can be uploaded.");
  if (file.size > MAX_BYTES) return fail("That photo is too large (15 MB maximum).", 413);

  try {
    return json({ name: await uploadImage(file) }, 201);
  } catch (error) {
    return handleError(error);
  }
}

import "server-only";
import { NextResponse } from "next/server";
import { BackendError, NotFoundError } from "./backend";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(message: string, status = 400) {
  return json({ error: message }, status);
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Turn any error into a clear JSON answer (and log it). */
export function handleError(error: unknown) {
  if (error instanceof NotFoundError) return fail("This product no longer exists.", 404);
  if (error instanceof BackendError) {
    console.error(error.message);
    return fail("Couldn't reach the product server. Please try again in a moment.", 502);
  }
  console.error(error);
  return fail("Something went wrong.", 500);
}

/** Product ids and photo names must be plain, so they can't be used to reach other URLs. */
export const SAFE_NAME = /^[\w.\-]{1,150}$/;

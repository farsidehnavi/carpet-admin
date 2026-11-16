import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { config } from "./config";

export const SESSION_COOKIE = "session";
export const SESSION_DAYS = 14;

function secret(): string {
  const value = config.sessionSecret;
  if (value.length < 16) throw new Error("SESSION_SECRET must be set (16+ characters) in .env.local");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** A signed, expiring token stored in an httpOnly cookie. */
export function createSessionToken(): string {
  const payload = `v1.${Date.now() + SESSION_DAYS * 86_400_000}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const [version, expires, signature] = parts;
  const given = Buffer.from(signature);
  const expected = Buffer.from(sign(`${version}.${expires}`));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  return Number(expires) > Date.now();
}

/** Compare passwords without leaking timing information. */
export function passwordMatches(input: string): boolean {
  const expected = config.adminPassword;
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function isLoggedIn(): Promise<boolean> {
  try {
    return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  } catch {
    return false;
  }
}

/** Call at the top of every page: sends signed-out visitors to the login page. */
export async function requireLogin(): Promise<void> {
  if (!(await isLoggedIn())) redirect("/login");
}

/** Call at the top of every API route. Returns a response to send back if the request is not allowed. */
export async function guard(request: Request): Promise<NextResponse | null> {
  if (!(await isLoggedIn())) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    // Extra protection against other websites making requests for a signed-in user.
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json({ error: "Request blocked." }, { status: 403 });
    }
  }
  return null;
}

// ---- login attempts limiter (in memory) -------------------------------------

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60_000;

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

export function allowAttempt(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

export function resetAttempts(ip: string): void {
  attempts.delete(ip);
}

export function isHttps(request: Request): boolean {
  return (
    new URL(request.url).protocol === "https:" ||
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https"
  );
}

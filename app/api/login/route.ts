import { allowAttempt, clientIp, createSessionToken, isHttps, passwordMatches, resetAttempts, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";
import { fail, json, readJson } from "@/lib/api";
import { config } from "@/lib/config";

export async function POST(request: Request) {
  if (!config.adminPassword || config.sessionSecret.length < 16) {
    return fail("The site isn't set up yet: set ADMIN_PASSWORD and SESSION_SECRET in .env.local.", 500);
  }

  const ip = clientIp(request);
  if (!allowAttempt(ip)) return fail("Too many attempts. Try again in a few minutes.", 429);

  const body = (await readJson(request)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!passwordMatches(password)) {
    await new Promise((resolve) => setTimeout(resolve, 400));   // slow down guessing
    return fail("Wrong password.", 401);
  }

  resetAttempts(ip);
  const response = json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(request),        // only over https, so logging in over plain http (e.g. on your LAN) still works
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  return response;
}

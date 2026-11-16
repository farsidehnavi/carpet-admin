/** Browser-side helper for calling this site's own API, with a timeout and friendly errors. */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Options = {
  method?: string;
  json?: unknown;
  body?: FormData;
  timeoutMs?: number;
};

export async function api<T>(url: string, options: Options = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);

  try {
    const response = await fetch(url, {
      method: options.method ?? (options.json !== undefined || options.body ? "POST" : "GET"),
      headers: options.json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
      credentials: "same-origin",
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    if (response.status === 401 && !url.startsWith("/api/login")) {
      window.location.href = "/login";
      throw new ApiError("Your session expired. Please sign in again.", 401);
    }
    if (!response.ok) throw new ApiError(data?.error ?? "The request failed.", response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === "AbortError") {
      throw new ApiError("The server took too long to respond. Please try again.", 408);
    }
    throw new ApiError("Network problem. Check your connection and try again.", 0);
  } finally {
    clearTimeout(timer);
  }
}

export const photoUrl = (name: string) => `/api/img/${encodeURIComponent(name)}`;

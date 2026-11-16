"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/client";
import { CubeIcon, EyeIcon, EyeOffIcon } from "./icons";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/login", { method: "POST", json: { password } });
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not sign in.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card w-full max-w-sm p-6 sm:p-8">
      <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent text-accent-fg">
        <CubeIcon width={26} height={26} />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Sign in to manage your catalog.</p>

      <label htmlFor="password" className="label mt-6">
        Password
      </label>
      <div className="relative">
        <input
          id="password"
          type={show ? "text" : "password"}
          className="input pr-12"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-fg"
        >
          {show ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
        </button>
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy || password.length === 0}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

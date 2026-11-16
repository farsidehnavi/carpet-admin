"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-md px-6 py-12 text-center">
      <h1 className="text-lg font-semibold">Can't reach the server</h1>
      <p className="mt-2 text-sm text-muted">The product server didn't answer. Check that it is running, then try again.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}

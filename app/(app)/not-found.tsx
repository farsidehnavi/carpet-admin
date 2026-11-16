import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md px-6 py-12 text-center">
      <h1 className="text-lg font-semibold">Product not found</h1>
      <p className="mt-2 text-sm text-muted">It may have been deleted.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to products
      </Link>
    </div>
  );
}

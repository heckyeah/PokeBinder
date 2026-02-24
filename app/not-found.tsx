import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <h1 className="text-2xl font-bold text-slate-800">Page not found</h1>
      <p className="mt-2 text-slate-600">The binder or page you’re looking for doesn’t exist.</p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Back to binders
      </Link>
    </div>
  );
}

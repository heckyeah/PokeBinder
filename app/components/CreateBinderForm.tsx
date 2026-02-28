"use client";

import { useTransition } from "react";
import { createBinder } from "../actions/binder";
import { useRouter } from "next/navigation";

const ROWS = [3, 4, 5] as const;
const COLS = [3, 4, 5] as const;
const SORT_OPTIONS = [
  { value: "national", label: "National Dex" },
  { value: "alphabetical", label: "Alphabetical" },
  { value: "kanto", label: "Kanto" },
] as const;

export function CreateBinderForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim() || undefined;
    const rows = Number(formData.get("rows"));
    const columns = Number(formData.get("columns"));
    const sortOrder = formData.get("sortOrder") as "national" | "alphabetical" | "kanto";
    if (!rows || !columns || !sortOrder) return;
    startTransition(async () => {
      const result = await createBinder({ name, rows, columns, sortOrder });
      if (result.success) {
        router.push(`/binder/${result.id}`);
      } else if (result.error === "Unauthorized") {
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname || "/")}`);
      } else {
        alert(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
          Name (optional)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. National Dex 3×3"
          className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="rows" className="mb-1 block text-sm font-medium text-slate-700">
            Rows per page
          </label>
          <select
            id="rows"
            name="rows"
            required
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ROWS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="columns" className="mb-1 block text-sm font-medium text-slate-700">
            Columns per page
          </label>
          <select
            id="columns"
            name="columns"
            required
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {COLS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sortOrder" className="mb-1 block text-sm font-medium text-slate-700">
            Sort order
          </label>
          <select
            id="sortOrder"
            name="sortOrder"
            required
            className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
      >
        {isPending ? "Creating…" : "Create binder"}
      </button>
    </form>
  );
}

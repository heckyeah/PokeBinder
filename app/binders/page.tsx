import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/auth";
import { getBinders } from "../actions/binder";
import { CreateBinderForm } from "../components/CreateBinderForm";

function BinderCard({
  b,
}: {
  b: { _id: string; name?: string | null; rows: number; columns: number; sortOrder: string; collectedIds?: number[] };
}) {
  return (
    <Link
      href={`/binder/${b._id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      <span className="font-medium">{b.name || `Binder ${b.rows}×${b.columns}`}</span>
      <span className="ml-2 text-slate-500">
        {b.rows}×{b.columns} · {b.sortOrder}
      </span>
      {Array.isArray(b.collectedIds) && (
        <span className="mt-1 block text-sm text-slate-500">{b.collectedIds.length} collected</span>
      )}
    </Link>
  );
}

export default async function MyBindersPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/binders");
  }

  const binders = await getBinders(session);
  const yourBinders = binders.filter((b) => !b.isExample);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/binders" className="text-xl font-bold hover:underline">
            Pokemon Card Binder
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Create a new binder</h2>
          <CreateBinderForm />
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold">Your binders</h2>
          {yourBinders.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              No binders yet. Create one above.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {yourBinders.map((b) => (
                <li key={b._id}>
                  <BinderCard b={b} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

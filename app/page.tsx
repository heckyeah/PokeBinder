import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/auth";
import { getBinders, getBinderById } from "./actions/binder";
import { EXAMPLE_BINDER_ID } from "@/lib/binder";
import { getOrderedPokemonList } from "@/lib/pokemon";
import type { SortOrder } from "@/lib/pokemon";
import { signOutAction } from "./actions/auth";
import { BinderGridClient } from "./binder/[id]/BinderGridClient";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; highlight?: string }>;
}) {
  const session = await getSession();
  if (session?.user?.id) {
    redirect("/binders");
  }

  const binders = await getBinders(session);
  const example = binders.find((b) => b.isExample) ?? (await getBinderById(EXAMPLE_BINDER_ID, null));
  if (!example) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }

  const rows = example.rows ?? 4;
  const columns = example.columns ?? 5;
  const slotsPerPage = rows * columns;
  const sortOrder = (example.sortOrder ?? "national") as SortOrder;
  const { page: pageParam, highlight: highlightParam } = await searchParams;
  const highlightId =
    highlightParam != null ? parseInt(highlightParam, 10) : null;
  const highlightIdValid =
    highlightId != null && !Number.isNaN(highlightId) ? highlightId : null;

  const orderedList = await getOrderedPokemonList(sortOrder);
  const totalSlots = orderedList.length;
  const totalPages = Math.ceil(totalSlots / slotsPerPage) || 1;
  const currentPage = Math.min(
    Math.max(1, parseInt(pageParam ?? "1", 10)),
    totalPages
  );
  const startIndex = (currentPage - 1) * slotsPerPage;
  const slotEntries = orderedList.slice(startIndex, startIndex + slotsPerPage);

  const authSlot = session ? (
    <>
      <Link
        href="/binders"
        className="text-sm font-medium text-slate-700 hover:underline"
      >
        My binders
      </Link>
      <span className="text-sm text-slate-500">{session.user.email}</span>
      <form action={signOutAction} className="inline">
        <button
          type="submit"
          className="rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-300"
        >
          Sign out
        </button>
      </form>
    </>
  ) : (
    <>
      <Link
        href="/login?callbackUrl=/"
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Sign in
      </Link>
      <Link
        href="/register?callbackUrl=/"
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Sign up
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <BinderGridClient
        binderId={example._id}
        binderName={example.name || "Pokedex (Example)"}
        slotEntries={slotEntries}
        collectedIds={example.collectedIds ?? []}
        slotCards={example.slotCards ?? []}
        rows={rows}
        columns={columns}
        currentPage={currentPage}
        totalPages={totalPages}
        sortOrder={sortOrder}
        highlightId={highlightIdValid}
        basePath="/"
        topSlot={authSlot}
      />
    </div>
  );
}

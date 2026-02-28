import { notFound } from "next/navigation";
import { getSession } from "@/auth";
import { getBinderById } from "@/app/actions/binder";
import { getOrderedPokemonList } from "@/lib/pokemon";
import type { SortOrder } from "@/lib/pokemon";
import { BinderGridClient } from "./BinderGridClient";

export default async function BinderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; highlight?: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  const { page: pageParam, highlight: highlightParam } = await searchParams;
  const highlightId =
    highlightParam != null ? parseInt(highlightParam, 10) : null;
  const highlightIdValid =
    highlightId != null && !Number.isNaN(highlightId) ? highlightId : null;
  const binder = await getBinderById(id, session);
  if (!binder) notFound();

  const rows = binder.rows ?? 3;
  const columns = binder.columns ?? 3;
  const slotsPerPage = rows * columns;
  const sortOrder = (binder.sortOrder ?? "national") as SortOrder;

  const orderedList = await getOrderedPokemonList(sortOrder);
  const totalSlots = orderedList.length;
  const totalPages = Math.ceil(totalSlots / slotsPerPage) || 1;
  const currentPage = Math.min(
    Math.max(1, parseInt(pageParam ?? "1", 10)),
    totalPages
  );
  const startIndex = (currentPage - 1) * slotsPerPage;
  const slotEntries = orderedList.slice(startIndex, startIndex + slotsPerPage);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <BinderGridClient
        binderId={id}
        binderName={binder.name || `Binder ${rows}×${columns}`}
        slotEntries={slotEntries}
        collectedIds={binder.collectedIds ?? []}
        slotCards={binder.slotCards ?? []}
        rows={rows}
        columns={columns}
        currentPage={currentPage}
        totalPages={totalPages}
        sortOrder={sortOrder}
        highlightId={highlightIdValid}
      />
    </div>
  );
}

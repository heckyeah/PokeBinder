"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setCollectedIds, searchInBinder, getPokemonSuggestions, type SearchResult } from "@/app/actions/binder";
import type { PokemonEntry } from "@/lib/pokemon";

function toggleIdInList(ids: number[], id: number): number[] {
  const set = new Set(ids);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return Array.from(set);
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

type Props = {
  binderId: string;
  binderName: string;
  slotEntries: PokemonEntry[];
  collectedIds: number[];
  rows: number;
  columns: number;
  currentPage: number;
  totalPages: number;
  sortOrder: string;
  highlightId?: number | null;
};

export function BinderGridClient({
  binderId,
  binderName,
  slotEntries,
  collectedIds: initialCollectedIds,
  rows,
  columns,
  currentPage,
  totalPages,
  sortOrder,
  highlightId,
}: Props) {
  const [collectedIds, setCollectedIdsState] = useState<number[]>(
    () => initialCollectedIds ?? []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null | "loading">(null);
  const [suggestions, setSuggestions] = useState<PokemonEntry[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const router = useRouter();
  const lastSavedRef = useRef<number[]>(initialCollectedIds ?? []);
  const suggestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageDropdownRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const SWIPE_THRESHOLD = 50;

  const hasUnsavedChanges = !arraysEqual(collectedIds, lastSavedRef.current);
  const showSaveButton = hasUnsavedChanges || saveStatus === "saving" || saveStatus === "saved" || saveStatus === "error";

  const collectedSet = new Set(collectedIds);

  const highlightedPosition =
    highlightId != null
      ? (() => {
          const index = slotEntries.findIndex((e) => e.id === highlightId);
          if (index < 0) return null;
          const entry = slotEntries[index];
          const row = Math.floor(index / columns) + 1;
          const column = (index % columns) + 1;
          return { name: entry.name, page: currentPage, row, column };
        })()
      : null;

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    suggestTimeoutRef.current = setTimeout(() => {
      suggestTimeoutRef.current = null;
      getPokemonSuggestions(q).then(setSuggestions).catch(() => setSuggestions([]));
    }, 200);
    return () => {
      if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pageDropdownRef.current && !pageDropdownRef.current.contains(event.target as Node)) {
        setPageDropdownOpen(false);
      }
    }
    if (pageDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [pageDropdownOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSuggestions([]);
    setSearchResult("loading");
    searchInBinder(binderId, q).then((res) => {
      if (res) {
        router.push(`/binder/${binderId}?page=${res.page}&highlight=${res.id}`, { scroll: false });
      } else {
        setSearchResult(null);
      }
    });
  }

  function pickSuggestion(name: string) {
    setSearchQuery(name);
    setSuggestions([]);
    setSearchResult("loading");
    searchInBinder(binderId, name).then((res) => {
      if (res) {
        router.push(`/binder/${binderId}?page=${res.page}&highlight=${res.id}`, { scroll: false });
      } else {
        setSearchResult(null);
      }
    });
  }

  function handleToggle(pokemonId: number) {
    setCollectedIdsState((prev) => toggleIdInList(prev, pokemonId));
    setSaveStatus("idle");
  }

  function handleSwipeEnd(clientX: number) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const delta = clientX - start;
    if (delta < -SWIPE_THRESHOLD && currentPage < totalPages) {
      router.push(`/binder/${binderId}?page=${currentPage + 1}`, { scroll: false });
    } else if (delta > SWIPE_THRESHOLD && currentPage > 1) {
      router.push(`/binder/${binderId}?page=${currentPage - 1}`, { scroll: false });
    }
  }

  async function handleSave() {
    setSaveStatus("saving");
    const result = await setCollectedIds(binderId, collectedIds);
    if (result.success) {
      lastSavedRef.current = [...collectedIds];
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("error");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white py-3 shadow-sm">
        <div className="flex flex-row items-center justify-between gap-2 px-4 md:gap-4 md:px-6">
          <h1 className="min-w-0 max-w-[28%] shrink truncate text-base font-bold md:max-w-none md:text-lg">{binderName}</h1>
          <div className="relative flex min-w-0 flex-1 max-w-md justify-center">
            <form onSubmit={handleSearch} className="flex w-full rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <div className="relative min-w-0 flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Pokemon…"
                  autoComplete="off"
                  className="w-full border-0 bg-transparent px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
                {suggestions.length > 0 &&
                  !suggestions.some(
                    (s) => s.name.toLowerCase() === searchQuery.trim().toLowerCase()
                  ) && (
                  <ul className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-auto rounded border border-slate-200 bg-white py-1 shadow-lg">
                    {suggestions.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => pickSuggestion(p.name)}
                          className="w-full px-3 py-1.5 text-left text-sm capitalize text-slate-800 hover:bg-slate-100"
                        >
                          {p.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="submit"
                aria-label="Search"
                className="shrink-0 border-l border-slate-300 bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </form>
          </div>
          <a
            href="/"
            onClick={(e) => {
              if (hasUnsavedChanges) {
                e.preventDefault();
                if (window.confirm("You have unsaved changes. Leave anyway?")) {
                  router.push("/");
                }
              }
            }}
            className="shrink-0 whitespace-nowrap text-xs font-medium text-blue-600 hover:underline md:text-sm"
          >
            ← Back
          </a>
        </div>
        {searchResult === null && searchQuery.trim() && (
          <p className="mt-2 text-center text-sm text-amber-600">No Pokemon found for &quot;{searchQuery}&quot;</p>
        )}
        {highlightedPosition && (
          <p className="mt-2 text-center text-sm text-slate-600">
            <span className="font-medium capitalize">{highlightedPosition.name}</span>
            {" is on Page "}
            <span className="font-medium">{highlightedPosition.page}</span>
            {", Row "}
            <span className="font-medium">{highlightedPosition.row}</span>
            {", Column "}
            <span className="font-medium">{highlightedPosition.column}</span>
          </p>
        )}
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">
      <section className="flex items-center justify-center gap-3">
        <Link
          href={currentPage > 1 ? `/binder/${binderId}?page=${currentPage - 1}` : "#"}
          scroll={false}
          className={`rounded px-4 py-2 font-medium ${
            currentPage > 1
              ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
              : "cursor-not-allowed bg-slate-100 text-slate-400"
          }`}
          aria-disabled={currentPage <= 1}
        >
          Previous
        </Link>
        <div className="relative" ref={pageDropdownRef}>
          <button
            type="button"
            onClick={() => setPageDropdownOpen((open) => !open)}
            className="rounded px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-800"
            aria-expanded={pageDropdownOpen}
            aria-haspopup="listbox"
          >
            Page {currentPage} of {totalPages} ▾
          </button>
          {pageDropdownOpen && (
            <ul
              className="absolute left-1/2 top-full z-20 mt-1 grid w-32 -translate-x-1/2 grid-cols-3 gap-0.5 overflow-auto rounded border border-slate-200 bg-white p-1.5 shadow-lg max-h-56"
              role="listbox"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <li key={page} role="option" aria-selected={page === currentPage}>
                  <Link
                    href={`/binder/${binderId}?page=${page}`}
                    scroll={false}
                    onClick={() => setPageDropdownOpen(false)}
                    className={`block rounded px-2 py-1.5 text-center text-sm ${
                      page === currentPage
                        ? "bg-blue-100 font-medium text-blue-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link
          href={
            currentPage < totalPages
              ? `/binder/${binderId}?page=${currentPage + 1}`
              : "#"
          }
          scroll={false}
          className={`rounded px-4 py-2 font-medium ${
            currentPage < totalPages
              ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
              : "cursor-not-allowed bg-slate-100 text-slate-400"
          }`}
          aria-disabled={currentPage >= totalPages}
        >
          Next
        </Link>
      </section>

      <section
        className="grid gap-3 touch-pan-y"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, auto)`,
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (e.changedTouches[0]) handleSwipeEnd(e.changedTouches[0].clientX);
        }}
      >
        {slotEntries.map((entry) => {
          const collected = collectedSet.has(entry.id);
          const isHighlighted = highlightId != null && entry.id === highlightId;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleToggle(entry.id)}
              className={`flex flex-col items-center rounded-lg p-1 text-left transition ${
                collected
                  ? "bg-green-100 ring-2 ring-green-500"
                  : isHighlighted
                    ? "ring-2 ring-yellow-500 bg-yellow-50/80"
                    : "bg-white hover:bg-slate-50"
              }`}
            >
              <img
                src={`${SPRITE_BASE}/${entry.id}.png`}
                alt={entry.name}
                className="h-14 w-14 object-contain"
              />
              <span className="mt-1 truncate w-full text-center text-xs font-medium capitalize text-slate-700">
                {entry.name}
              </span>
              <span className="mt-0.5 text-xs text-slate-500">
                {collected ? "✓ Have it" : "Have it"}
              </span>
            </button>
          );
        })}
      </section>

      {showSaveButton && (
        <div className="fixed bottom-6 right-6 z-10 flex items-center gap-2">
          {saveStatus === "saved" && (
            <span className="text-sm text-green-600">Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-red-600">Save failed</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saveStatus === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      )}
      </main>
    </>
  );
}

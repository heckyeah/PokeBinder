"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTCGSetsForPokemon,
  getTCGCardsForSlot,
  getTCGCardInLanguage,
  type TCGCardItem,
  type TCGSetItem,
  type GetTCGCardsResult,
  type GetTCGSetsResult,
} from "@/app/actions/binder";
import { TCGDEX_LANGUAGES } from "@/lib/tcgdex";
import type { PokemonEntry } from "@/lib/pokemon";

type Props = {
  open: boolean;
  onClose: () => void;
  pokemonEntry: PokemonEntry;
  binderId: string;
  currentTcgCardId?: string | null;
  onCardSelected: (tcgCardId: string | null, imageUrl?: string, language?: string) => void;
};

/** Step after clicking a card: pick language for that card. */
type LanguageStep = { card: TCGCardItem } | null;

const PAGE_SIZE = 24;

/** Cache TCG card results by pokemonId, setId, page, and optional card search (all mode). */
const cardCache = new Map<string, GetTCGCardsResult>();
function cardCacheKey(
  pokemonId: number,
  setId: string | null,
  page: number,
  cardSearch?: string
) {
  const search = (cardSearch ?? "").trim().toLowerCase();
  return `${pokemonId}:${setId ?? "all"}:${page}:${search}`;
}

/** Cache sets list per Pokemon name (only sets that contain that Pokemon). */
const setsCacheByPokemon = new Map<string, GetTCGSetsResult>();

/** Extract 4-digit year from release date string (e.g. "31st March, 2023" -> "2023"). */
function yearFromReleaseDate(releaseDate: string | null | undefined): string | null {
  if (!releaseDate || !releaseDate.trim()) return null;
  const match = releaseDate.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
}

/** Group sets by year, years sorted descending (newest first). */
function groupSetsByYear(sets: TCGSetItem[]): { year: string; sets: TCGSetItem[] }[] {
  const byYear = new Map<string, TCGSetItem[]>();
  for (const setItem of sets) {
    const year = yearFromReleaseDate(setItem.releaseDate ?? null) ?? "Unknown";
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(setItem);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => {
    if (a === "Unknown") return 1;
    if (b === "Unknown") return -1;
    return Number(b) - Number(a);
  });
  return years.map((year) => ({ year, sets: byYear.get(year)! }));
}

export function CardPickerModal({
  open,
  onClose,
  pokemonEntry,
  binderId,
  currentTcgCardId,
  onCardSelected,
}: Props) {
  const [viewMode, setViewMode] = useState<"category" | "all">("category");
  const [step, setStep] = useState<"set" | "cards">("set");
  const [setSearchQuery, setSetSearchQuery] = useState("");
  const [selectedSet, setSelectedSet] = useState<TCGSetItem | null>(null);
  const [setsResult, setSetsResult] = useState<GetTCGSetsResult | null>(null);
  const [setsLoading, setSetsLoading] = useState(false);
  const [result, setResult] = useState<GetTCGCardsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [languageStep, setLanguageStep] = useState<LanguageStep>(null);
  const [languageLoading, setLanguageLoading] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [cardsSearchQuery, setCardsSearchQuery] = useState("");

  const fetchSets = useCallback(async () => {
    if (!open || !pokemonEntry?.name) return;
    const cacheKey = pokemonEntry.name.trim().toLowerCase();
    const cached = setsCacheByPokemon.get(cacheKey);
    if (cached) {
      setSetsResult(cached);
      setSetsLoading(false);
      return;
    }
    setSetsLoading(true);
    setError(null);
    try {
      const data = await getTCGSetsForPokemon(pokemonEntry.name);
      setsCacheByPokemon.set(cacheKey, data);
      setSetsResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sets");
      setSetsResult(null);
    } finally {
      setSetsLoading(false);
    }
  }, [open, pokemonEntry?.name]);

  const fetchCards = useCallback(
    async (pageNum: number) => {
      if (!open || !pokemonEntry) return;
      const setId = viewMode === "category" ? selectedSet?.id ?? null : null;
      const cardSearch = viewMode === "all" ? cardsSearchQuery : undefined;
      const key = cardCacheKey(pokemonEntry.id, setId, pageNum, cardSearch);
      const cached = cardCache.get(key);
      if (cached) {
        setResult(cached);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getTCGCardsForSlot(
          pokemonEntry.name,
          pokemonEntry.id,
          pageNum,
          PAGE_SIZE,
          setId,
          viewMode === "all" ? cardsSearchQuery || undefined : undefined
        );
        cardCache.set(key, data);
        setResult(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load cards");
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [open, pokemonEntry, viewMode, selectedSet?.id, cardsSearchQuery]
  );

  useEffect(() => {
    if (open) {
      setViewMode("category");
      setStep("set");
      setSetSearchQuery("");
      setSelectedSet(null);
      setPage(1);
      setResult(null);
      setError(null);
      setLanguageStep(null);
      setLanguageError(null);
      setCardsSearchQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (open && step === "set" && viewMode === "category") {
      fetchSets();
    }
  }, [open, step, viewMode, fetchSets]);

  useEffect(() => {
    if (open && pokemonEntry && step === "cards") {
      if (viewMode === "all" || selectedSet) {
        fetchCards(page);
      }
    }
  }, [open, pokemonEntry?.id, step, viewMode, selectedSet?.id, page, cardsSearchQuery, fetchCards]);

  function handleChooseSet(setItem: TCGSetItem) {
    setSelectedSet(setItem);
    setStep("cards");
    setPage(1);
    setResult(null);
    setError(null);
  }

  function handleChangeSet() {
    setStep("set");
    setSelectedSet(null);
    setResult(null);
    setPage(1);
  }

  function handleViewModeChange(mode: "category" | "all") {
    setViewMode(mode);
    if (mode === "all") {
      setStep("cards");
      setSelectedSet(null);
      setPage(1);
      setResult(null);
      setError(null);
    } else {
      setStep("set");
      setSelectedSet(null);
      setPage(1);
      setResult(null);
      setError(null);
    }
  }

  function handleSelectCard(card: TCGCardItem) {
    setLanguageStep({ card });
    setLanguageError(null);
  }

  function handleCancelLanguageStep() {
    setLanguageStep(null);
    setLanguageError(null);
  }

  async function handleChooseLanguage(card: TCGCardItem, langCode: string) {
    setLanguageLoading(true);
    setLanguageError(null);
    try {
      const { imageUrl } = await getTCGCardInLanguage(card.id, langCode);
      onCardSelected(card.id, imageUrl, langCode);
      setLanguageStep(null);
      onClose();
    } catch (e) {
      setLanguageError(e instanceof Error ? e.message : "Failed to load card in this language");
    } finally {
      setLanguageLoading(false);
    }
  }

  function handleClearSelection() {
    onCardSelected(null);
    onClose();
  }

  if (!open) return null;

  const totalPages = result ? Math.ceil(result.totalCount / PAGE_SIZE) || 1 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-picker-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 id="card-picker-title" className="text-lg font-semibold capitalize text-slate-800">
            {step === "set"
              ? `Choose a set for ${pokemonEntry.name}`
              : viewMode === "all"
                ? `All cards for ${pokemonEntry.name}`
                : selectedSet?.name ?? "Cards"}
          </h2>
          <div className="flex items-center gap-1">
            {step === "cards" && viewMode === "category" && selectedSet && (
              <button
                type="button"
                onClick={handleChangeSet}
                className="rounded px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              >
                Change set
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex shrink-0 border-b border-slate-100 px-4 py-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "category"}
              onClick={() => handleViewModeChange("category")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                viewMode === "category"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              By set
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "all"}
              onClick={() => handleViewModeChange("all")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                viewMode === "all"
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              All cards
            </button>
          </div>
        </div>

        {step === "cards" && currentTcgCardId && (
          <div className="shrink-0 border-b border-slate-100 px-4 py-2">
            <button
              type="button"
              onClick={handleClearSelection}
              disabled={false}
              className="text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-50"
            >
              Clear selection
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {step === "set" && (
            <>
              {setsResult && setsResult.data.length > 0 && (
                <div className="sticky top-0 z-10 -mx-4 mb-3 bg-white px-4 py-2">
                  <input
                    type="search"
                    value={setSearchQuery}
                    onChange={(e) => setSetSearchQuery(e.target.value)}
                    placeholder="Search set names…"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Search set names"
                  />
                </div>
              )}
              {setsLoading && !setsResult && (
                <div className="flex items-center justify-center py-12 text-slate-500">Loading sets…</div>
              )}
              {error && step === "set" && (
                <div className="py-4 text-center text-sm text-red-600">{error}</div>
              )}
              {setsResult && setsResult.data.length > 0 && (() => {
                const q = setSearchQuery.trim().toLowerCase();
                const filtered = q
                  ? setsResult.data.filter(
                      (s) =>
                        s.name.toLowerCase().includes(q) ||
                        (s.setCode && s.setCode.toLowerCase().includes(q))
                    )
                  : setsResult.data;
                const grouped = groupSetsByYear(filtered);
                return grouped.length > 0 ? (
                <div className="space-y-4">
                  {grouped.map(({ year, sets: yearSets }) => (
                    <section key={year}>
                      <h3 className="sticky top-0 z-10 mb-2 bg-white py-1 text-sm font-semibold text-slate-700">
                        {year}
                      </h3>
                      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {yearSets.map((setItem) => (
                          <li key={setItem.id}>
                            <button
                              type="button"
                              onClick={() => handleChooseSet(setItem)}
                              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              <span className="font-medium text-slate-800">{setItem.name}</span>
                              {setItem.setCode && (
                                <span className="ml-2 text-slate-500">({setItem.setCode})</span>
                              )}
                              {setItem.releaseDate && (
                                <span className="block text-xs text-slate-400">
                                  {setItem.releaseDate}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
                ) : (
                  <p className="py-8 text-center text-sm text-slate-500">No sets match &quot;{setSearchQuery.trim()}&quot;</p>
                );
              })()}
            </>
          )}

          {step === "cards" && (
            <>
              {viewMode === "all" && !languageStep && (
                <div className="sticky top-0 z-10 -mx-4 mb-3 bg-white px-4 py-2">
                  <input
                    type="search"
                    value={cardsSearchQuery}
                    onChange={(e) => {
                      setCardsSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search card names…"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Search card names"
                  />
                </div>
              )}
              {loading && !result && (
                <div className="flex items-center justify-center py-12 text-slate-500">Loading cards…</div>
              )}
              {error && step === "cards" && (
                <div className="py-4 text-center text-sm text-red-600">{error}</div>
              )}
              {step === "cards" && result && result.data.length === 0 && !loading && (
                <div className="py-8 text-center text-slate-500">
                  {viewMode === "all"
                    ? cardsSearchQuery.trim()
                      ? `No cards match "${cardsSearchQuery.trim()}".`
                      : `No cards found for ${pokemonEntry.name}.`
                    : `No cards found for this Pokemon in ${selectedSet?.name}.`}
                </div>
              )}
              {step === "cards" && languageStep && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-800">
                    Choose language for this card
                  </p>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex shrink-0 flex-col items-center rounded-lg border border-slate-200 bg-slate-50 p-2">
                      {(languageStep.card.images.small || languageStep.card.images.large) ? (
                        <img
                          src={languageStep.card.images.small || languageStep.card.images.large}
                          alt={languageStep.card.name}
                          className="h-20 w-auto object-contain"
                        />
                      ) : (
                        <div className="flex h-20 w-16 items-center justify-center rounded bg-slate-200 text-xs text-slate-500">
                          No image
                        </div>
                      )}
                      <span className="mt-1 max-w-[100px] truncate text-center text-xs text-slate-700">
                        {languageStep.card.name}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        {TCGDEX_LANGUAGES.map(({ code, label }) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => handleChooseLanguage(languageStep.card, code)}
                            disabled={languageLoading}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {languageError && (
                        <p className="mt-2 text-sm text-red-600">{languageError}</p>
                      )}
                      <button
                        type="button"
                        onClick={handleCancelLanguageStep}
                        disabled={languageLoading}
                        className="mt-3 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
          {step === "cards" && !languageStep && result && result.data.length > 0 && (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {result.data.map((card) => (
                    <li key={card.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectCard(card)}
                        disabled={false}
                        className={`flex w-full flex-col items-center rounded-lg border-2 p-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                          currentTcgCardId === card.id
                            ? "border-green-500 bg-green-50"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {card.releaseDate && (
                          <span className="mb-1 w-full truncate text-center text-[10px] text-slate-500" title={card.releaseDate}>
                            {card.releaseDate}
                          </span>
                        )}
                        {(card.images.small || card.images.large) ? (
                          <img
                            src={card.images.small || card.images.large}
                            alt={card.name}
                            className="h-24 w-auto object-contain"
                          />
                        ) : (
                          <div className="flex h-24 w-16 items-center justify-center rounded bg-slate-200 text-[10px] text-slate-500">
                            No image
                          </div>
                        )}
                        <span className="mt-1 truncate w-full text-center text-xs text-slate-700">
                          {card.name}
                        </span>
                        {card.set.name && (
                          <span className="truncate w-full text-center text-xs text-slate-500">
                            {card.set.name}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {step === "cards" && !languageStep && result && totalPages > 1 && (
          <div className="flex shrink-0 items-center justify-center gap-2 border-t border-slate-200 px-4 py-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="rounded px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

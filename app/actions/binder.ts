"use server";

import type { Session } from "next-auth";
import { getSession } from "@/auth";
import { sanityClient, sanityClientWithToken } from "@/lib/sanity/client";
import {
  binderByIdQuery,
  bindersByOwnerIdQuery,
  exampleBindersQuery,
} from "@/lib/sanity/queries";
import { EXAMPLE_BINDER_ID } from "@/lib/binder";
import { getPokemonNameSuggestions, searchPokemonInBinder } from "@/lib/pokemon";
import type { SortOrder } from "@/lib/pokemon";

export interface SlotCardAssignment {
  pokemonId: number;
  tcgCardId: string;
  imageUrl?: string;
  language?: string;
}

export interface BinderDoc {
  _id: string;
  name?: string | null;
  rows: number;
  columns: number;
  sortOrder: string;
  collectedIds: number[];
  slotCards?: SlotCardAssignment[] | null;
  ownerId?: string | null;
  isExample?: boolean;
  _createdAt?: string;
}

async function ensureExampleBinder(): Promise<BinderDoc | null> {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) return null;
  try {
    await sanityClientWithToken.createOrReplace({
      _type: "binder",
      _id: EXAMPLE_BINDER_ID,
      name: "Pokedex (Example)",
      rows: 4,
      columns: 5,
      sortOrder: "national",
      collectedIds: [],
      slotCards: [],
      isExample: true,
      // no ownerId – shared for everyone
    });
    return {
      _id: EXAMPLE_BINDER_ID,
      name: "Pokedex (Example)",
      rows: 4,
      columns: 5,
      sortOrder: "national",
      collectedIds: [],
      slotCards: [],
      isExample: true,
    };
  } catch {
    return null;
  }
}

export async function getBinders(session: Session | null): Promise<BinderDoc[]> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "placeholder") {
    return [];
  }
  try {
    let examples = await sanityClient.fetch<BinderDoc[]>(exampleBindersQuery);
    if (!examples?.length) {
      const created = await ensureExampleBinder();
      if (created) examples = [created];
    }
    const owned =
      session?.user?.id
        ? await sanityClient.fetch<BinderDoc[]>(bindersByOwnerIdQuery, { ownerId: session.user.id })
        : [];
    const byId = new Map<string, BinderDoc>();
    for (const b of examples ?? []) byId.set(b._id, b);
    for (const b of owned ?? []) byId.set(b._id, b);
    return Array.from(byId.values()).sort(
      (a, b) => (b._createdAt ?? "").localeCompare(a._createdAt ?? "")
    );
  } catch {
    return [];
  }
}

export async function getBinderById(id: string, session: Session | null): Promise<BinderDoc | null> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "placeholder") {
    return null;
  }
  try {
    const doc = await sanityClient.fetch<BinderDoc | null>(binderByIdQuery, { id });
    if (!doc) return null;
    if (doc.isExample) return doc;
    if (session?.user?.id && doc.ownerId === session.user.id) return doc;
    return null;
  } catch {
    return null;
  }
}

export async function createBinder(attrs: {
  name?: string;
  rows: number;
  columns: number;
  sortOrder: SortOrder;
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    return { success: false, error: "SANITY_API_WRITE_TOKEN is not set" };
  }
  const id = `binder-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  try {
    await sanityClientWithToken.createOrReplace({
      _type: "binder",
      _id: id,
      name: attrs.name ?? undefined,
      rows: attrs.rows,
      columns: attrs.columns,
      sortOrder: attrs.sortOrder,
      collectedIds: [],
      slotCards: [],
      ownerId: session.user.id,
      isExample: false,
    });
    return { success: true, id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create binder";
    return { success: false, error: message };
  }
}

export async function setCollectedIds(
  binderId: string,
  collectedIds: number[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    return { success: false, error: "SANITY_API_WRITE_TOKEN is not set" };
  }
  try {
    const binder = await getBinderById(binderId, session);
    if (!binder) return { success: false, error: "Forbidden" };
    if (!binder.isExample && (!session?.user?.id || binder.ownerId !== session.user.id)) {
      return { success: false, error: "Forbidden" };
    }
    await sanityClientWithToken.patch(binderId).set({ collectedIds }).commit();
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save";
    return { success: false, error: message };
  }
}

export type SearchResult = {
  page: number;
  row: number;
  column: number;
  id: number;
  name: string;
};

export async function searchInBinder(
  binderId: string,
  query: string
): Promise<SearchResult | null> {
  const session = await getSession();
  const binder = await getBinderById(binderId, session);
  if (!binder) return null;
  return searchPokemonInBinder(
    query,
    binder.sortOrder as SortOrder,
    binder.rows ?? 3,
    binder.columns ?? 3
  );
}

export async function getPokemonSuggestions(query: string) {
  return getPokemonNameSuggestions(query, 10);
}

export async function setSlotCard(
  binderId: string,
  pokemonId: number,
  tcgCardId: string | null,
  imageUrl?: string,
  language?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    return { success: false, error: "SANITY_API_WRITE_TOKEN is not set" };
  }
  try {
    const binder = await getBinderById(binderId, session);
    if (!binder) return { success: false, error: "Forbidden" };
    if (!binder.isExample && (!session?.user?.id || binder.ownerId !== session.user.id)) {
      return { success: false, error: "Forbidden" };
    }
    const current = binder.slotCards ?? [];
    const rest = current.filter((s) => s.pokemonId !== pokemonId);
    const next =
      tcgCardId == null
        ? rest.map((s) => ({ ...s, _key: (s as { _key?: string })._key ?? `slot-${s.pokemonId}` }))
        : [...rest.map((s) => ({ ...s, _key: (s as { _key?: string })._key ?? `slot-${s.pokemonId}` })), { _key: `slot-${pokemonId}`, pokemonId, tcgCardId, imageUrl: imageUrl ?? undefined, language: language ?? undefined }];
    await sanityClientWithToken.patch(binderId).set({ slotCards: next }).commit();
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save";
    return { success: false, error: message };
  }
}

export async function setSlotCards(
  binderId: string,
  slotCards: SlotCardAssignment[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    return { success: false, error: "SANITY_API_WRITE_TOKEN is not set" };
  }
  try {
    const binder = await getBinderById(binderId, session);
    if (!binder) return { success: false, error: "Forbidden" };
    if (!binder.isExample && (!session?.user?.id || binder.ownerId !== session.user.id)) {
      return { success: false, error: "Forbidden" };
    }
    const slotCardsWithKeys = slotCards.map((item) => ({
      _key: `slot-${item.pokemonId}`,
      pokemonId: item.pokemonId,
      tcgCardId: item.tcgCardId,
      imageUrl: item.imageUrl,
      language: item.language,
    }));
    await sanityClientWithToken.patch(binderId).set({ slotCards: slotCardsWithKeys }).commit();
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save";
    return { success: false, error: message };
  }
}

/** TCGdex API – no API key required. https://tcgdex.dev */
const TCGDEX_BASE = "https://api.tcgdex.net/v2";
const TCGDEX_LANG = "en";

/** Cache for "All cards" full list per Pokemon name so pagination has correct total. */
const allCardsCache = new Map<string, TCGCardItem[]>();

/** Build TCGdex card image URLs with quality and extension. See https://tcgdex.dev/assets */
function tcgdexImageUrls(baseUrl: string): { small: string; large: string } {
  if (!baseUrl?.trim()) return { small: "", large: "" };
  const base = baseUrl.replace(/\/+$/, "");
  return {
    small: `${base}/low.webp`,
    large: `${base}/high.webp`,
  };
}

export interface TCGCardItem {
  id: string;
  name: string;
  images: { small: string; large: string };
  set: { name: string };
  language?: string | null;
  releaseDate?: string | null;
}

export interface GetTCGCardsResult {
  data: TCGCardItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface TCGSetItem {
  id: string;
  name: string;
  setCode?: string | null;
  releaseDate?: string | null;
  language?: string | null;
}

export interface GetTCGSetsResult {
  data: TCGSetItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function getTCGSets(): Promise<GetTCGSetsResult> {
  const url = `${TCGDEX_BASE}/${TCGDEX_LANG}/sets?sort:field=releaseDate&sort:order=DESC`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`TCGdex API error: ${res.status}`);
  }
  const raw = await res.json();
  const list = Array.isArray(raw) ? raw : [];
  const data = list.map(
    (s: { id: string; name: string; releaseDate?: string | null }) => ({
      id: s.id,
      name: s.name,
      setCode: s.id,
      releaseDate: s.releaseDate ?? null,
      language: TCGDEX_LANG,
    })
  );
  return {
    data,
    totalCount: data.length,
    page: 1,
    pageSize: data.length,
  };
}

/** Extract set ID from TCGdex card id (e.g. "base1-58" -> "base1", "swsh12.5-GG30" -> "swsh12.5"). */
function setIdFromCardId(cardId: string): string {
  const lastDash = cardId.lastIndexOf("-");
  return lastDash === -1 ? cardId : cardId.slice(0, lastDash);
}

/** Fetch sets that contain at least one card matching the given Pokemon name. */
export async function getTCGSetsForPokemon(
  pokemonName: string
): Promise<GetTCGSetsResult> {
  const name = pokemonName.trim();
  if (!name) return { data: [], totalCount: 0, page: 1, pageSize: 0 };

  const setIds = new Set<string>();
  const pageSize = 100;
  let page = 1;
  const maxPages = 5;

  while (page <= maxPages) {
    const url = `${TCGDEX_BASE}/${TCGDEX_LANG}/cards?name=${encodeURIComponent(name)}&pagination:page=${page}&pagination:itemsPerPage=${pageSize}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`TCGdex API error: ${res.status}`);
    const list = await res.json();
    const cards = Array.isArray(list) ? list : [];
    if (cards.length === 0) break;
    for (const c of cards) {
      if (c?.id && typeof c.id === "string") setIds.add(setIdFromCardId(c.id));
    }
    if (cards.length < pageSize) break;
    page += 1;
  }

  if (setIds.size === 0) {
    return { data: [], totalCount: 0, page: 1, pageSize: 0 };
  }

  const allSets = await getTCGSets();
  const data = allSets.data.filter((s) => setIds.has(s.id));
  return {
    data,
    totalCount: data.length,
    page: 1,
    pageSize: data.length,
  };
}

export async function getTCGCardsForSlot(
  pokemonName: string,
  _pokemonId: number,
  page = 1,
  pageSize = 24,
  setId?: string | null,
  cardSearchQuery?: string | null
): Promise<GetTCGCardsResult> {
  const name = pokemonName.trim();
  if (!name) {
    return { data: [], totalCount: 0, page: 1, pageSize };
  }
  const nameLower = name.toLowerCase();

  if (!setId || !setId.trim()) {
    const cacheKey = nameLower;
    let fullList = allCardsCache.get(cacheKey);
    if (fullList === undefined) {
      fullList = [];
      const fetchPageSize = 100;
      const maxPages = 50;
      let p = 1;
      while (p <= maxPages) {
        const url = `${TCGDEX_BASE}/${TCGDEX_LANG}/cards?name=${encodeURIComponent(name)}&pagination:page=${p}&pagination:itemsPerPage=${fetchPageSize}`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error(`TCGdex API error: ${res.status}`);
        const results = await res.json();
        const list = Array.isArray(results) ? results : [];
        for (const c of list) {
          fullList.push({
            id: c.id,
            name: c.name ?? "",
            images: tcgdexImageUrls(c.image ?? ""),
            set: { name: "" },
            language: TCGDEX_LANG,
            releaseDate: null,
          });
        }
        if (list.length < fetchPageSize) break;
        p += 1;
      }
      allCardsCache.set(cacheKey, fullList);
    }
    const query = cardSearchQuery?.trim().toLowerCase() ?? "";
    const filtered = query
      ? fullList.filter((c) => c.name.toLowerCase().includes(query))
      : fullList;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);
    return {
      data,
      totalCount: filtered.length,
      page,
      pageSize,
    };
  }

  const setUrl = `${TCGDEX_BASE}/${TCGDEX_LANG}/sets/${encodeURIComponent(setId.trim())}`;
  const setRes = await fetch(setUrl, { next: { revalidate: 3600 } });
  if (!setRes.ok) {
    if (setRes.status === 404) return { data: [], totalCount: 0, page: 1, pageSize };
    throw new Error(`TCGdex API error: ${setRes.status}`);
  }
  const setJson = await setRes.json();
  const setCards: { id: string; name: string; image?: string }[] = setJson.cards ?? [];
  const setName = setJson.name ?? "";
  const setReleaseDate = setJson.releaseDate ?? null;
  const allMatches = setCards.filter((c) => (c.name ?? "").toLowerCase().includes(nameLower));
  const start = (page - 1) * pageSize;
  const pageData = allMatches.slice(start, start + pageSize);
  const data = pageData.map((c) => ({
    id: c.id,
    name: c.name ?? "",
    images: tcgdexImageUrls(c.image ?? ""),
    set: { name: setName },
    language: TCGDEX_LANG,
    releaseDate: setReleaseDate,
  }));
  return {
    data,
    totalCount: allMatches.length,
    page,
    pageSize,
  };
}

/** Fetch a single card in the given language; returns image URL (high quality) for that language. Falls back to English if the card is not available in the requested language. */
export async function getTCGCardInLanguage(
  cardId: string,
  lang: string
): Promise<{ imageUrl: string; name: string }> {
  const langNorm = lang?.trim().toLowerCase() || "en";
  const url = `${TCGDEX_BASE}/${langNorm}/cards/${encodeURIComponent(cardId)}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok && res.status === 404 && langNorm !== "en") {
    return getTCGCardInLanguage(cardId, "en");
  }
  if (!res.ok) throw new Error(`TCGdex API error: ${res.status}`);
  const card = await res.json();
  const baseImage = card?.image ?? "";
  const urls = tcgdexImageUrls(baseImage);
  return {
    imageUrl: urls.large || urls.small,
    name: card?.name ?? "",
  };
}

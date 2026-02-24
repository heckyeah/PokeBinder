const POKEAPI_BASE = "https://pokeapi.co/api/v2";

export type SortOrder = "national" | "alphabetical" | "kanto";

export interface PokemonEntry {
  id: number;
  name: string;
}

interface PokeApiPokedexEntry {
  entry_number: number;
  pokemon_species: { name: string; url: string };
}

interface PokeApiPokedexResponse {
  pokemon_entries: PokeApiPokedexEntry[];
}

function extractIdFromSpeciesUrl(url: string): number {
  const match = url.match(/\/pokemon-species\/(\d+)\//);
  return match ? parseInt(match[1], 10) : 0;
}

async function fetchPokedex(pokedexId: number): Promise<PokemonEntry[]> {
  const res = await fetch(`${POKEAPI_BASE}/pokedex/${pokedexId}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`PokeAPI pokedex ${pokedexId} failed: ${res.status}`);
  const data: PokeApiPokedexResponse = await res.json();
  return data.pokemon_entries.map((e) => ({
    id: e.entry_number,
    name: e.pokemon_species.name,
  }));
}

const pokedexIdForSortOrder: Record<string, number> = {
  national: 1,
  kanto: 2,
  alphabetical: 1,
};

/**
 * Returns ordered list of Pokemon for the given sort order.
 * Uses National Dex (1) or Kanto (2); alphabetical sorts by name.
 */
export async function getOrderedPokemonList(
  sortOrder: SortOrder
): Promise<PokemonEntry[]> {
  const pokedexId = pokedexIdForSortOrder[sortOrder] ?? 1;
  const list = await fetchPokedex(pokedexId);
  if (sortOrder === "alphabetical") {
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "en"));
  }
  return list;
}

/**
 * Return Pokemon names that match the query (case-insensitive, contains or starts with).
 * Used for search suggestions.
 */
export async function getPokemonNameSuggestions(
  query: string,
  limit = 10
): Promise<PokemonEntry[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const list = await getOrderedPokemonList("national");
  const matches = list.filter((p) => p.name.toLowerCase().includes(q));
  return matches.slice(0, limit);
}

/**
 * Resolve a Pokemon name (or partial name) to its National Dex id.
 * Uses the National Dex list and finds first match (case-insensitive).
 */
export async function resolveNameToId(name: string): Promise<number | null> {
  if (!name.trim()) return null;
  const list = await getOrderedPokemonList("national");
  const normalized = name.trim().toLowerCase();
  const found = list.find((p) => p.name.toLowerCase() === normalized);
  if (found) return found.id;
  const partial = list.find((p) => p.name.toLowerCase().startsWith(normalized));
  return partial ? partial.id : null;
}

/**
 * Slot math: 0-based slot index -> page (1-based), row (1-based), column (1-based).
 * Fill is left-to-right.
 */
export function slotToPosition(
  slotIndex: number,
  rows: number,
  columns: number
): { page: number; row: number; column: number } {
  const slotsPerPage = rows * columns;
  const page = Math.floor(slotIndex / slotsPerPage) + 1;
  const j = slotIndex % slotsPerPage;
  const row = Math.floor(j / columns) + 1;
  const column = (j % columns) + 1;
  return { page, row, column };
}

/**
 * Given an ordered list and a Pokemon id, return slot index (0-based) or -1 if not found.
 */
export function idToSlotIndex(orderedList: PokemonEntry[], pokemonId: number): number {
  const idx = orderedList.findIndex((p) => p.id === pokemonId);
  return idx;
}

/**
 * Search: resolve name to id, get index in binder's order, return page/row/column.
 */
export async function searchPokemonInBinder(
  name: string,
  sortOrder: SortOrder,
  rows: number,
  columns: number
): Promise<{ page: number; row: number; column: number; id: number; name: string } | null> {
  const id = await resolveNameToId(name);
  if (id === null) return null;
  const list = await getOrderedPokemonList(sortOrder);
  const slotIndex = idToSlotIndex(list, id);
  if (slotIndex < 0) return null;
  const { page, row, column } = slotToPosition(slotIndex, rows, columns);
  const entry = list.find((p) => p.id === id);
  return {
    page,
    row,
    column,
    id,
    name: entry?.name ?? name,
  };
}

"use server";

import { sanityClient, sanityClientWithToken } from "@/lib/sanity/client";
import { binderByIdQuery, bindersListQuery } from "@/lib/sanity/queries";
import { getPokemonNameSuggestions, searchPokemonInBinder } from "@/lib/pokemon";
import type { SortOrder } from "@/lib/pokemon";

export interface BinderDoc {
  _id: string;
  name?: string | null;
  rows: number;
  columns: number;
  sortOrder: string;
  collectedIds: number[];
  _createdAt?: string;
}

export async function getBinders(): Promise<BinderDoc[]> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "placeholder") {
    return [];
  }
  try {
    const list = await sanityClient.fetch<BinderDoc[]>(bindersListQuery);
    return list ?? [];
  } catch {
    return [];
  }
}

export async function getBinderById(id: string): Promise<BinderDoc | null> {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "placeholder") {
    return null;
  }
  try {
    const doc = await sanityClient.fetch<BinderDoc | null>(binderByIdQuery, { id });
    return doc;
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
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    return { success: false, error: "SANITY_API_WRITE_TOKEN is not set" };
  }
  try {
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
  const binder = await getBinderById(binderId);
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

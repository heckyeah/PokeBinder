/** Languages supported by TCGdex (code used in API path). See https://tcgdex.dev */

export const TCGDEX_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese (Traditional)" },
  { code: "id", label: "Indonesian" },
  { code: "th", label: "Thai" },
] as const;

export type TCGDexLangCode = (typeof TCGDEX_LANGUAGES)[number]["code"];

/** Short label for binder slot (e.g. "en" -> "EN", "ja" -> "JA"). */
export function getLanguageShortLabel(code: string | null | undefined): string {
  if (!code?.trim()) return "";
  const c = code.trim().toLowerCase();
  const found = TCGDEX_LANGUAGES.find((l) => l.code === c);
  if (found) return found.code.toUpperCase();
  return code.slice(0, 2).toUpperCase();
}

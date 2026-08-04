/** Normaliza texto para búsqueda flexible (minúsculas, sin tildes). */
export function normalizeSearchText(value?: string | null): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es')
}

/** true si haystack contiene needle con búsqueda flexible. */
export function matchesSearchText(
  haystack?: string | null,
  needle?: string | null,
): boolean {
  const term = normalizeSearchText(needle).trim()
  if (!term) return true
  return normalizeSearchText(haystack).includes(term)
}

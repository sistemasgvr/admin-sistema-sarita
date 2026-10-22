/** Normaliza texto para búsqueda flexible (minúsculas, sin tildes). */
export function normalizeSearchText(value?: string | null): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es')
}

/**
 * true si haystack contiene cada palabra de needle con búsqueda flexible.
 * Las palabras pueden ir en cualquier orden: "MUNDACA PEREZ CLARIZA" encuentra
 * a "CLARIZA DEL CARMEN MUNDACA PEREZ".
 */
export function matchesSearchText(
  haystack?: string | null,
  needle?: string | null,
): boolean {
  const terms = normalizeSearchText(needle).split(/\s+/).filter(Boolean)
  if (!terms.length) return true
  const text = normalizeSearchText(haystack)
  return terms.every((term) => text.includes(term))
}

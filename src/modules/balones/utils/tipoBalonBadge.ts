import type { BadgeColor } from '@/shared/interfaces/badge.interface'

/**
 * Colores para distinguir tipos de balón de un vistazo.
 *
 * A diferencia de listaOpcionBadge, acá el color no significa nada (un tipo no
 * es "bueno" ni "malo"): solo tiene que ser **estable** — el mismo tipo siempre
 * del mismo color — y repartirse entre tipos distintos. Por eso se deriva del
 * nombre con un hash y no de un mapa que habría que mantener a mano cada vez
 * que alguien registra un tipo nuevo.
 */
const PALETA: BadgeColor[] = ['primary', 'success', 'warning', 'error', 'dark', 'neutral']

export function tipoBalonBadgeColor(nombreTipo?: string | null): BadgeColor {
  const nombre = (nombreTipo ?? '').trim().toUpperCase()
  if (!nombre) return 'neutral'

  let hash = 0
  for (let i = 0; i < nombre.length; i += 1) {
    hash = (hash * 31 + nombre.charCodeAt(i)) % 100000
  }

  return PALETA[hash % PALETA.length]
}

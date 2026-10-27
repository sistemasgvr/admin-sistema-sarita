/** % de IGV con el que se registra una compra si no se indica otro. */
export const PORCENTAJE_IGV_DEFAULT = 18

export type PorcentajeIgvParse = { ok: true; valor: number } | { ok: false; error: string }

/**
 * Interpreta el % de IGV capturado en el formulario de compra.
 * Vacío → 18. Admite coma decimal, redondea a 2 decimales y exige 0..100 (0 es válido).
 */
export function parsePorcentajeIgv(value: string | number | null | undefined): PorcentajeIgvParse {
  if (value == null) return { ok: true, valor: PORCENTAJE_IGV_DEFAULT }
  const texto = typeof value === 'number' ? value : String(value).trim().replace(',', '.')
  if (texto === '') return { ok: true, valor: PORCENTAJE_IGV_DEFAULT }

  const n = typeof texto === 'number' ? texto : Number(texto)
  if (!Number.isFinite(n)) return { ok: false, error: 'Ingresa un % de IGV válido' }

  const valor = Math.round(n * 100) / 100
  if (valor < 0 || valor > 100) return { ok: false, error: 'El % de IGV debe estar entre 0 y 100' }
  return { ok: true, valor }
}

/** Tasa decimal (18 → 0.18) para calcularTotalesDesdeImporte. */
export function tasaIgvDesdePorcentaje(porcentaje: number): number {
  return porcentaje / 100
}

/** "IGV (18%)", "IGV (10.5%)". Un valor inválido o vacío muestra el 18 por defecto. */
export function etiquetaIgv(porcentaje: string | number | null | undefined): string {
  const r = parsePorcentajeIgv(porcentaje)
  const valor = r.ok ? r.valor : PORCENTAJE_IGV_DEFAULT
  return `IGV (${valor}%)`
}

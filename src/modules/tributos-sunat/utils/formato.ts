/** Fechas civiles (YYYY-MM-DD) tal cual, sin pasar por UTC. */
export function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—'
  const [y, m, d] = fecha.slice(0, 10).split('-')
  return y && m && d ? `${d}/${m}/${y}` : fecha
}

export function formatMoney(valor: number | string | null | undefined): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(valor ?? 0))
}

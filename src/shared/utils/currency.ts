const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
})

const numberFormatter = new Intl.NumberFormat('es-PE')

/** Formatea un valor como moneda peruana (S/ 1,234.50). */
export function formatCurrency(value?: number | string | null): string {
  const numeric = typeof value === 'string' ? Number(value) : value
  if (numeric == null || Number.isNaN(numeric)) return currencyFormatter.format(0)
  return currencyFormatter.format(numeric)
}

/** Formatea un entero/decimal con separadores de miles (1,234). */
export function formatNumber(value?: number | string | null): string {
  const numeric = typeof value === 'string' ? Number(value) : value
  if (numeric == null || Number.isNaN(numeric)) return '0'
  return numberFormatter.format(numeric)
}

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

/** Redondea a céntimos (2 decimales) para comparar montos de cuentas/cuotas. */
export function roundMoney(value?: number | string | null): number {
  const numeric = typeof value === 'string' ? Number(value) : Number(value ?? 0)
  if (!Number.isFinite(numeric)) return 0
  return Math.round((numeric + Number.EPSILON) * 100) / 100
}

export function tieneSaldoPendiente(value?: number | string | null): boolean {
  return roundMoney(value) >= 0.01
}

/**
 * Parsea un texto de monto tolerando el formato que la propia app usa para
 * mostrar cifras (ej. "1,234.56", "S/ 1,234.56", "3,200"). La coma SIEMPRE
 * es tratada como separador de miles; el punto como decimal. Devuelve
 * `null` si el texto es vacío o no representa un número válido.
 */
export function parseMoneyInput(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null

  const texto = String(raw).trim()
  if (!texto) return null

  // Quitar espacios y símbolo de moneda; solo se conservan dígitos, coma, punto y signo
  const limpio = texto.replace(/[\sS/]/gi, '')

  // Si tiene punto: la coma es SIEMPRE separador de miles → quitarla
  // Si NO tiene punto pero tiene coma: la coma también se trata como miles
  //   (regla clara y consistente con lo que muestra la UI: nunca decimal-coma)
  const sinComas = limpio.replace(/,/g, '')

  // Validación estricta: dígitos opcional-punto-dígitos
  if (!/^-?\d+(\.\d+)?$/.test(sinComas)) return null

  const n = Number(sinComas)
  return Number.isFinite(n) ? n : null
}

/**
 * Normaliza un monto a 2 decimales fijos como string ("1234.56"). Devuelve
 * `''` si no es válido. Ideal para usar en el `focusout` de inputs de monto.
 */
export function normalizeMoneyInput(raw: unknown): string {
  const n = parseMoneyInput(raw)
  if (n == null || n < 0) return ''
  return (Math.round(n * 100) / 100).toFixed(2)
}

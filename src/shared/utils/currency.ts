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
  if (!tieneMaxDosDecimalesMoneda(raw)) return String(raw ?? '').trim()
  return roundMoney(n).toFixed(2)
}

/** Texto numérico limpio (sin espacios, S/, comas miles). */
function limpiarTextoMonto(raw: string): string {
  return raw.replace(/[\sS/]/gi, '').replace(/,/g, '')
}

/** Cuenta dígitos después del punto decimal en el texto del input. */
export function contarDecimalesEnTexto(raw: unknown): number | null {
  if (raw == null) return null
  const texto = limpiarTextoMonto(String(raw).trim())
  if (!texto) return null
  const match = texto.match(/^-?\d+(?:\.(\d+))?$/)
  if (!match) return null
  return match[1]?.length ?? 0
}

/** Indica si un monto parseado tiene como máximo 2 decimales (moneda PEN). */
export function tieneMaxDosDecimalesMoneda(raw: unknown): boolean {
  if (raw == null || String(raw).trim() === '') return false

  const dec = contarDecimalesEnTexto(raw)
  if (dec != null) return dec <= 2

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const s = raw.toString()
    const idx = s.indexOf('.')
    if (idx === -1) return true
    return s.length - idx - 1 <= 2
  }

  return false
}

export type ValidacionMontoMonedaOpts = {
  /** Mínimo permitido (default 0). */
  min?: number
  /** Si true, acepta monto === 0 (default false). */
  allowZero?: boolean
}

/** Valida monto monetario: parseable, no negativo, máx. 2 decimales. */
export function esMontoMonedaValido(
  raw: unknown,
  opts: ValidacionMontoMonedaOpts = {},
): boolean {
  const min = opts.min ?? 0
  const allowZero = opts.allowZero ?? false
  const n = parseMoneyInput(raw)
  if (n == null || !Number.isFinite(n)) return false
  if (n < min) return false
  if (!allowZero && n === 0) return false
  return tieneMaxDosDecimalesMoneda(n)
}

/** Mensaje de error para input de monto; `null` si es válido. */
export function mensajeErrorMontoMoneda(
  raw: unknown,
  opts: ValidacionMontoMonedaOpts = {},
): string | null {
  const min = opts.min ?? 0
  const allowZero = opts.allowZero ?? false
  const texto = String(raw ?? '').trim()

  if (!texto) return 'Monto obligatorio'

  const n = parseMoneyInput(raw)
  if (n == null || !Number.isFinite(n)) return 'Monto inválido'
  if (n < 0) return 'El monto no puede ser negativo'
  if (n < min) return min > 0 ? 'El monto debe ser mayor a 0' : 'Monto inválido'
  if (!allowZero && n === 0) return 'El monto debe ser mayor a 0'
  if (!tieneMaxDosDecimalesMoneda(n)) return 'Solo se permiten hasta 2 decimales'
  return null
}

/** Bloquea signos, caracteres no numéricos y más de 2 decimales mientras se escribe. */
export function bloquearTeclasMontoInvalidas(e: KeyboardEvent) {
  if (e.key.length > 1) return
  if (e.ctrlKey || e.metaKey) return
  if (['-', '+', 'e', 'E'].includes(e.key)) {
    e.preventDefault()
    return
  }
  if (!/[\d.,]/.test(e.key)) {
    e.preventDefault()
    return
  }

  const input = e.target as HTMLInputElement | null
  if (!input || !/[\d.]/.test(e.key)) return

  const start = input.selectionStart ?? input.value.length
  const end = input.selectionEnd ?? input.value.length
  const candidato = input.value.slice(0, start) + e.key + input.value.slice(end)
  const limpio = limpiarTextoMonto(candidato)

  if (limpio && !/^-?\d*(\.\d*)?$/.test(limpio)) {
    e.preventDefault()
    return
  }

  const dec = contarDecimalesEnTexto(candidato)
  if (dec != null && dec > 2) e.preventDefault()
}

/** Bloquea pegado de montos inválidos (signos, notación científica o >2 decimales). */
export function bloquearPegadoMontoInvalido(e: ClipboardEvent) {
  const texto = e.clipboardData?.getData('text') ?? ''
  if (/[-+eE]/.test(texto)) {
    e.preventDefault()
    return
  }
  if (texto.trim() && !tieneMaxDosDecimalesMoneda(texto)) e.preventDefault()
}

/** Valida un número ya parseado (refs numéricas legacy). */
export function esNumeroMonedaValido(
  value: unknown,
  opts: ValidacionMontoMonedaOpts = {},
): boolean {
  if (value == null || value === '') return opts.allowZero ?? false
  return esMontoMonedaValido(String(value), opts)
}

/** Mensaje de error para refs numéricas; `null` si es válido o vacío opcional. */
export function mensajeErrorNumeroMoneda(
  value: unknown,
  opts: ValidacionMontoMonedaOpts & { optional?: boolean } = {},
): string | null {
  if (value == null || value === '') {
    return opts.optional ? null : 'Monto obligatorio'
  }
  return mensajeErrorMontoMoneda(String(value), opts)
}

/** Normaliza número a 2 decimales; devuelve null si inválido. */
export function normalizarNumeroMoneda(value: unknown): number | null {
  const msg = mensajeErrorMontoMoneda(String(value ?? ''), { min: 0, allowZero: true })
  if (msg) return null
  const n = parseMoneyInput(value)
  return n == null ? null : roundMoney(n)
}

/** Handler @input para inputs type=number legacy: trunca a 2 decimales mientras escribe. */
export function sanitizarInputNumeroMoneda(
  event: Event,
  onUpdate: (value: number | string) => void,
) {
  const target = event.target as HTMLInputElement
  const raw = target.value
  if (!raw.trim()) {
    onUpdate('')
    return
  }
  const dec = contarDecimalesEnTexto(raw)
  if (dec != null && dec > 2) {
    const n = parseMoneyInput(raw)
    if (n != null) {
      const fixed = roundMoney(n).toFixed(2)
      target.value = fixed
      onUpdate(fixed)
    }
    return
  }
  onUpdate(raw)
}

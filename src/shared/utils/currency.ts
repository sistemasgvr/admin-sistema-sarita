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

/**
 * Decimales con los que se persiste el precio unitario de una línea.
 * Coincide con el `numeric(12,6)` de `com_comprobante_compra_detalle.precio_unitario`.
 */
export const MAX_DEC_PRECIO_UNITARIO = 6

/** Redondea a una cantidad arbitraria de decimales (sin arrastrar ruido de float). */
export function roundToDecimales(
  value?: number | string | null,
  decimales = MAX_DEC_PRECIO_UNITARIO,
): number {
  const numeric = typeof value === 'string' ? Number(value) : Number(value ?? 0)
  if (!Number.isFinite(numeric)) return 0
  const factor = Math.pow(10, decimales)
  return Math.round((numeric + Number.EPSILON) * factor) / factor
}

/**
 * Deriva el precio unitario a partir del importe total de la línea.
 *
 * Permite capturar el monto que figura en la factura (dinero, 2 decimales) en
 * lugar de un precio unitario que no "cuadra": el backend guarda el importe como
 * `cantidad * precio_unitario`, así que con 6 decimales el producto vuelve al
 * valor de la factura (ver `com_comprobante_compra_detalle.importe numeric(12,4)`).
 *
 * Devuelve `null` si la cantidad no es utilizable, para no guardar un precio
 * inventado en una línea inválida.
 */
export function precioUnitarioDesdeImporte(
  importe?: number | string | null,
  cantidad?: number | string | null,
): number | null {
  const total = typeof importe === 'string' ? Number(importe) : Number(importe ?? 0)
  const cant = typeof cantidad === 'string' ? Number(cantidad) : Number(cantidad ?? 0)
  if (!Number.isFinite(total) || !Number.isFinite(cant) || cant <= 0) return null
  return roundToDecimales(total / cant)
}

/** Igual que `roundMoney`, pero a la precisión del precio unitario. */
export function roundPrecioUnitario(value?: number | string | null): number {
  return roundToDecimales(value, MAX_DEC_PRECIO_UNITARIO)
}

/**
 * Muestra un precio unitario conservando hasta 4 decimales cuando el valor no
 * es "redondo": un P. unitario derivado (33.333333) no debe verse como S/ 33.33
 * porque entonces el usuario cree que el importe de la línea no cuadra.
 *
 * `Intl` con estilo currency fuerza 2 decimales, así que aquí se arma un
 * formateador propio con `minimumFractionDigits: 0`.
 */
export function formatPrecioUnitario(
  value?: number | string | null,
  codigoMoneda = 'PEN',
): string {
  const numeric = typeof value === 'string' ? Number(value) : Number(value ?? 0)
  const seguro = Number.isFinite(numeric) ? numeric : 0
  const limpio = roundToDecimales(seguro, 4)
  const opciones: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: codigoMoneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }
  try {
    return new Intl.NumberFormat('es-PE', opciones).format(limpio)
  } catch {
    return formatCurrency(limpio)
  }
}

export function tieneSaldoPendiente(value?: number | string | null): boolean {
  return roundMoney(value) >= 0.01
}


export function parseMoneyInput(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null

  const texto = String(raw).trim()
  if (!texto) return null
  const limpio = texto.replace(/[\sS/]/gi, '')

  const sinComas = limpio.replace(/,/g, '')
  if (!/^-?\d+(\.\d+)?$/.test(sinComas)) return null

  const n = Number(sinComas)
  return Number.isFinite(n) ? n : null
}

export function normalizeMoneyInput(raw: unknown): string {
  const n = parseMoneyInput(raw)
  if (n == null || n < 0) return ''
  if (!tieneMaxDosDecimalesMoneda(raw)) return String(raw ?? '').trim()
  return roundMoney(n).toFixed(2)
}

function limpiarTextoMonto(raw: string): string {
  return raw.replace(/[\sS/]/gi, '').replace(/,/g, '')
}

export function contarDecimalesEnTexto(raw: unknown): number | null {
  if (raw == null) return null
  const texto = limpiarTextoMonto(String(raw).trim())
  if (!texto) return null
  const match = texto.match(/^-?\d+(?:\.(\d+))?$/)
  if (!match) return null
  return match[1]?.length ?? 0
}

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
  maxDecimals?: number
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
  return (contarDecimalesEnTexto(raw) ?? Infinity) <= (opts.maxDecimals ?? 2)
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
  if ((contarDecimalesEnTexto(raw) ?? Infinity) > (opts.maxDecimals ?? 2)) return `Solo se permiten hasta ${opts.maxDecimals ?? 2} decimales`
  return null
}

function nextTickSelection(input: HTMLInputElement, pos: number) {
  queueMicrotask(() => input.setSelectionRange(pos, pos))
}

/** Bloquea signos, caracteres no numéricos y más de 2 decimales mientras se escribe. */
export function bloquearTeclasMontoInvalidas(e: KeyboardEvent, maxDecimals = 2) {
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
  const tieneSeleccion = start !== end

  // Sobre "0.00" / "0": un dígito sin selección reemplaza en lugar de append (0.005 → bloqueado).
  if (
    !tieneSeleccion &&
    e.key.length === 1 &&
    /^\d$/.test(e.key)
  ) {
    const n = parseMoneyInput(input.value)
    if (n === 0) {
      e.preventDefault()
      input.value = e.key
      input.dispatchEvent(new Event('input', { bubbles: true }))
      nextTickSelection(input, 1)
      return
    }
  }

  const candidato = input.value.slice(0, start) + e.key + input.value.slice(end)
  const limpio = limpiarTextoMonto(candidato)

  if (limpio && !/^-?\d*(\.\d*)?$/.test(limpio)) {
    e.preventDefault()
    return
  }

  const dec = contarDecimalesEnTexto(candidato)
  if (dec != null && dec > maxDecimals) e.preventDefault()
}

/** Bloquea pegado de montos inválidos (signos, notación científica o >2 decimales). */
export function bloquearPegadoMontoInvalido(e: ClipboardEvent, maxDecimals = 2) {
  const texto = e.clipboardData?.getData('text') ?? ''
  if (/[-+eE]/.test(texto)) {
    e.preventDefault()
    return
  }
  const input = e.target as HTMLInputElement | null
  const candidato = input && typeof input.selectionStart === 'number'
    ? input.value.slice(0, input.selectionStart) + texto + input.value.slice(input.selectionEnd ?? input.selectionStart)
    : texto
  if (candidato.trim() && (contarDecimalesEnTexto(candidato) ?? Infinity) > maxDecimals) e.preventDefault()
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

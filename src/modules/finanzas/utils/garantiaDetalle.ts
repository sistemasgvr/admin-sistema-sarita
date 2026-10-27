import type {
  ActualizarGarantiaPayload,
  Garantia,
  GarantiaMovimiento,
  OrigenGarantia,
} from '@/modules/finanzas/interfaces/garantia.interface'

export function resolveOrigen(g: Garantia): OrigenGarantia {
  if (g.origen) return g.origen
  if (g.id_prestamo) return 'PRESTAMO'
  if (g.id_alquiler) return 'ALQUILER'
  if (g.comprobante_cobro || g.movimientos?.some((m) => m.id_comprobante)) return 'POS'
  return 'MANUAL'
}

export function origenLabel(origen?: OrigenGarantia | null) {
  switch (origen) {
    case 'PRESTAMO':
      return 'Préstamo'
    case 'ALQUILER':
      return 'Alquiler'
    case 'POS':
      return 'POS'
    case 'MANUAL':
      return 'Manual'
    default:
      return '—'
  }
}

export function origenColor(
  origen?: OrigenGarantia | null,
): 'primary' | 'success' | 'warning' | 'neutral' {
  switch (origen) {
    case 'PRESTAMO':
      return 'primary'
    case 'ALQUILER':
      return 'success'
    case 'POS':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function origenDetalle(g: Garantia) {
  if (g.numero_prestamo) return `Préstamo ${g.numero_prestamo}`
  if (g.numero_alquiler) return `Alquiler ${g.numero_alquiler}`
  if (g.comprobante_cobro) return `Comprobante ${g.comprobante_cobro}`
  if (g.nombre_producto) return g.nombre_producto
  return 'Sin vínculo operativo'
}

export function estadoColor(estado?: string | null): 'success' | 'warning' | 'primary' | 'neutral' {
  switch (estado) {
    case 'DEVUELTA':
      return 'success'
    case 'TRANSFERIDA':
      return 'neutral'
    case 'PARCIAL':
      return 'primary'
    case 'ACTIVA':
      return 'warning'
    default:
      return 'neutral'
  }
}

/** Referencia legible del documento al que está ligada la garantía (null si es manual). */
function documentoLigado(g: Garantia): string | null {
  switch (resolveOrigen(g)) {
    case 'PRESTAMO':
      return `préstamo ${g.numero_prestamo || (g.id_prestamo ? `#${g.id_prestamo}` : '')}`.trim()
    case 'ALQUILER':
      return `alquiler ${g.numero_alquiler || (g.id_alquiler ? `#${g.id_alquiler}` : '')}`.trim()
    case 'POS':
      return `comprobante ${g.comprobante_cobro || ''}`.trim()
    default:
      return null
  }
}

export function avisoGarantiaLigada(g?: Garantia | null): string | null {
  if (!g) return null
  const doc = documentoLigado(g)
  if (!doc) return null
  return `Garantía ligada a ${doc}: los cambios de monto, fecha o cliente pueden no coincidir con ese documento`
}

export function formatCuentaMovimiento(
  m: Pick<GarantiaMovimiento, 'cuenta_bancaria' | 'numero_operacion'>,
): string {
  const cuenta = m.cuenta_bancaria?.trim()
  const operacion = m.numero_operacion?.trim()
  const partes = [cuenta, operacion ? `Op. ${operacion}` : null].filter(Boolean)
  return partes.length ? partes.join(' · ') : '—'
}

/** Valores editables de una garantía, tal como los registra su cobro. */
export interface ValoresEdicionGarantia {
  fecha: string
  idCliente: number | null
  idMedioPago: number | null
  idCuentaBancaria: number | null
  numeroOperacion: string
  importe: number
  observacion: string
}

/** Lee los valores efectivos del cobro (la verdad para caja) con la cabecera como respaldo. */
export function valoresEdicionGarantia(g: Garantia): ValoresEdicionGarantia {
  return {
    fecha: g.cobro_fecha || g.fecha_registro,
    idCliente: g.id_cliente ?? null,
    idMedioPago: g.cobro_id_medio_pago ?? g.id_medio_pago ?? null,
    idCuentaBancaria: g.cobro_id_cuenta_bancaria ?? g.id_cuenta_bancaria ?? null,
    numeroOperacion: g.numero_operacion ?? '',
    importe: Number(g.monto_cobrado),
    observacion: g.observacion ?? '',
  }
}

const redondear = (n: number) => Math.round(Number(n) * 100) / 100

/**
 * Solo los campos que cambiaron respecto de `inicial` (lo omitido se conserva en la base).
 * La cuenta viaja con el medio cuando éste cambia; '' en nº de operación u observación los vacía.
 */
export function cambiosGarantiaEdicion(
  inicial: ValoresEdicionGarantia,
  actual: ValoresEdicionGarantia,
): ActualizarGarantiaPayload {
  const cambios: ActualizarGarantiaPayload = {}
  if (actual.fecha && actual.fecha !== inicial.fecha) cambios.fecha = actual.fecha
  if (actual.idCliente != null && actual.idCliente !== inicial.idCliente) {
    cambios.idCliente = actual.idCliente
  }
  if (redondear(actual.importe) !== redondear(inicial.importe)) {
    cambios.importe = redondear(actual.importe)
  }
  if (actual.idMedioPago != null && actual.idMedioPago !== inicial.idMedioPago) {
    cambios.idMedioPago = actual.idMedioPago
    if (actual.idCuentaBancaria != null) cambios.idCuentaBancaria = actual.idCuentaBancaria
  } else if (
    actual.idCuentaBancaria != null &&
    actual.idCuentaBancaria !== inicial.idCuentaBancaria
  ) {
    cambios.idCuentaBancaria = actual.idCuentaBancaria
  }
  const numero = actual.numeroOperacion.trim()
  if (numero !== inicial.numeroOperacion.trim()) cambios.numeroOperacion = numero
  const observacion = actual.observacion.trim()
  if (observacion !== inicial.observacion.trim()) cambios.observacion = observacion
  return cambios
}

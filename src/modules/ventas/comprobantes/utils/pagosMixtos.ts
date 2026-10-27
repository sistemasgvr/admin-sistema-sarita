import { roundMoney } from '@/shared/utils/currency'

export interface LineaPagoForm {
  key: string
  idMedioPago: number | null
  idCuentaBancaria: number | null
  numeroOperacion: string
  monto: number
  valido: boolean // lo publica MedioPagoCuentaField (cuenta / n° operación)
}

const TOLERANCIA = 0.01

let contadorLineas = 0

// crypto.randomUUID no existe en contextos no seguros (POS abierto por HTTP en una IP de la LAN).
function nuevaKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  contadorLineas += 1
  return `linea-${contadorLineas}`
}

export function nuevaLineaPago(monto: number): LineaPagoForm {
  return {
    key: nuevaKey(),
    idMedioPago: null,
    idCuentaBancaria: null,
    numeroOperacion: '',
    monto,
    valido: true,
  }
}

function sumar(lineas: Pick<LineaPagoForm, 'monto'>[]): number {
  return roundMoney(lineas.reduce((acc, linea) => acc + (Number(linea.monto) || 0), 0))
}

export function saldoPendiente(total: number, lineas: Pick<LineaPagoForm, 'monto'>[]): number {
  return roundMoney(roundMoney(total) - sumar(lineas))
}

export function montoEfectivo(lineas: LineaPagoForm[], idsEfectivo: ReadonlySet<number>): number {
  return sumar(lineas.filter((l) => l.idMedioPago != null && idsEfectivo.has(l.idMedioPago)))
}

/** Efectivo que el cliente debe entregar: líneas en efectivo + efectivo adicional (garantía). */
export function efectivoACobrar(
  lineas: LineaPagoForm[],
  idsEfectivo: ReadonlySet<number>,
  efectivoAdicional = 0,
): number {
  return roundMoney(montoEfectivo(lineas, idsEfectivo) + (Number(efectivoAdicional) || 0))
}

export function vuelto(
  efectivoRecibido: number | null,
  lineas: LineaPagoForm[],
  idsEfectivo: ReadonlySet<number>,
  efectivoAdicional = 0, // p. ej. garantía cobrada en efectivo, fuera de las líneas de pago
): number | null {
  const efectivo = efectivoACobrar(lineas, idsEfectivo, efectivoAdicional)
  if (efectivoRecibido == null || efectivo <= 0) return null
  return roundMoney(Math.max(0, efectivoRecibido - efectivo))
}

export function validarPagos(
  total: number,
  lineas: LineaPagoForm[],
  efectivoRecibido: number | null,
  idsEfectivo: ReadonlySet<number>,
  efectivoAdicional = 0,
): string | null {
  if (lineas.length === 0) return 'Agrega al menos un medio de pago'
  if (lineas.some((l) => l.idMedioPago == null)) return 'Selecciona el medio de pago de cada línea'
  if (lineas.some((l) => !(roundMoney(l.monto) > 0))) return 'Cada monto debe ser mayor a 0'
  const claves = lineas.map((l) => `${l.idMedioPago}|${l.idCuentaBancaria ?? ''}`)
  if (new Set(claves).size !== claves.length) return 'No repitas el mismo medio y cuenta en dos líneas'
  const suma = sumar(lineas)
  if (Math.abs(suma - roundMoney(total)) > TOLERANCIA) {
    return `Los pagos suman S/ ${suma.toFixed(2)} y el total es S/ ${roundMoney(total).toFixed(2)}`
  }
  const efectivo = efectivoACobrar(lineas, idsEfectivo, efectivoAdicional)
  if (efectivoRecibido != null && efectivo > 0 && roundMoney(efectivoRecibido) < efectivo) {
    return 'El efectivo recibido no alcanza para el monto en efectivo'
  }
  if (lineas.some((l) => !l.valido)) return 'Completa la cuenta bancaria y el número de operación del cobro'
  return null
}

export function medioPrincipal(lineas: LineaPagoForm[]): number | null {
  let mejor: LineaPagoForm | null = null
  for (const linea of lineas) {
    if (!mejor || linea.monto > mejor.monto) mejor = linea
  }
  return mejor?.idMedioPago ?? null
}

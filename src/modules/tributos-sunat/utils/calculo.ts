import type { TipoTributo } from '../interfaces/tributo.interface'

/** Fecha civil de Lima (UTC-5), como la usa el backend. */
export function hoyLima(now = new Date()): string {
  return new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function redondear2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

/**
 * Mismo cálculo que el backend (`calcularLineaTributo`): tributo por línea
 * redondeado a centavos; la percepción se suma al cobro y la retención se
 * descuenta del pago. Es solo para mostrar; el servidor recalcula al guardar.
 */
export function calcularResumen(tipo: TipoTributo, totales: number[], tasa: number) {
  let base = 0
  let tributo = 0
  let neto = 0
  for (const t of totales) {
    const total = redondear2(Number(t) || 0)
    const linea = redondear2((total * (Number(tasa) || 0)) / 100)
    base = redondear2(base + total)
    tributo = redondear2(tributo + linea)
    neto = redondear2(neto + (tipo === 'percepcion' ? total + linea : total - linea))
  }
  return { base, tributo, neto }
}

export interface FormularioTributo {
  idEmpresa: number | null
  serie: string
  fechaEmision: string
  regimen: string
  tasa: number
  origenes: { fecha: string; fechaOperacion: string }[]
}

/** Primer problema que impide guardar, o null si está listo. */
export function validarFormularioTributo(tipo: TipoTributo, f: FormularioTributo): string | null {
  const prefijo = tipo === 'percepcion' ? 'P' : 'R'
  const nombre = tipo === 'percepcion' ? 'percepción' : 'retención'
  if (!f.idEmpresa) return 'Selecciona la empresa emisora en Configuración → Empresa'
  if (f.origenes.length === 0) return tipo === 'percepcion' ? 'Marca al menos un comprobante' : 'Marca al menos una compra'
  if (!new RegExp(`^${prefijo}\\d{3}$`).test(f.serie.trim().toUpperCase())) return `La serie de ${nombre} es ${prefijo}001–${prefijo}999`
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fechaEmision)) return 'Indica la fecha de emisión'
  if (f.fechaEmision > hoyLima()) return 'La fecha de emisión no puede ser futura'
  if (!f.regimen) return 'Selecciona el régimen SUNAT'
  if (!(Number(f.tasa) > 0) || Number(f.tasa) > 100) return 'Indica una tasa mayor que 0 y hasta 100'
  for (const o of f.origenes) {
    const fechaOp = o.fechaOperacion || f.fechaEmision
    if (fechaOp < o.fecha.slice(0, 10)) return `La fecha de ${tipo === 'percepcion' ? 'cobro' : 'pago'} no puede ser anterior a la emisión del ${tipo === 'percepcion' ? 'comprobante' : 'documento de compra'}`
    if (fechaOp > f.fechaEmision) return `La fecha de ${tipo === 'percepcion' ? 'cobro' : 'pago'} no puede ser posterior a la emisión de la ${nombre}`
  }
  return null
}

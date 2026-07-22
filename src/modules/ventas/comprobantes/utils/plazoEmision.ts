/**
 * Plazos SUNAT de emisión (días calendario desde la fecha del comprobante).
 * Factura (01): 3 días · Boleta (03): 5 días.
 */
export function diasPlazoEmision(codigoTipo?: string | null): number | null {
  const codigo = (codigoTipo ?? '').trim()
  if (codigo === '01') return 3
  if (codigo === '03') return 5
  return null
}

export type EstadoPlazoEmision = {
  diasPlazo: number
  diasTranscurridos: number
  diasRestantes: number
  vencido: boolean
  label: string
}

function parseFechaLocal(value: string): Date | null {
  const raw = value.slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

function hoyLocal(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function diffDias(desde: Date, hasta: Date): number {
  return Math.floor((hasta.getTime() - desde.getTime()) / 86_400_000)
}

export function evaluarPlazoEmision(opts: {
  fecha?: string | null
  codigoTipo?: string | null
  estadoSunat?: string | null
}): EstadoPlazoEmision | null {
  const estado = (opts.estadoSunat ?? '').toUpperCase()
  if (estado === 'ACEPTADO' || estado === 'BAJA' || estado === 'NO_APLICA') {
    return null
  }

  const diasPlazo = diasPlazoEmision(opts.codigoTipo)
  if (diasPlazo == null || !opts.fecha) return null

  const fecha = parseFechaLocal(opts.fecha)
  if (!fecha) return null

  const diasTranscurridos = diffDias(fecha, hoyLocal())
  const diasRestantes = diasPlazo - diasTranscurridos
  const vencido = diasRestantes < 0

  let label: string
  if (vencido) {
    label = `Plazo vencido (${Math.abs(diasRestantes)}d)`
  } else if (diasRestantes === 0) {
    label = 'Vence hoy'
  } else if (diasRestantes === 1) {
    label = '1 día restante'
  } else {
    label = `${diasRestantes} días restantes`
  }

  return { diasPlazo, diasTranscurridos, diasRestantes, vencido, label }
}

export function mensajePlazoEmisionVencido(codigoTipo?: string | null): string {
  const dias = diasPlazoEmision(codigoTipo)
  if (codigoTipo === '01') {
    return `No se puede emitir: la factura supera el plazo de ${dias} días desde su fecha.`
  }
  if (codigoTipo === '03') {
    return `No se puede emitir: la boleta supera el plazo de ${dias} días desde su fecha.`
  }
  return 'No se puede emitir: el comprobante supera el plazo de emisión permitido.'
}

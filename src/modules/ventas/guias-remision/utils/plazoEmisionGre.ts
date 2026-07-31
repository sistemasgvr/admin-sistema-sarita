import type { BadgeColor } from '@/shared/interfaces/badge.interface'

/**
 * Plazo de emisión GRE: debe emitirse a SUNAT antes o el mismo día del traslado.
 * Usa `fecha_traslado` como fecha límite (no días fijos como factura/boleta).
 */

export type EstadoPlazoEmisionGre = {
  diasRestantes: number
  vencido: boolean
  label: string
  color: BadgeColor
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

export function evaluarPlazoEmisionGre(opts: {
  fechaTraslado?: string | null
  estadoSunat?: string | null
  ticketSunat?: string | null
}): EstadoPlazoEmisionGre | null {
  const estado = (opts.estadoSunat ?? 'PENDIENTE').toUpperCase()
  if (estado === 'ACEPTADO' || estado === 'BAJA' || estado === 'NO_APLICA') {
    return null
  }

  const ticket = (opts.ticketSunat ?? '').trim()
  if (ticket && estado === 'PENDIENTE') {
    return {
      diasRestantes: 0,
      vencido: false,
      label: 'En proceso · Consultar',
      color: 'primary',
    }
  }

  if (estado === 'RECHAZADO') {
    return {
      diasRestantes: 0,
      vencido: true,
      label: 'Rechazada · Reemitir',
      color: 'error',
    }
  }

  if (!opts.fechaTraslado) {
    return {
      diasRestantes: 0,
      vencido: false,
      label: 'Sin emitir',
      color: 'warning',
    }
  }

  const fechaTraslado = parseFechaLocal(opts.fechaTraslado)
  if (!fechaTraslado) return null

  const diasRestantes = diffDias(hoyLocal(), fechaTraslado)
  const vencido = diasRestantes < 0

  let plazo: string
  let color: BadgeColor
  if (vencido) {
    plazo = `Plazo vencido (${Math.abs(diasRestantes)}d)`
    color = 'error'
  } else if (diasRestantes === 0) {
    plazo = 'Emitir hoy'
    color = 'error'
  } else if (diasRestantes === 1) {
    plazo = '1 día para emitir'
    color = 'warning'
  } else {
    plazo = `${diasRestantes} días para emitir`
    color = 'warning'
  }

  return {
    diasRestantes,
    vencido,
    label: `Sin emitir · ${plazo}`,
    color,
  }
}

export function mensajePlazoEmisionGreVencido(): string {
  return 'El traslado ya venció: la guía debería haberse emitido a SUNAT antes o el mismo día de la fecha de traslado.'
}

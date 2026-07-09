import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'

export interface BalonEstadoBadge {
  label: string
  color: BadgeColor
}

const ESTADO_BALON_COLORS: Record<string, BadgeColor> = {
  DADO_DE_BAJA: 'error',
  ROBO: 'error',
  EN_ALMACEN: 'success',
  DEVUELTO: 'neutral',
  PRESTADO_CLIENTE: 'primary',
  ALQUILADO: 'primary',
  EN_MANTENIMIENTO: 'warning',
  POR_RECOGER: 'warning',
  EN_RUTA_LIMA: 'neutral',
}

export function getBalonEstadoBadge(balon: {
  nombre_estado_balon?: string | null
  tiene_solicitud_baja_pendiente?: boolean
}): BalonEstadoBadge | null {
  if (balon.tiene_solicitud_baja_pendiente) {
    return { label: 'Baja en solicitud', color: 'warning' }
  }

  const code = balon.nombre_estado_balon?.trim().toUpperCase() ?? ''
  if (!code) return null

  return {
    label: formatListaOpcionLabel(balon.nombre_estado_balon),
    color: ESTADO_BALON_COLORS[code] ?? 'primary',
  }
}

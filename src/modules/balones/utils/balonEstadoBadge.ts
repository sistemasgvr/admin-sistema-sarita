import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import { listaOpcionBadgeColor } from '@/shared/utils/listaOpcionBadge'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'

export interface BalonEstadoBadge {
  label: string
  color: BadgeColor
}

export function getBalonEstadoBadge(balon: {
  nombre_estado_balon?: string | null
  tiene_solicitud_baja_pendiente?: boolean
}): BalonEstadoBadge | null {
  if (balon.tiene_solicitud_baja_pendiente) {
    return { label: 'Baja en solicitud', color: 'warning' }
  }

  const code = balon.nombre_estado_balon?.trim() ?? ''
  if (!code) return null

  return {
    label: formatListaOpcionLabel(balon.nombre_estado_balon),
    color: listaOpcionBadgeColor(code),
  }
}

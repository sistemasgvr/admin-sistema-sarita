import type { ClaseItemActividad } from '@/modules/operativa/actividades/interfaces/actividad.interface'

export function esTipoRepartoNombre(nombre?: string | null) {
  return (nombre ?? '').trim().toUpperCase() === 'REPARTO'
}

export function esTipoRecojoNombre(nombre?: string | null) {
  return (nombre ?? '').trim().toUpperCase() === 'RECOJO'
}

export function idOpcionPorNombre(
  opciones: Array<{ id: number; nombre: string }> | undefined,
  candidatos: string[],
) {
  const wanted = new Set(candidatos.map((n) => n.trim().toUpperCase()))
  return opciones?.find((o) => wanted.has((o.nombre ?? '').trim().toUpperCase()))?.id
}

export function esActividadRealizada(nombreEstado?: string | null) {
  return (nombreEstado ?? '').trim().toUpperCase() === 'REALIZADA'
}

export function esActividadCancelada(nombreEstado?: string | null) {
  const n = (nombreEstado ?? '').trim().toUpperCase()
  return n === 'CANCELADA' || n === 'CANCELADO'
}

/** La entrega salió del almacén y va camino al cliente. */
export function esActividadEnRuta(nombreEstado?: string | null) {
  const n = (nombreEstado ?? '').trim().toUpperCase()
  return n === 'EN_RUTA' || n === 'EN RUTA'
}

/**
 * Clase del ítem dentro de una entrega, en el mismo orden de precedencia que
 * age_clasificar_items_actividad: el cilindro manda, el gas se reconoce por ser
 * el producto de algún cilindro de la misma actividad, y el resto es accesorio.
 */
export function claseItemActividad(
  item: { id_balon?: number | null; id_producto?: number | null },
  items: Array<{ id_balon?: number | null; id_producto?: number | null }>,
): ClaseItemActividad {
  if (item.id_balon != null) return 'CILINDRO'
  if (
    item.id_producto != null &&
    items.some((otro) => otro.id_balon != null && otro.id_producto === item.id_producto)
  ) {
    return 'GAS'
  }
  return 'ACCESORIO'
}

export function tieneActividadVigente(row?: {
  tiene_actividad?: boolean | null
  id_actividad?: number | null
  nombre_estado_actividad?: string | null
} | null) {
  if (!row) return false
  if (esActividadCancelada(row.nombre_estado_actividad)) return false
  return Boolean(row.tiene_actividad || row.id_actividad)
}

export function nombreChoferCompleto(chofer: {
  nombres?: string | null
  apellido_paterno?: string | null
  apellido_materno?: string | null
}) {
  return [chofer.nombres, chofer.apellido_paterno, chofer.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()
}

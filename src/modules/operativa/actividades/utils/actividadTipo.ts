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
 * Estados del flujo de entrega: solo cambian por acciones dedicadas
 * (iniciar / culminar / cancelar / marcar realizada), no por el formulario.
 */
export function esEstadoActividadOperativo(nombreEstado?: string | null) {
  const n = (nombreEstado ?? '').trim().toUpperCase()
  return (
    n === 'EN_RUTA' ||
    n === 'EN RUTA' ||
    n === 'REALIZADA' ||
    n === 'CANCELADA' ||
    n === 'CANCELADO'
  )
}

/** Estados que el formulario sí puede asignar (pendiente / programada). */
export function esEstadoActividadEditableEnFormulario(nombreEstado?: string | null) {
  const n = (nombreEstado ?? '').trim().toUpperCase()
  return n === 'PENDIENTE' || n === 'PROGRAMADA' || n === 'PENDIENTE_REALIZAR'
}

type ItemClaseRef = {
  id_balon?: number | null
  id_producto?: number | null
  /** Gas del balón (b.id_producto_gas), si el API lo expone. */
  id_producto_gas?: number | null
  nombre_producto?: string | null
  /** Nombre del gas ligado al balón del cilindro. */
  nombre_producto_gas?: string | null
}

/**
 * Clase del ítem dentro de una entrega, alineada a age_clasificar_items_actividad:
 * CILINDRO si tiene id_balon; GAS si su id_producto es el gas de algún cilindro
 * (b.id_producto_gas); el resto es ACCESORIO.
 */
export function claseItemActividad(
  item: ItemClaseRef,
  items: ItemClaseRef[],
): ClaseItemActividad {
  if (item.id_balon != null) return 'CILINDRO'
  if (item.id_producto == null) return 'ACCESORIO'

  const nombreItem = (item.nombre_producto ?? '').trim().toUpperCase()
  const esGas = items.some((otro) => {
    if (otro.id_balon == null) return false
    // Igual que SQL: b.id_producto_gas = ai.id_producto
    if (otro.id_producto_gas != null && otro.id_producto_gas === item.id_producto) {
      return true
    }
    // Fallback por nombre cuando el listado solo trae nombre_producto_gas
    const nombreGasCilindro = (otro.nombre_producto_gas ?? '').trim().toUpperCase()
    if (nombreItem && nombreGasCilindro && nombreItem === nombreGasCilindro) {
      return true
    }
    return false
  })

  return esGas ? 'GAS' : 'ACCESORIO'
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

import type { BalonOrigenRecarga } from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'

/** Etiqueta operativa: código · capacidad tipo · disponible · almacén. */
export function formatOrigenRecargaLabel(origen: BalonOrigenRecarga): string {
  const parts = [origen.codigo_balon]
  if (origen.capacidad_tipo != null) {
    parts.push(`cap. ${origen.capacidad_tipo}`)
  }
  parts.push(`disp. ${origen.capacidad_disponible}`)
  if (origen.nombre_almacen) {
    parts.push(origen.nombre_almacen)
  }
  return parts.join(' · ')
}

import type { BalonOrigenRecarga } from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'

/**
 * Etiqueta operativa: código · capacidad tipo · almacén.
 *
 * Ya no se muestra "disponible" por cilindro: el gas se controla en el stock global
 * del almacén (pro_stock) y el balón origen es solo trazabilidad. El dato anterior
 * era la capacidad nominal del tipo, así que un cilindro vacío se mostraba lleno.
 */
export function formatOrigenRecargaLabel(origen: BalonOrigenRecarga): string {
  const parts = [origen.codigo_balon]
  if (origen.capacidad_tipo != null) {
    parts.push(`cap. ${origen.capacidad_tipo}`)
  }
  if (origen.nombre_almacen) {
    parts.push(origen.nombre_almacen)
  }
  return parts.join(' · ')
}

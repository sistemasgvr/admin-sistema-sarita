import type { PosLineItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'

type LineaPrestamo = Pick<PosLineItem, 'escenarioGas' | 'idBalon' | 'idPrestamoRenovar'>

/** La línea entrega un cilindro en préstamo (nuevo o renovación). */
export function esLineaPrestamo(linea: LineaPrestamo): boolean {
  return linea.escenarioGas === 'entregar_prestamo' || linea.escenarioGas === 'entregar_alquiler'
}

/**
 * Renovación con el mismo cilindro: el cliente se queda con el que ya tiene y
 * no se elige uno nuevo del almacén.
 *
 * El backend lo soporta: `ven_aplicar_efectos_pos` llama a
 * `bal_renovar_prestamo` con `p_id_balon_nuevo = NULL`, que cierra el préstamo
 * anterior y abre el nuevo con el mismo cilindro. El POS, en cambio, exigía un
 * cilindro en toda línea de préstamo y bloqueaba la venta con «falta cilindro o
 * fecha de préstamo» (reporte del 19/11).
 */
export function esRenovacionMismoCilindro(linea: LineaPrestamo): boolean {
  return esLineaPrestamo(linea) && Boolean(linea.idPrestamoRenovar) && !linea.idBalon
}

/** Una línea de préstamo tiene su cilindro resuelto: uno elegido o el mismo de la renovación. */
export function prestamoTieneCilindro(linea: LineaPrestamo): boolean {
  return Boolean(linea.idBalon) || esRenovacionMismoCilindro(linea)
}

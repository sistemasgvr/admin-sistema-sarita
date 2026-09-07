/**
 * Regla única de "¿puedo entregar este cilindro?".
 *
 * Vive aquí, y no dentro de cada vista, porque la usan dos sitios que tienen que
 * decir lo mismo: el badge del listado de cilindros y el selector de balón del
 * POS. Antes cada uno tenía su propio criterio y acabaron contradiciéndose.
 *
 * Lo que decide la disponibilidad es DÓNDE está el cilindro, no de quién es:
 *
 *  - Sin almacén => está fuera (con el cliente, en ruta, en planta externa).
 *    `inv_registrar_movimiento` pone `id_almacen = NULL` en todas las salidas.
 *  - Con almacén pero en un estado que lo bloquea => está en el local pero
 *    comprometido (orden de salida) o inutilizable (taller).
 *
 * El propietario NO entra en la ecuación: un envase de un cliente que tenemos en
 * custodia (dejado en garantía o para recarga) es stock entregable mientras esté
 * en nuestro almacén.
 */

/** Está físicamente en el local, pero no se puede entregar. */
export const ESTADOS_NO_ENTREGABLES = new Set(['PENDIENTE_ENVIO', 'EN_MANTENIMIENTO'])

/** Salió del circuito para siempre. */
export const ESTADOS_TERMINALES = new Set(['DADO_DE_BAJA', 'ROBO'])

/**
 * Estados que por sí solos ya dicen que el cilindro NO está en nuestras manos.
 *
 * Normalmente son redundantes: la salida que los pone también deja
 * `id_almacen = NULL`, así que el almacén bastaría. Están aquí como red de
 * seguridad para los casos en que ambos datos se contradicen —edición manual
 * del cilindro, migraciones— donde el estado es la señal deliberada y el
 * almacén el residuo. Ante la duda, no se ofrece.
 */
export const ESTADOS_FUERA_DEL_ALMACEN = new Set([
  'PRESTADO_CLIENTE',
  'EN_PODER_CLIENTE',
  'ALQUILADO',
  'EN_RECARGA_EXTERNA',
  'EN_TRANSITO',
])

interface BalonDisponibilidad {
  id_almacen?: number | null
  nombre_estado_balon?: string | null
  nombre_cliente_ubicacion?: string | null
  nombre_almacen?: string | null
}

function nombreEstado(balon: BalonDisponibilidad): string {
  return (balon.nombre_estado_balon ?? '').trim().toUpperCase()
}

/**
 * Devuelve el motivo por el que NO se puede entregar, o `null` si sí se puede.
 * Se devuelve el motivo en vez de un booleano para que la UI pueda explicarlo
 * sin volver a deducirlo.
 */
export function motivoNoDisponible(balon: BalonDisponibilidad): string | null {
  const estado = nombreEstado(balon)
  const etiquetaEstado = balon.nombre_estado_balon?.trim() || 'sin estado'

  if (ESTADOS_TERMINALES.has(estado)) {
    return `Cilindro ${etiquetaEstado.toLowerCase()}: fuera de circulación.`
  }

  if (estado === 'PENDIENTE_ENVIO') {
    return 'Comprometido en una orden de salida pendiente de despacho.'
  }

  if (estado === 'EN_MANTENIMIENTO') {
    return 'En mantenimiento: no se puede llenar ni entregar.'
  }

  if (balon.id_almacen == null || ESTADOS_FUERA_DEL_ALMACEN.has(estado)) {
    return balon.nombre_cliente_ubicacion
      ? `Fuera del almacén, en poder de ${balon.nombre_cliente_ubicacion}.`
      : 'Fuera del almacén (en tránsito o en planta externa).'
  }

  return null
}

export function esBalonEntregable(balon: BalonDisponibilidad): boolean {
  return motivoNoDisponible(balon) === null
}

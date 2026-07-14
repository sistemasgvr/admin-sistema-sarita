import type { BadgeColor } from '@/shared/interfaces/badge.interface'

/** Normaliza códigos de gen_lista_opciones (mayúsculas, sin espacios). */
export function normalizeListaOpcionCode(value?: string | null | unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().toUpperCase().replace(/\s+/g, '_')
}

/**
 * Colores explícitos por código de catálogo.
 * Cubrir Productos / Balones / Ventas con tonos distinguibles.
 */
const LISTA_OPCION_BADGE_COLORS: Record<string, BadgeColor> = {
  // TipoMovInv
  INGRESO: 'success',
  SALIDA: 'error',
  TRASLADO: 'primary',
  AJUSTE: 'warning',

  // TipoDocumentoRef
  FACTURA: 'primary',
  GRE: 'neutral',
  PRESTAMO: 'warning',
  ALQUILER: 'primary',
  RECARGA: 'success',
  COMPRA: 'neutral',
  DEVOLUCION: 'success',

  // TipoCatalogoPrecio
  RECARGADO: 'success',
  GARANTIA: 'warning',
  VENTA_CILINDRO: 'error',
  ACCESORIO: 'primary',

  // TipoMovBalon
  SALIDA_VENTA: 'error',
  SALIDA_PRESTAMO: 'warning',
  SALIDA_ALQUILER: 'primary',
  SALIDA_MANTENIMIENTO: 'warning',
  ENTRADA_DEVOLUCION: 'success',
  ENTRADA_LLENADO: 'success',
  RECARGA_CLIENTE: 'primary',
  TRASLADO_LIMA: 'warning',
  RETORNO_LIMA: 'neutral',

  // EstadoBalon (también en balonEstadoBadge)
  EN_ALMACEN: 'success',
  POR_RECOGER: 'warning',
  PRESTADO_CLIENTE: 'primary',
  EN_RUTA_LIMA: 'neutral',
  EN_MANTENIMIENTO: 'warning',
  ALQUILADO: 'primary',
  DEVUELTO: 'neutral',
  ROBO: 'error',
  DADO_DE_BAJA: 'error',

  // TipoPrestamo
  ENVASE_EMPRESA_A_CLIENTE: 'primary',
  CILINDRO_CLIENTE_A_EMPRESA: 'warning',
  CILINDRO_A_PLANTA: 'neutral',

  // TipoMantenimiento
  PRUEBA_HIDROSTATICA: 'warning',
  RECERTIFICACION: 'primary',
  REPARACION: 'error',
  PINTURA: 'neutral',
  VALVULA: 'dark',

  // TipoRecarga
  CLIENTE: 'primary',
  PLANTA_EXTERNA: 'warning',

  // Estados genéricos de operaciones
  ACTIVO: 'success',
  CERRADO: 'neutral',
  VENCIDO: 'error',
  PENDIENTE: 'warning',
  FINALIZADO: 'neutral',
  COMPLETADO: 'success',
  FACTURADO: 'primary',
  ANULADO: 'error',
  CANCELADO: 'error',
  EN_CURSO: 'primary',
  EN_PROCESO: 'primary',

  // Estado documento / SUNAT
  PAGADO: 'success',
  ACEPTADO: 'success',
  RECHAZADO: 'error',
  OBSERVADO: 'warning',

  // TipoComprobante (nombre)
  BOLETA: 'success',
  NOTA_CREDITO: 'warning',
  NOTA_DEBITO: 'error',
  GUIA_REMISION: 'neutral',

  // Códigos SUNAT frecuentes
  '01': 'primary',
  '03': 'success',
  '07': 'warning',
  '08': 'error',
  '09': 'neutral',
}

/**
 * Heurística cuando el código no está en el mapa explícito.
 */
function inferListaOpcionBadgeColor(code: string): BadgeColor {
  if (!code) return 'neutral'

  if (
    code.includes('SALIDA') ||
    code.includes('BAJA') ||
    code.includes('ROBO') ||
    code.includes('ANUL') ||
    code.includes('RECHAZ') ||
    code.includes('VENCID') ||
    code.includes('ERROR')
  ) {
    return 'error'
  }

  if (
    code.includes('ENTRADA') ||
    code.includes('INGRESO') ||
    code.includes('DEVUEL') ||
    code.includes('ACEPT') ||
    code.includes('ACTIVO') ||
    code.includes('OK') ||
    code.includes('COMPLET') ||
    code.includes('PAGAD')
  ) {
    return 'success'
  }

  if (
    code.includes('PENDIEN') ||
    code.includes('AJUSTE') ||
    code.includes('TRASLADO') ||
    code.includes('MANTEN') ||
    code.includes('GARANT') ||
    code.includes('WARNING') ||
    code.includes('OBSERV') ||
    code.includes('POR_RECOGER')
  ) {
    return 'warning'
  }

  if (code.includes('RECARGA') || code.includes('ALQUIL') || code.includes('PREST')) {
    return 'primary'
  }

  return 'primary'
}

/** Color de badge para un código/nombre de gen_lista_opciones. */
export function listaOpcionBadgeColor(value?: string | null | unknown): BadgeColor {
  const code = normalizeListaOpcionCode(value)
  if (!code) return 'neutral'
  return LISTA_OPCION_BADGE_COLORS[code] ?? inferListaOpcionBadgeColor(code)
}

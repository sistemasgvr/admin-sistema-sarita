/**
 * Productos contables internos del POS (no se eligen del catálogo).
 * El alquiler NO va aquí: se facturan productos con es_alquilable del catálogo.
 */
export const CODIGO_PRODUCTO_VENTA_ENVASE = 'VTA-ENVASE'
export const NOMBRE_PRODUCTO_VENTA_ENVASE = 'Venta de envase'

export const CODIGOS_PRODUCTO_SISTEMA = [CODIGO_PRODUCTO_VENTA_ENVASE] as const

export type CodigoProductoSistema = (typeof CODIGOS_PRODUCTO_SISTEMA)[number]

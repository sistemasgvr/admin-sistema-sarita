/**
 * Código del tipo de documento "sin documento" en la lista TipoDocumento.
 *
 * Ojo con el homónimo: en TipoComprobante existe `VSD` = "venta sin documento",
 * que es otra cosa y sigue llamándose así. Esta constante es solo el tipo de
 * documento del cliente, y por eso vive en el módulo de clientes.
 */
export const TIPO_DOCUMENTO_SIN_DOCUMENTO = 'SD'

/** true si el código corresponde al cliente sin documento. */
export function esTipoDocumentoSinDocumento(codigo?: string | null): boolean {
  return (codigo ?? '').trim().toUpperCase() === TIPO_DOCUMENTO_SIN_DOCUMENTO
}

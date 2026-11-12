import type { ActualizarCompraCabeceraPayload } from '@/modules/compras/interfaces/compra.interface'

export interface ComprobanteFormValues {
  fecha?: string
  fechaEmision?: string
  idTipoComprobante?: string | number
  serie?: string
  numero?: string
}

export interface ComprobanteOriginal {
  fecha: string
  fecha_emision?: string | null
  id_tipo_comprobante: number | null
  serie: string | null
  numero: string | null
}

type PayloadComprobante = Pick<
  ActualizarCompraCabeceraPayload,
  'fecha' | 'fechaEmision' | 'idTipoComprobante' | 'serie' | 'numero'
>

/**
 * En edición solo se envía lo que cambió (lo omitido se conserva en el backend).
 * Vaciar: fecha de emisión y tipo → null; serie y número → ''.
 */
export function payloadComprobanteEdicion(
  values: ComprobanteFormValues,
  original: ComprobanteOriginal,
): PayloadComprobante {
  const texto = (v: unknown) => String(v ?? '').trim()
  const payload: PayloadComprobante = {}

  if (values.fecha && values.fecha !== original.fecha) payload.fecha = values.fecha

  const emision = texto(values.fechaEmision)
  if (emision !== texto(original.fecha_emision)) payload.fechaEmision = emision || null

  const tipo = texto(values.idTipoComprobante)
  const tipoOriginal = original.id_tipo_comprobante == null ? '' : String(original.id_tipo_comprobante)
  if (tipo !== tipoOriginal) payload.idTipoComprobante = tipo ? Number(tipo) : null

  if (texto(values.serie) !== texto(original.serie)) payload.serie = texto(values.serie)
  if (texto(values.numero) !== texto(original.numero)) payload.numero = texto(values.numero)
  return payload
}

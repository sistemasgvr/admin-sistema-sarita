export interface RetencionListItem {
  id: number
  serie: string
  numero: string
  fecha_emision: string
  id_empresa: number
  id_proveedor: number
  regimen: string
  tasa: number
  base_imponible: number
  monto_retenido: number
  monto_pagado: number
  id_estado_sunat: number | null
  ticket_sunat: string | null
  nombre_estado_sunat?: string | null
  nombre_proveedor?: string | null
  documento_proveedor?: string | null
}

export interface RetencionDetalle {
  id: number
  id_retencion: number
  id_compra: number | null
  tipo_doc: string
  num_doc: string
  fecha_emision: string
  fecha_retencion: string
  moneda: string
  imp_total: number
  imp_retenido: number
  imp_pagar: number
}

export interface Retencion extends RetencionListItem {
  id_sucursal: number | null
  observacion: string | null
  hash_documento: string | null
  xml_firmado: string | null
  cdr_respuesta: string | null
  id_estado: number | null
  estado: number
  detalles: RetencionDetalle[]
}

export interface CrearRetencionPayload {
  serie: string
  fechaEmision: string
  idEmpresa: number
  idProveedor: number
  idSucursal?: number
  regimen: string
  tasa: number
  baseImponible: number
  montoRetenido: number
  montoPagado: number
  observacion?: string
  detalles?: {
    idCompra?: number
    tipoDoc: string
    numDoc: string
    fechaEmision: string
    fechaRetencion: string
    moneda?: string
    impTotal: number
    impRetenido: number
    impPagar: number
  }[]
}

export interface EmitirRetencionResponse {
  documento: Retencion | null
  sunat: {
    ticket: string | null
    success: boolean
    respuesta: unknown
  }
}

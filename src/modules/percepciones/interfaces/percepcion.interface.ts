export interface PercepcionListItem {
  id: number
  serie: string
  numero: string
  fecha_emision: string
  id_empresa: number
  id_cliente: number
  regimen: string
  tasa: number
  base_imponible: number
  monto_percibido: number
  monto_cobrado: number
  id_estado_sunat: number | null
  ticket_sunat: string | null
  nombre_estado_sunat?: string | null
  nombre_cliente?: string | null
  documento_cliente?: string | null
}

export interface PercepcionDetalle {
  id: number
  id_percepcion: number
  id_comprobante: number | null
  tipo_doc: string
  num_doc: string
  fecha_emision: string
  fecha_percepcion: string
  moneda: string
  imp_total: number
  imp_percibido: number
  imp_cobrar: number
}

export interface Percepcion extends PercepcionListItem {
  id_sucursal: number | null
  observacion: string | null
  hash_documento: string | null
  xml_firmado: string | null
  cdr_respuesta: string | null
  id_estado: number | null
  estado: number
  detalles: PercepcionDetalle[]
}

export interface CrearPercepcionPayload {
  serie: string
  fechaEmision: string
  idEmpresa: number
  idCliente: number
  idSucursal?: number
  regimen: string
  tasa: number
  baseImponible: number
  montoPercibido: number
  montoCobrado: number
  observacion?: string
  detalles?: {
    idComprobante?: number
    tipoDoc: string
    numDoc: string
    fechaEmision: string
    fechaPercepcion: string
    moneda?: string
    impTotal: number
    impPercibido: number
    impCobrar: number
  }[]
}

export interface EmitirPercepcionResponse {
  documento: Percepcion | null
  sunat: {
    ticket: string | null
    success: boolean
    respuesta: unknown
  }
}

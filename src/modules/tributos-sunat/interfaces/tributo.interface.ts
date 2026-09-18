/**
 * Percepciones (sobre comprobantes de venta emitidos) y retenciones (sobre
 * compras registradas) comparten pantalla y flujo; solo cambian los nombres
 * de campo, rutas y permisos. `TributoConfig` guarda esas diferencias.
 */
export type TipoTributo = 'percepcion' | 'retencion'

export interface TributoListItem {
  id: number
  serie: string
  numero: string
  fecha_emision: string
  id_empresa: number
  regimen: string
  tasa: number
  base_imponible: number
  id_estado_sunat: number | null
  ticket_sunat: string | null
  nombre_estado_sunat?: string | null
  /** Percepción: cliente. Retención: proveedor. Ver TributoConfig.campos. */
  id_cliente?: number
  id_proveedor?: number
  nombre_cliente?: string | null
  nombre_proveedor?: string | null
  documento_cliente?: string | null
  documento_proveedor?: string | null
  monto_percibido?: number
  monto_cobrado?: number
  monto_retenido?: number
  monto_pagado?: number
}

export interface TributoDetalle {
  id: number
  tipo_doc: string
  num_doc: string
  fecha_emision: string
  moneda: string
  imp_total: number
  id_comprobante?: number | null
  id_compra?: number | null
  fecha_percepcion?: string
  fecha_retencion?: string
  imp_percibido?: number
  imp_cobrar?: number
  imp_retenido?: number
  imp_pagar?: number
}

export interface TributoRegistro extends TributoListItem {
  id_sucursal: number | null
  observacion: string | null
  hash_documento: string | null
  cdr_respuesta: string | null
  tipo_documento_cliente?: string | null
  tipo_documento_proveedor?: string | null
  detalles: TributoDetalle[]
}

/** Comprobante de venta / compra sobre el que se puede armar el documento. */
export interface OrigenElegible {
  id: number
  serie: string | null
  numero: string | null
  fecha: string
  tipo_doc: string | null
  nombre_tipo_comprobante: string | null
  total: number | string
  moneda: string | null
  nombre_estado_sunat?: string | null
  id_cliente?: number | null
  id_proveedor?: number | null
  nombre_cliente?: string | null
  nombre_proveedor?: string | null
  documento_cliente?: string | null
  documento_proveedor?: string | null
}

/** Tasa registrada para un régimen (catálogo TasaPercepcion / TasaRetencion). */
export interface TasaRegimen {
  id: number
  tasa: number
  /** Texto del catálogo tal cual («2%», «0.5%»). */
  etiqueta: string
}

export interface RegimenOpcion {
  id: number
  nombre: string
  /** Código SUNAT (catálogo 22 / 23). */
  descripcion: string | null
  /** Tasa propuesta: la menor registrada para el régimen. */
  tasa: number | null
  tasas: TasaRegimen[]
}

export interface TributoCatalogos {
  regimenesPercepcion?: RegimenOpcion[]
  regimenesRetencion?: RegimenOpcion[]
  estadosSunat: { id: number; nombre: string; descripcion: string | null }[]
}

/** Serie disponible con su correlativo, como en el modal de GRE. */
export interface SerieTributo {
  serie: string
  ultimo_numero: string | null
  siguiente_numero: string
  total: number
}

export interface SeriesTributoResponse {
  series: SerieTributo[]
}

export interface TributoListFilters {
  buscar?: string
  idEmpresa?: number
  fechaDesde?: string
  fechaHasta?: string
  idCliente?: number
  idProveedor?: number
  pagina?: number
  tamano?: number
}

export interface OrigenesElegiblesFilters {
  idCliente?: number
  idProveedor?: number
  buscar?: string
  limite?: number
}

export interface CrearTributoPayload {
  idEmpresa: number
  serie: string
  fechaEmision: string
  regimen: string
  tasa?: number
  observacion?: string
  /** Percepción: `comprobantes` (idComprobante, fechaCobro). Retención: `compras` (idCompra, fechaPago). */
  comprobantes?: { idComprobante: number; fechaCobro?: string }[]
  compras?: { idCompra: number; fechaPago?: string }[]
}

export interface TributoCreado {
  id: number
  serie: string
  numero: string
}

/** Vínculo mostrado en el comprobante/compra de origen. */
export interface TributoVinculado extends TributoCreado {
  nombre_estado_sunat?: string | null
}

export interface EmitirTributoResponse {
  documento: TributoRegistro
  sunat: {
    estado: string
    ticket: string | null
    respuesta: unknown
  }
}

export interface TributoConfig {
  tipo: TipoTributo
  /** Base del API: /percepciones o /retenciones. */
  api: string
  singular: string
  plural: string
  /** Quien recibe el documento (cliente / proveedor). */
  contraparte: string
  origenSingular: string
  origenPlural: string
  /** Momento que origina el tributo (cobro / pago). */
  operacion: string
  /** Solo de ejemplo: la serie real se elige entre las que devuelve la API. */
  serieEjemplo: string
  seriePrefijo: 'P' | 'R'
  rutas: { lista: string; nueva: string; detalle: string }
  paths: { lista: string; nueva: string }
  permisos: { listar: string; ver: string; crear: string; emitir: string }
  /** Nombres de campo específicos en API y BD. */
  campos: {
    idContraparte: 'id_cliente' | 'id_proveedor'
    nombreContraparte: 'nombre_cliente' | 'nombre_proveedor'
    documentoContraparte: 'documento_cliente' | 'documento_proveedor'
    montoTributo: 'monto_percibido' | 'monto_retenido'
    montoNeto: 'monto_cobrado' | 'monto_pagado'
    detalleTributo: 'imp_percibido' | 'imp_retenido'
    detalleNeto: 'imp_cobrar' | 'imp_pagar'
    detalleFecha: 'fecha_percepcion' | 'fecha_retencion'
    catalogoRegimenes: 'regimenesPercepcion' | 'regimenesRetencion'
    filtroContraparte: 'idCliente' | 'idProveedor'
  }
  breadcrumbPadre: { label: string; to: string }
  /** El selector de contraparte filtra proveedores (retención) o clientes (percepción). */
  soloProveedores: boolean
}

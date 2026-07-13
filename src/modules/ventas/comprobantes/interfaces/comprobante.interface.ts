export interface ComprobanteListItem {
  id: number
  id_tipo_comprobante: number
  nombre_tipo_comprobante?: string | null
  codigo_tipo_comprobante?: string | null
  serie: string
  numero: string
  fecha: string
  id_cliente: number
  nombre_cliente?: string | null
  documento_cliente?: string | null
  total_importe?: number | null
  id_estado?: number | null
  nombre_estado?: string | null
  id_estado_sunat?: number | null
  nombre_estado_sunat?: string | null
}

export interface ComprobanteDetalle {
  id?: number
  item?: number
  id_producto: number
  codigo_producto?: string | null
  nombre_producto?: string | null
  descripcion?: string | null
  cantidad: number
  precio_unitario: number
  descuento?: number | null
  porcentaje_igv?: number | null
  id_afectacion_igv?: number | null
  codigo_afectacion_igv?: string | null
  valor_venta?: number | null
  impuesto?: number | null
  importe?: number | null
}

export interface Comprobante extends ComprobanteListItem {
  sub_total?: number | null
  descuento?: number | null
  valor_venta?: number | null
  igv?: number | null
  exonerado?: number | null
  glosa?: string | null
  observaciones?: string | null
  hash_documento?: string | null
  xml_firmado?: string | null
  ticket_sunat?: string | null
  detalles: ComprobanteDetalle[]
  cuotas?: unknown[]
}

export interface ComprobanteListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idTipoComprobante?: number
  idCliente?: number
  idEstado?: number
  idEstadoSunat?: number
  fechaDesde?: string
  fechaHasta?: string
  serie?: string
}

export interface ComprobanteDetallePayload {
  idProducto: number
  cantidad: number
  precioUnitario: number
  descuento?: number
  porcentajeIgv?: number
  idAfectacionIgv?: number
  descripcion?: string
  idBalon?: number
}

export interface CreateComprobantePayload {
  idUsuarioAuditoria: number
  idTipoComprobante: number
  serie: string
  numero?: string
  fecha: string
  idCliente: number
  detalles: ComprobanteDetallePayload[]
  idTipoOperacionSunat?: number
  idMoneda?: number
  idMedioPago?: number
  idAlmacen?: number
  glosa?: string
  observaciones?: string
}

export interface EmitirComprobanteResponse {
  comprobante: Comprobante
  sunat: {
    estado: string
    hash: string | null
    ticket: string | null
    respuesta: unknown
  }
}

export interface SiguienteNumeroResponse {
  serie: string
  id_tipo_comprobante: number
  ultimo_numero: string | null
  numero: string
}

export interface ListaOpcionBasica {
  id: number
  nombre: string
  descripcion?: string | null
}

export interface ComprobanteCatalogosPos {
  tiposComprobante: ListaOpcionBasica[]
  afectacionesIgv: ListaOpcionBasica[]
  monedas: ListaOpcionBasica[]
  mediosPago: ListaOpcionBasica[]
  tiposOperacionSunat: ListaOpcionBasica[]
  estadosSunat: ListaOpcionBasica[]
}

export interface PosLineItem {
  key: string
  idProducto: number
  codigo: string
  nombre: string
  cantidad: number
  precioUnitario: number
  idAfectacionIgv?: number
}

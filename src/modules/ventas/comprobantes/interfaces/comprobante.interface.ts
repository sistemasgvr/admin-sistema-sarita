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
  id_comprobante_origen?: number | null
  serie_comprobante_origen?: string | null
  numero_comprobante_origen?: string | null
  codigo_tipo_comprobante_origen?: string | null
  nombre_tipo_comprobante_origen?: string | null
  id_motivo_nota?: number | null
  nombre_motivo_nota?: string | null
  codigo_motivo_nota?: string | null
  id_comprobante_destino?: number | null
  serie_comprobante_destino?: string | null
  numero_comprobante_destino?: string | null
  codigo_tipo_comprobante_destino?: string | null
  nombre_tipo_comprobante_destino?: string | null
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
  id_comprobante_origen?: number | null
  serie_comprobante_origen?: string | null
  numero_comprobante_origen?: string | null
  codigo_tipo_comprobante_origen?: string | null
  id_motivo_nota?: number | null
  codigo_motivo_nota?: string | null
  nombre_motivo_nota?: string | null
  id_moneda?: number | null
  id_medio_pago?: number | null
  id_almacen?: number | null
  id_tipo_operacion_sunat?: number | null
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
  idComprobanteOrigen?: number
  idMotivoNota?: number
  idMoneda?: number
  idMedioPago?: number
  idAlmacen?: number
  glosa?: string
  observaciones?: string
}

export interface UpdateComprobantePayload {
  idUsuarioAuditoria: number
  fecha?: string
  idCliente?: number
  detalles?: ComprobanteDetallePayload[]
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
    hash?: string | null
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
  motivosNotaCredito: ListaOpcionBasica[]
}

export interface ComprobanteResumenDiarioItem {
  id: number
  codigo_tipo_comprobante?: string | null
  nombre_tipo_comprobante?: string | null
  serie: string
  numero: string
  fecha: string
  id_cliente: number
  nombre_cliente?: string | null
  documento_cliente?: string | null
  nombre_estado_sunat?: string | null
  total_importe?: number | null
}

export interface ResumenDiarioPreview {
  fecha: string
  cantidad: number
  total: number
  items: ComprobanteResumenDiarioItem[]
}

export interface ResumenDiarioListItem {
  id: number
  fecha: string
  correlativo: string
  identificador?: string | null
  ticket_sunat?: string | null
  id_estado_sunat?: number | null
  nombre_estado_sunat?: string | null
  moneda?: string | null
  cantidad_docs: number
  total_importe: number
  total_igv?: number | null
  total_valor_venta?: number | null
  fecha_creacion?: string | null
  nombre_usuario_creacion?: string | null
}

export interface ResumenDiarioDetalle {
  id: number
  id_resumen: number
  id_comprobante: number
  item: number
  serie?: string | null
  numero?: string | null
  codigo_tipo_comprobante?: string | null
  nombre_tipo_comprobante?: string | null
  fecha_comprobante?: string | null
  total_importe?: number | null
  nombre_estado_sunat?: string | null
  nombre_cliente?: string | null
  documento_cliente?: string | null
}

export interface ResumenDiario extends ResumenDiarioListItem {
  cdr_respuesta?: string | null
  observacion?: string | null
  detalles: ResumenDiarioDetalle[]
}

export interface ResumenDiarioListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idEstadoSunat?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface EnviarResumenDiarioPayload {
  idUsuarioAuditoria: number
  fecha: string
  correlativo?: string
  idsComprobante?: number[]
}

export interface EnviarResumenDiarioResponse {
  resumen: ResumenDiario
  fecha: string
  correlativo: string
  cantidad: number
  items: ComprobanteResumenDiarioItem[]
  sunat: {
    estado: string
    ticket: string | null
    respuesta: unknown
  }
}

export interface ConsultarEstadoResumenResponse {
  resumen: ResumenDiario
  sunat: {
    estado: string
    ticket: string | null
    respuesta: unknown
  }
}

export interface SiguienteCorrelativoResumenResponse {
  fecha: string
  ultimo_correlativo: string | null
  correlativo: string
}

export interface PosLineItem {
  key: string
  idProducto: number
  codigo: string
  nombre: string
  cantidad: number
  precioUnitario: number
  idAfectacionIgv?: number
  afectaStock?: boolean
  /** Stock del almacén al momento de agregar (para validar cantidades). */
  stockDisponible?: number | null
}

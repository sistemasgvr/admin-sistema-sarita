export interface MovimientoRecarga {
  id: number
  fecha_salida_almacen: string
  id_balon: number
  codigo_balon?: string | null
  id_balon_origen?: number | null
  codigo_balon_origen?: string | null
  id_comprobante_compra?: number | null
  id_cliente?: number | null
  nombre_cliente?: string | null
  documento_cliente?: string | null
  id_tipo_recarga?: number | null
  tipo_recarga_nombre?: string | null
  tipo_recarga_descripcion?: string | null
  id_producto?: number | null
  nombre_producto?: string | null
  capacidad?: number | null
  id_unidad_medida?: number | null
  nombre_unidad_medida?: string | null
  serie_guia_salida?: string | null
  numero_guia_salida?: string | null
  serie_guia_ingreso?: string | null
  numero_guia_ingreso?: string | null
  serie_factura?: string | null
  numero_factura?: string | null
  id_comprobante?: number | null
  fecha_llegada_almacen?: string | null
  lote?: string | null
  fecha_vencimiento_lote?: string | null
  fecha_prueba_hidrostatica?: string | null
  id_proveedor?: number | null
  nombre_proveedor?: string | null
  observacion?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  puede_eliminar?: boolean
  estado: number
  fecha_creacion: string
  fecha_modificacion?: string
}

export interface BalonOrigenRecarga {
  id: number
  codigo_balon: string
  numero_serie?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  id_producto_gas: number
  nombre_producto?: string | null
  id_tipo_balon?: number | null
  nombre_tipo_balon?: string | null
  capacidad_tipo?: number | null
  capacidad_disponible: number
  capacidad_restante?: number | null
  fecha_creacion?: string | null
}

export interface OrigenRecargaFilters {
  idProductoGas: number
  capacidad?: number
  idAlmacen?: number
  idBalonPreferido?: number
  limite?: number
}

/** Slice de un balón empresa en una asignación FIFO multi-origen. */
export interface OrigenRecargaAsignado {
  id_balon: number
  codigo_balon: string
  cantidad: number
  capacidad_disponible: number
  capacidad_tipo?: number | null
  nombre_almacen?: string | null
  orden: number
}

export interface AsignacionOrigenesRecarga {
  origenes: OrigenRecargaAsignado[]
  requerido?: number
  idBalonOrigenPrincipal?: number
  etiqueta?: string
  totalDisponible?: number
}

export interface MovimientoRecargaListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idBalon?: number
  idAlmacen?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface CreateMovimientoRecargaPayload {
  idUsuarioAuditoria: number
  fechaSalidaAlmacen: string
  idBalon: number
  idProducto?: number
  capacidad?: number
  idUnidadMedida?: number
  serieGuiaSalida?: string
  numeroGuiaSalida?: string
  serieGuiaIngreso?: string
  numeroGuiaIngreso?: string
  serieFactura?: string
  numeroFactura?: string
  idComprobante?: number
  idComprobanteCompra?: number
  fechaLlegadaAlmacen?: string
  lote?: string
  fechaVencimientoLote?: string
  fechaPruebaHidrostatica?: string
  idProveedor?: number
  observacion?: string
  idAlmacen?: number
}

export interface VincularRecargaClienteComprobantePayload {
  idUsuarioAuditoria: number
  idComprobante: number
  idCliente: number
  idBalon: number
  idProducto: number
  capacidad?: number
  idAlmacen?: number
  observacion?: string
  /** Preferido / primer origen; el backend completa el resto por FIFO si hace falta. */
  idBalonOrigen?: number
}

export interface CreateRecargaClientePayload {
  idUsuarioAuditoria: number
  idCliente: number
  idBalon: number
  idProducto: number
  precioUnitario: number
  cantidad?: number
  idTipoComprobante?: number
  serie?: string
  capacidad?: number
  idMedioPago?: number
  idCondicionPago?: number
  fechaVencimiento?: string
  idAlmacen?: number
  observacion?: string
  /** Preferido / primer origen; el backend completa el resto por FIFO si hace falta. */
  idBalonOrigen?: number
}

export interface RecargaClienteResult {
  recarga: MovimientoRecarga
  comprobante: {
    id: number
    serie: string
    numero: string
    total_importe?: number
  }
}

export interface UpdateMovimientoRecargaPayload {
  idUsuarioAuditoria: number
  fechaSalidaAlmacen?: string
  idProducto?: number
  capacidad?: number
  idUnidadMedida?: number
  serieGuiaSalida?: string
  numeroGuiaSalida?: string
  serieGuiaIngreso?: string
  numeroGuiaIngreso?: string
  serieFactura?: string
  numeroFactura?: string
  idComprobante?: number
  idComprobanteCompra?: number
  fechaLlegadaAlmacen?: string
  lote?: string
  fechaVencimientoLote?: string
  fechaPruebaHidrostatica?: string
  idProveedor?: number
  observacion?: string
  idAlmacen?: number
}

export interface DeleteMovimientoRecargaResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type MovimientoRecargaFormMode = 'create' | 'edit'

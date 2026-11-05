export interface InventarioMovimientoListItem {
  id: number
  fecha: string
  naturaleza: 'PRODUCTO' | 'BALON'
  id_tipo_movimiento: number | null
  nombre_tipo_movimiento: string | null
  id_producto: number | null
  codigo_producto: string | null
  nombre_producto: string | null
  es_gas: boolean
  /** Categoría del producto o, en balones, el tipo de balón. */
  nombre_tipo_producto: string | null
  id_balon: number | null
  numero_serie_balon: string | null
  cantidad: number
  nombre_unidad_medida: string | null
  id_almacen_origen: number | null
  nombre_almacen_origen: string | null
  id_almacen_destino: number | null
  nombre_almacen_destino: string | null
  id_cliente: number | null
  nombre_cliente: string | null
  numero_documento_cliente: string | null
  stock_anterior: number | null
  stock_nuevo: number | null
  id_documento_origen: number | null
  id_documento_detalle: number | null
  id_tipo_documento_origen: number | null
  nombre_tipo_documento_origen: string | null
  /** Serie-número o correlativo del documento; `#id` si no tiene código propio. */
  codigo_documento_origen: string | null
  /** Importe de la línea atribuida a este movimiento; null si no se puede atribuir a una. */
  importe_linea: number | null
  /** Total del documento: se repite en cada movimiento del mismo documento. */
  total_documento: number | null
  moneda_documento: string | null
  id_movimiento_padre: number | null
  puede_anular: boolean
  glosa: string | null
  estado: number
  fecha_creacion: string
  fecha_modificacion: string | null
  id_usuario_creacion: number | null
  nombre_usuario_creacion: string | null
}

export interface InventarioMovimientoFilters {
  buscar?: string
  pagina?: number
  limite?: number
  naturaleza?: 'PRODUCTO' | 'BALON'
  idProducto?: number
  idBalon?: number
  idAlmacen?: number
  idTipoMovimiento?: number
  idTipoDocumentoOrigen?: number
  idDocumentoOrigen?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface CreateInventarioMovimientoPayload {
  naturaleza: 'PRODUCTO' | 'BALON'
  codigoTipoMovimiento: string
  fecha?: string
  idProducto?: number
  idBalon?: number
  cantidad: number
  idAlmacenOrigen?: number
  idAlmacenDestino?: number
  idCliente?: number
  codigoTipoDocumentoOrigen?: string
  idDocumentoOrigen?: number
  idDocumentoDetalle?: number
  glosa?: string
  idUsuarioAuditoria: number
  sentidoAjuste?: 'MAS' | 'MENOS'
}

export interface CreateTrasladoLoteInventarioPayload {
  fecha: string
  idAlmacen: number
  idAlmacenDestino: number
  detalles: Array<{ idProducto: number; cantidad: number }>
  glosa?: string
  idDocumentoRef?: number
  codigoDocumentoRef?: string
  idUsuarioAuditoria: number
}

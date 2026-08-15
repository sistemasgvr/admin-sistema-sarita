export type CompraFormMode = 'create' | 'edit'

export interface CompraListItem {
  id: number
  serie: string | null
  numero: string | null
  fecha: string
  id_proveedor: number | null
  nombre_proveedor?: string | null
  proveedor?: string | null
  id_almacen: number | null
  almacen: string | null
  sub_total: number | null
  total_importe: number
  estado: number
  tiene_movimientos_inventario: boolean
  id_comprobante_referencia: number | null
}

export interface CompraCabecera {
  id: number
  id_tipo_comprobante: number | null
  tipo_comprobante: string | null
  serie: string | null
  numero: string | null
  fecha: string
  id_proveedor: number | null
  proveedor: string | null
  proveedor_documento: string | null
  id_tipo_registro: number | null
  tipo_registro: string | null
  id_categoria_gasto: number | null
  categoria_gasto: string | null
  id_sucursal: number | null
  sucursal: string | null
  id_almacen: number | null
  almacen: string | null
  id_moneda: number | null
  moneda: string | null
  id_condicion_pago: number | null
  condicion_pago: string | null
  sub_total: number | null
  igv: number | null
  total_importe: number
  afecta_inventario: boolean
  declarar_sunat: boolean
  glosa: string | null
  id_estado: number | null
  estado_pago: string | null
  estado: number
  id_comprobante_referencia: number | null
  id_recarga_planta: number | null
  numero_recarga_planta: string | null
  tiene_movimientos_inventario: boolean
  puede_modificarse_parcial: boolean
  fecha_creacion: string | null
  fecha_modificacion: string | null
}

export interface CompraDetalle {
  id: number
  item: number
  id_producto: number | null
  codigo_producto: string | null
  nombre_producto: string | null
  descripcion: string
  id_unidad_medida: number | null
  unidad_medida: string | null
  id_almacen: number | null
  almacen: string | null
  cantidad: number
  precio_unitario: number | null
  importe: number
  afecta_stock: boolean
  id_clasificacion_gasto: number | null
  clasificacion_gasto: string | null
  id_estado_pago: number | null
  fecha_pago: string | null
  estado: number
}

export interface CompraCuotaPagar {
  id: number
  numero_cuota: number
  fecha_vencimiento: string | null
  monto_pendiente: number
  monto_abonado: number
  saldo: number
}

export interface CompraCuentaPorPagar {
  id: number
  descripcion: string | null
  numero_cuotas_total: number | null
  monto_pendiente: number
  monto_abonado: number
  saldo: number
  fecha_vencimiento: string | null
  cuotas: CompraCuotaPagar[]
}

export interface Compra {
  cabecera: CompraCabecera
  detalle: CompraDetalle[]
  cuenta_por_pagar?: CompraCuentaPorPagar | null
}

export interface CompraListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  fechaDesde?: string
  fechaHasta?: string
  idProveedor?: number
  idAlmacen?: number
  estado?: number
}

export interface CreateCompraDetallePayload {
  idClasificacionGasto?: number
  idProducto: number
  descripcion?: string
  idUnidadMedida?: number
  cantidad: number
  precioUnitario?: number
  idAlmacen?: number
}

export interface CreateCompraPayload {
  idUsuarioAuditoria: number
  idTipoComprobante?: number
  serie?: string
  numero?: string
  fecha: string
  idProveedor?: number
  idAlmacen?: number
  idComprobanteReferencia?: number
  idRecargaPlanta?: number
  /** Si true (o si se envía fechaLlegadaAlmacen): registra retorno e ingreso ENTRADA_PLANTA_EXTERNA. */
  guardarBalonesAlmacen?: boolean
  fechaLlegadaAlmacen?: string
  lote?: string
  fechaVencimientoLote?: string
  fechaPruebaHidrostatica?: string
  idGuiaRetorno?: number
  serieGuiaIngreso?: string
  numeroGuiaIngreso?: string
  idTipoRegistro?: number
  idCategoriaGasto?: number
  idSucursal?: number
  idMoneda?: number
  idCondicionPago?: number
  declararSunat?: boolean
  glosa?: string
  fechaVencimiento?: string
  cuotas?: { fechaPago: string; monto?: number }[]
  detalles: CreateCompraDetallePayload[]
}

export interface ActualizarCompraCabeceraPayload {
  idUsuarioAuditoria: number
  glosa?: string
  idCondicionPago?: number
  idCategoriaGasto?: number
  declararSunat?: boolean
  fechaVencimiento?: string
  cuotas?: { fechaPago: string; monto?: number }[]
}

export interface CreateCompraDetalleLineaPayload {
  idUsuarioAuditoria: number
  idProducto: number
  cantidad: number
  precioUnitario?: number
  idClasificacionGasto?: number
  descripcion?: string
  idUnidadMedida?: number
  idAlmacen?: number
}

export interface ActualizarCompraDetallePayload {
  idUsuarioAuditoria: number
  cantidad?: number
  precioUnitario?: number
}

export interface EliminarCompraResponse {
  eliminado: boolean
  id: number
}

export interface CompraLineaForm {
  key: string
  idProducto: number
  productoLabel: string
  cantidad: number
  precioUnitario: number
  idUnidadMedida?: number | null
  nombreUnidadMedida?: string | null
  esGas?: boolean
  esServicio?: boolean
  esAlquilable?: boolean
  nombreCategoria?: string | null
  marca?: string | null
  presentacion?: string | null
  /** Snapshot UI: si el producto genera ingreso al registrar la compra */
  afectaStock?: boolean
  /** Cilindros de la orden de recarga que alimentan esta línea de gas. */
  cilindrosRecarga?: number
}

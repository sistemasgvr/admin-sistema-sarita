export interface CompraListItem {
  id: number
  id_tipo_comprobante: number
  nombre_tipo_comprobante?: string | null
  serie?: string | null
  numero?: string | null
  fecha: string
  id_proveedor?: number | null
  razon_social_proveedor?: string | null
  doc_proveedor?: string | null
  id_tipo_registro?: number | null
  nombre_tipo_registro?: string | null
  id_categoria_gasto?: number | null
  nombre_categoria_gasto?: string | null
  id_sucursal?: number | null
  nombre_sucursal?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  id_moneda?: number | null
  nombre_moneda?: string | null
  id_condicion_pago?: number | null
  nombre_condicion_pago?: string | null
  sub_total?: number | null
  igv?: number | null
  total_importe: number
  afecta_inventario: boolean
  declarar_sunat: boolean
  glosa?: string | null
  id_estado?: number | null
  nombre_estado?: string | null
  fecha_creacion?: string | null
  fecha_modificacion?: string | null
}

export interface CompraDetalle {
  id?: number
  item?: number
  id_clasificacion_gasto?: number | null
  grupo?: string | null
  subgrupo?: string | null
  sub_subgrupo?: string | null
  id_producto?: number | null
  nombre_producto?: string | null
  descripcion: string
  id_unidad_medida?: number | null
  nombre_unidad_medida?: string | null
  cantidad: number
  precio_unitario?: number | null
  importe: number
  id_medio_pago?: number | null
  nombre_medio_pago?: string | null
  fecha_pago?: string | null
  numero_operacion?: string | null
  afecta_stock: boolean
  observacion?: string | null
}

export interface Compra extends CompraListItem {
  estado: number
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  detalles: CompraDetalle[]
}

export interface CompraListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  fechaDesde?: string
  fechaHasta?: string
  idProveedor?: number
  idTipoComprobante?: number
  idTipoRegistro?: number
}

export interface CreateCompraDetallePayload {
  idClasificacionGasto?: number
  idProducto?: number
  descripcion: string
  idUnidadMedida?: number
  cantidad: number
  precioUnitario?: number
  importe: number
  idMedioPago?: number
  fechaPago?: string
  numeroOperacion?: string
  afectaStock?: boolean
  observacion?: string
}

export interface CreateCompraPayload {
  idUsuarioAuditoria: number
  idTipoComprobante?: number
  serie?: string
  numero?: string
  fecha: string
  idProveedor?: number
  idTipoRegistro?: number
  idCategoriaGasto?: number
  idSucursal?: number
  idAlmacen?: number
  idMoneda?: number
  idCondicionPago?: number
  subTotal?: number
  igv?: number
  totalImporte: number
  afectaInventario?: boolean
  declararSunat?: boolean
  glosa?: string
  detalles: CreateCompraDetallePayload[]
}

export interface UpdateCompraDetallePayload {
  id?: number
  idClasificacionGasto?: number
  idProducto?: number
  descripcion?: string
  idUnidadMedida?: number
  cantidad?: number
  precioUnitario?: number
  importe?: number
  idMedioPago?: number
  fechaPago?: string
  numeroOperacion?: string
  afectaStock?: boolean
  observacion?: string
}

export interface UpdateCompraPayload {
  idUsuarioAuditoria: number
  idTipoComprobante?: number
  serie?: string
  numero?: string
  fecha?: string
  idProveedor?: number
  idTipoRegistro?: number
  idCategoriaGasto?: number
  idSucursal?: number
  idAlmacen?: number
  idMoneda?: number
  idCondicionPago?: number
  subTotal?: number
  igv?: number
  totalImporte?: number
  afectaInventario?: boolean
  declararSunat?: boolean
  glosa?: string
  detalles?: UpdateCompraDetallePayload[]
}

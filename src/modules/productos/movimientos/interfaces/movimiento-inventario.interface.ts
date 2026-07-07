export interface MovimientoInventario {
  id: number
  fecha: string
  id_producto: number
  codigo_producto: string
  nombre_producto: string
  id_almacen: number
  nombre_almacen: string
  id_tipo_movimiento: number
  nombre_tipo_movimiento: string
  cantidad: number
  stock_anterior?: number | null
  stock_nuevo?: number | null
  id_documento_ref?: number | null
  id_tipo_documento_ref?: number | null
  nombre_tipo_documento_ref?: string
  glosa?: string
  estado: number
  fecha_creacion: string
  fecha_modificacion: string
}

export interface MovimientoInventarioListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idProducto?: number
  idAlmacen?: number
  idTipoMovimiento?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface CreateMovimientoInventarioPayload {
  fecha: string
  idProducto: number
  idAlmacen: number
  idTipoMovimiento: number
  cantidad: number
  idDocumentoRef?: number
  idTipoDocumentoRef?: number
  glosa?: string
}

export interface UpdateMovimientoInventarioPayload {
  fecha?: string
  glosa?: string
  idDocumentoRef?: number
  idTipoDocumentoRef?: number
}

export interface DeleteMovimientoInventarioResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type MovimientoInventarioFormMode = 'create' | 'edit'

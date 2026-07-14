export interface MovimientoBalon {
  id: number
  id_balon: number
  codigo_balon?: string | null
  id_tipo_movimiento?: number | null
  nombre_tipo_movimiento?: string | null
  id_documento_ref?: number | null
  id_tipo_documento_ref?: number | null
  nombre_tipo_documento_ref?: string | null
  id_cliente?: number | null
  nombre_cliente?: string | null
  id_almacen_origen?: number | null
  nombre_almacen_origen?: string | null
  id_almacen_destino?: number | null
  nombre_almacen_destino?: string | null
  fecha_movimiento: string
  observacion?: string | null
  estado: number
  nombre_usuario_creacion?: string | null
  nombre_usuario_modificacion?: string | null
  fecha_creacion: string
  fecha_modificacion?: string
}

export interface MovimientoBalonListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idBalon?: number
  idTipoMovimiento?: number
  idCliente?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface CreateMovimientoBalonPayload {
  idUsuarioAuditoria: number
  idBalon: number
  idTipoMovimiento?: number
  idDocumentoRef?: number
  idTipoDocumentoRef?: number
  idCliente?: number
  idAlmacenOrigen?: number
  idAlmacenDestino?: number
  fechaMovimiento?: string
  observacion?: string
}

export interface UpdateMovimientoBalonPayload {
  idUsuarioAuditoria: number
  idTipoMovimiento?: number
  idDocumentoRef?: number
  idTipoDocumentoRef?: number
  idCliente?: number
  idAlmacenOrigen?: number
  idAlmacenDestino?: number
  fechaMovimiento?: string
  observacion?: string
}

export interface DeleteMovimientoBalonResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type MovimientoBalonFormMode = 'create' | 'edit'

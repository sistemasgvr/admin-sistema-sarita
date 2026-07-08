export interface Prestamo {
  id: number
  numero_prestamo?: string | null
  id_tipo_prestamo?: number | null
  nombre_tipo_prestamo?: string | null
  id_cliente?: number | null
  nombre_cliente?: string | null
  id_proveedor?: number | null
  nombre_proveedor?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  fecha_salida?: string | null
  fecha_retorno_pactada?: string | null
  fecha_retorno_real?: string | null
  titulo?: string | null
  observacion?: string | null
  id_estado?: number | null
  nombre_estado?: string | null
  id_comprobante_venta?: number | null
  id_comprobante_compra?: number | null
  total_detalles?: number | null
  estado: number
  fecha_creacion: string
  fecha_modificacion?: string | null
}

export interface PrestamoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idTipoPrestamo?: number
  idCliente?: number
  idEstado?: number
}

export interface CreatePrestamoPayload {
  idUsuarioAuditoria: number
  idTipoPrestamo: number
  numeroPrestamo?: string
  idCliente?: number
  idProveedor?: number
  idAlmacen?: number
  fechaSalida?: string
  fechaRetornoPactada?: string
  fechaRetornoReal?: string
  titulo?: string
  observacion?: string
  idEstado?: number
  idComprobanteVenta?: number
  idComprobanteCompra?: number
}

export interface UpdatePrestamoPayload {
  idUsuarioAuditoria: number
  idTipoPrestamo?: number
  numeroPrestamo?: string
  idCliente?: number
  idProveedor?: number
  idAlmacen?: number
  fechaSalida?: string
  fechaRetornoPactada?: string
  fechaRetornoReal?: string
  titulo?: string
  observacion?: string
  idEstado?: number
  idComprobanteVenta?: number
  idComprobanteCompra?: number
}

export interface DeletePrestamoResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type PrestamoFormMode = 'create' | 'edit'

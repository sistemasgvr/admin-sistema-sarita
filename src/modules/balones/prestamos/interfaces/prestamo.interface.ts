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
  /**
   * Cadena de renovaciones. Renovar no pisa el préstamo vigente: lo cierra y
   * abre uno nuevo enlazado por `id_prestamo_origen`, para que quede historial.
   */
  id_prestamo_origen?: number | null
  numero_prestamo_origen?: string | null
  /** Renovación que sustituyó a este préstamo (solo en el detalle). */
  id_prestamo_renovacion?: number | null
  numero_prestamo_renovacion?: string | null
  id_comprobante_venta?: number | null
  serie_comprobante_venta?: string | null
  numero_comprobante_venta?: string | null
  fecha_comprobante_venta?: string | null
  nombre_cliente_comprobante_venta?: string | null
  total_comprobante_venta?: number | null
  comprobante_venta?: string | null
  id_comprobante_compra?: number | null
  serie_comprobante_compra?: string | null
  numero_comprobante_compra?: string | null
  fecha_comprobante_compra?: string | null
  nombre_proveedor_comprobante_compra?: string | null
  total_comprobante_compra?: number | null
  comprobante_compra?: string | null
  total_detalles?: number | null
  total_garantias?: number | null
  puede_eliminar?: boolean
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

export interface RenovarPrestamoPayload {
  idBalonNuevo?: number
  /** Si se omite, el préstamo nuevo hereda la fecha del que se renueva. */
  fechaRetornoPactada?: string
  idUsuarioAuditoria?: number
}

export type PrestamoFormMode = 'create' | 'edit'

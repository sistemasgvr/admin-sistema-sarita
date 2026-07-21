export interface PrestamoDetalle {
  id: number
  id_prestamo: number
  numero_prestamo?: string | null
  id_balon?: number | null
  codigo_balon?: string | null
  id_tipo_prestamo?: number | null
  nombre_tipo_prestamo?: string | null
  id_cliente?: number | null
  nombre_cliente?: string | null
  id_producto?: number | null
  nombre_producto?: string | null
  motivo_especifico?: string | null
  fecha_entregado?: string | null
  fecha_prestamo?: string | null
  dias_prestamo?: number | null
  fecha_vencimiento?: string | null
  fecha_devolucion?: string | null
  serie_guia_entrega?: string | null
  numero_guia_entrega?: string | null
  serie_guia_devolucion?: string | null
  numero_guia_devolucion?: string | null
  id_estado?: number | null
  nombre_estado?: string | null
  observacion?: string | null
  estado: number
  fecha_creacion: string
  fecha_modificacion?: string | null
}

export interface PrestamoDetalleListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idPrestamo?: number
  idBalon?: number
  idEstado?: number
}

export interface CreatePrestamoDetallePayload {
  idUsuarioAuditoria: number
  idPrestamo: number
  idBalon?: number
  idProducto?: number
  motivoEspecifico?: string
  fechaEntregado?: string
  fechaPrestamo?: string
  diasPrestamo?: number
  fechaVencimiento?: string
  fechaDevolucion?: string
  serieGuiaEntrega?: string
  numeroGuiaEntrega?: string
  serieGuiaDevolucion?: string
  numeroGuiaDevolucion?: string
  idEstado?: number
  observacion?: string
}

export interface UpdatePrestamoDetallePayload {
  idUsuarioAuditoria: number
  idBalon?: number
  idProducto?: number
  motivoEspecifico?: string
  fechaEntregado?: string
  fechaPrestamo?: string
  diasPrestamo?: number
  fechaVencimiento?: string
  fechaDevolucion?: string
  serieGuiaEntrega?: string
  numeroGuiaEntrega?: string
  serieGuiaDevolucion?: string
  numeroGuiaDevolucion?: string
  idEstado?: number
  observacion?: string
}

export interface DeletePrestamoDetalleResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type PrestamoDetalleFormMode = 'create' | 'edit'

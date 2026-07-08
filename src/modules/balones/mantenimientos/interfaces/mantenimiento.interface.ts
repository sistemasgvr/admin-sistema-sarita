export interface Mantenimiento {
  id: number
  id_balon: number
  codigo_balon?: string | null
  id_tipo_mantenimiento?: number | null
  nombre_tipo_mantenimiento?: string | null
  fecha_ingreso: string
  fecha_salida?: string | null
  descripcion?: string | null
  costo?: number | null
  es_externo?: boolean | null
  id_proveedor?: number | null
  nombre_proveedor?: string | null
  id_estado?: number | null
  nombre_estado?: string | null
  id_comprobante_venta?: number | null
  id_comprobante_compra?: number | null
  observacion?: string | null
  estado: number
  fecha_creacion: string
  fecha_modificacion?: string | null
}

export interface MantenimientoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idBalon?: number
  idTipoMantenimiento?: number
  idEstado?: number
  esExterno?: boolean
}

export interface CreateMantenimientoPayload {
  idUsuarioAuditoria: number
  idBalon: number
  fechaIngreso: string
  idTipoMantenimiento?: number
  fechaSalida?: string
  descripcion?: string
  costo?: number
  esExterno?: boolean
  idProveedor?: number
  idEstado?: number
  idComprobanteVenta?: number
  idComprobanteCompra?: number
  observacion?: string
}

export interface UpdateMantenimientoPayload {
  idUsuarioAuditoria: number
  fechaIngreso?: string
  idTipoMantenimiento?: number
  fechaSalida?: string
  descripcion?: string
  costo?: number
  esExterno?: boolean
  idProveedor?: number
  idEstado?: number
  idComprobanteVenta?: number
  idComprobanteCompra?: number
  observacion?: string
}

export interface DeleteMantenimientoResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type MantenimientoFormMode = 'create' | 'edit'

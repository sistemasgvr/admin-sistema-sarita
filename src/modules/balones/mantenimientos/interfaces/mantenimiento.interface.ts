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
  observacion?: string | null
  puede_eliminar?: boolean
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
  vigenciaPhAnios?: number
  idOrganoInspector?: number
  organoInspectorNoAplica?: boolean
  numeroCertificadoPh?: string
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
  vigenciaPhAnios?: number
  idOrganoInspector?: number
  organoInspectorNoAplica?: boolean
  numeroCertificadoPh?: string
}

export interface DeleteMantenimientoResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type MantenimientoFormMode = 'create' | 'edit'

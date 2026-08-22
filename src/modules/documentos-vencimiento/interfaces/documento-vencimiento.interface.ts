export type EstadoVencimiento = 'VIGENTE' | 'POR_VENCER' | 'VENCIDO'

export interface DocumentoVencimiento {
  id: number
  id_categoria?: number | null
  nombre_categoria?: string | null
  descripcion: string
  id_vehiculo?: number | null
  vehiculo_placa?: string | null
  vehiculo_marca?: string | null
  vehiculo_modelo?: string | null
  id_sucursal?: number | null
  sucursal_nombre?: string | null
  fecha_vencimiento: string
  fecha_renovacion?: string | null
  numero_documento?: string | null
  observacion?: string | null
  id_estado?: number | null
  estado_calculado: EstadoVencimiento
  dias_para_vencer: number
  estado: number
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export type DocumentoVencimientoEstadoFiltro = 'activos' | 'inactivos' | 'todos'

export interface DocumentoVencimientoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  isActivos?: number
  idCategoria?: number
  idVehiculo?: number
  idSucursal?: number
  estado?: EstadoVencimiento
  diasAlerta?: number
}

export interface DocumentoVencimientoResumen {
  vigentes: number
  porVencer: number
  vencidos: number
}

export type AlcanceDocumentoVencimiento = 'empresa' | 'sucursal' | 'vehiculo'

export interface DocumentoVencimientoPayload {
  idUsuarioAuditoria: number
  idCategoria?: number
  descripcion: string
  idVehiculo?: number | null
  idSucursal?: number | null
  fechaVencimiento: string
  fechaRenovacion?: string
  numeroDocumento?: string
  observacion?: string
}

export type CreateDocumentoVencimientoPayload = DocumentoVencimientoPayload
export type UpdateDocumentoVencimientoPayload = DocumentoVencimientoPayload

export interface DeleteDocumentoVencimientoResponse {
  eliminado: boolean
  id: number
}

export type DocumentoVencimientoFormMode = 'create' | 'edit'

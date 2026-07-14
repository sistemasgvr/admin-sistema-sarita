export interface AlquilerDetalle {
  id: number
  id_alquiler: number
  numero_alquiler?: string | null
  id_balon: number
  codigo_balon?: string | null
  estado: number
  fecha_creacion: string
  fecha_modificacion?: string | null
}

export interface AlquilerDetalleListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idAlquiler?: number
  idBalon?: number
}

export interface CreateAlquilerDetallePayload {
  idUsuarioAuditoria: number
  idAlquiler: number
  idBalon: number
}

export interface UpdateAlquilerDetallePayload {
  idUsuarioAuditoria: number
  idBalon?: number
}

export interface DeleteAlquilerDetalleResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type AlquilerDetalleFormMode = 'create' | 'edit'

export interface AlquilerDetalle {
  id: number
  id_alquiler: number
  numero_alquiler?: string | null
  id_balon: number
  codigo_balon?: string | null
  fecha_devolucion?: string | null
  estado_devolucion?: 'PENDIENTE' | 'DEVUELTO' | string | null
  id_cliente?: number | null
  nombre_cliente?: string | null
  fecha_inicio?: string | null
  fecha_fin_pactada?: string | null
  fecha_fin_real?: string | null
  tarifa_diaria?: number | null
  id_estado?: number | null
  nombre_estado?: string | null
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

export interface DevolverAlquilerDetallePayload {
  idUsuarioAuditoria: number
  fechaDevolucion?: string
  idAlmacenDestino?: number
}

export interface DeleteAlquilerDetalleResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type AlquilerDetalleFormMode = 'create' | 'edit'

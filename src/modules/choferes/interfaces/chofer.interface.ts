export interface Chofer {
  id: number
  id_cliente?: number | null
  cliente_razon_social?: string | null
  cliente_nombres?: string | null
  cliente_apellido_paterno?: string | null
  cliente_apellido_materno?: string | null
  cliente_numero_documento?: string | null
  nombres: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  id_tipo_documento: number
  nombre_tipo_documento?: string | null
  numero_documento: string
  brevete?: string | null
  telefono?: string | null
  estado: number
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export type ChoferEstadoFiltro = 'activos' | 'inactivos' | 'todos'

export interface ChoferListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  isActivos?: number | null
  idCliente?: number
}

export interface ChoferPayload {
  idUsuarioAuditoria: number
  idCliente?: number
  nombres: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  idTipoDocumento: number
  numeroDocumento: string
  brevete?: string
  telefono?: string
}

export type CreateChoferPayload = ChoferPayload
export type UpdateChoferPayload = ChoferPayload

export interface DeleteChoferResponse {
  eliminado: boolean
  id: number
}

export type ChoferFormMode = 'create' | 'edit'

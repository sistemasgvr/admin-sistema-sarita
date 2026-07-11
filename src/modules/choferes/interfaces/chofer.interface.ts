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
  telefono?: string | null
  id_licencia?: number | null
  codigo_licencia?: string | null
  fecha_emision?: string | null
  fecha_vencimiento?: string | null
  id_tipo_licencia?: number | null
  nombre_tipo_licencia?: string | null
  id_categoria_licencia?: number | null
  nombre_categoria_licencia?: string | null
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
  telefono?: string
  codigoLicencia?: string
  fechaEmision?: string
  fechaVencimiento?: string
  idTipoLicencia?: number
  idCategoriaLicencia?: number
}

export type CreateChoferPayload = ChoferPayload
export type UpdateChoferPayload = ChoferPayload

export interface DeleteChoferResponse {
  eliminado: boolean
  id: number
}

export type ChoferFormMode = 'create' | 'edit'
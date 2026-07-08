export interface Direccion {
  id: number
  id_cliente: number
  cliente_razon_social?: string | null
  cliente_nombres?: string | null
  cliente_apellido_paterno?: string | null
  cliente_apellido_materno?: string | null
  cliente_numero_documento?: string | null
  descripcion?: string | null
  direccion: string
  id_pais?: number | null
  nombre_pais?: string | null
  id_departamento?: number | null
  nombre_departamento?: string | null
  id_provincia?: number | null
  nombre_provincia?: string | null
  id_distrito?: number | null
  nombre_distrito?: string | null
  referencia?: string | null
  es_principal: boolean
  estado: number
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export type DireccionEstadoFiltro = 'activos' | 'inactivos' | 'todos'

export interface DireccionListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  soloActivos?: number | null
  idCliente?: number
}

export interface CreateDireccionPayload {
  idUsuarioAuditoria: number
  idCliente: number
  direccion: string
  descripcion?: string
  idDepartamento?: number
  idProvincia?: number
  idDistrito?: number
  referencia?: string
  esPrincipal?: boolean
}

export interface UpdateDireccionPayload {
  idUsuarioAuditoria: number
  direccion?: string
  descripcion?: string
  idDepartamento?: number
  idProvincia?: number
  idDistrito?: number
  referencia?: string
  esPrincipal?: boolean
}

export interface DeleteDireccionResponse {
  eliminado: boolean
  id: number
}

export type DireccionFormMode = 'create' | 'edit'

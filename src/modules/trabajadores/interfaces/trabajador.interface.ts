export interface Trabajador {
  id: number
  nombres: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  id_tipo_documento?: number | null
  nombre_tipo_documento?: string | null
  numero_documento?: string | null
  direccion?: string | null
  referencia?: string | null
  latitud?: number | null
  longitud?: number | null
  id_pais?: number | null
  nombre_pais?: string | null
  id_departamento?: number | null
  nombre_departamento?: string | null
  id_provincia?: number | null
  nombre_provincia?: string | null
  id_distrito?: number | null
  nombre_distrito?: string | null
  fecha_nacimiento?: string | null
  edad?: number | null
  fecha_inicio?: string | null
  fecha_cese?: string | null
  id_area?: number | null
  nombre_area?: string | null
  id_cargo?: number | null
  nombre_cargo?: string | null
  id_usuario?: number | null
  nombre_usuario_vinculo?: string | null
  id_chofer?: number | null
  nombre_chofer?: string | null
  estado: number
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export type TrabajadorEstadoFiltro = 'activos' | 'cesados' | 'todos'

export interface TrabajadorListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  estado?: number | null
  idArea?: number
  idCargo?: number
}

export interface TrabajadorPayload {
  idUsuarioAuditoria: number
  nombres: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  idTipoDocumento?: number
  numeroDocumento?: string
  direccion?: string
  referencia?: string
  latitud?: number
  longitud?: number
  idPais?: number
  idDepartamento?: number
  idProvincia?: number
  idDistrito?: number
  fechaNacimiento?: string
  fechaInicio?: string
  fechaCese?: string
  idArea?: number
  idCargo?: number
  idUsuarioVinculo?: number
  idChofer?: number
}

export type CreateTrabajadorPayload = TrabajadorPayload
export type UpdateTrabajadorPayload = TrabajadorPayload

export interface DeleteTrabajadorResponse {
  eliminado: boolean
  id: number
}

export type TrabajadorFormMode = 'create' | 'edit'

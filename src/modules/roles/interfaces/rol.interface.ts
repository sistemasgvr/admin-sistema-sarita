export interface RolPermiso {
  id: number
  nombre: string
  descripcion?: string
}

export interface Rol {
  id: number
  nombre: string
  descripcion?: string
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
  cantidad_permisos?: number
  cantidad_usuarios?: number
  permisos?: RolPermiso[]
}

export interface RolListFilters {
  buscar?: string
  pagina?: number
  limite?: number
}

export interface CreateRolPayload {
  nombre: string
  descripcion?: string
}

export interface UpdateRolPayload {
  nombre?: string
  descripcion?: string
}

export interface DeleteRolResponse {
  eliminado: boolean
  id: number
}

export interface RolPermisoAsignacion {
  id: number
  id_rol: number
  nombre_rol: string
  id_permiso: number
  nombre_permiso: string
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
}

export interface RolPermisoListFilters {
  idRol?: number
  idPermiso?: number
  pagina?: number
  limite?: number
}

export interface AsignarRolPermisoPayload {
  idRol: number
  idPermiso: number
}

export type RolFormMode = 'create' | 'edit'

export interface Permiso {
  id: number
  nombre: string
  descripcion?: string
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
  cantidad_roles?: number
}

export interface PermisoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
}

export interface CreatePermisoPayload {
  nombre: string
  descripcion?: string
}

export interface UpdatePermisoPayload {
  nombre?: string
  descripcion?: string
}

export interface DeletePermisoResponse {
  eliminado: boolean
  id: number
}

export type PermisoFormMode = 'create' | 'edit'

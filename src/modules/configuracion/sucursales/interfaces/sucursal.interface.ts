export interface Sucursal {
  id: number
  codigo: string
  nombre: string
  direccion?: string
  id_departamento?: number
  nombre_departamento?: string | null
  id_provincia?: number
  nombre_provincia?: string | null
  id_distrito?: number
  nombre_distrito?: string | null
  telefono?: string
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
}

export interface SucursalListFilters {
  buscar?: string
  pagina?: number
  limite?: number
}

export interface CreateSucursalPayload {
  codigo: string
  nombre: string
  direccion?: string
  idDepartamento?: number
  idProvincia?: number
  idDistrito?: number
  telefono?: string
}

export interface UpdateSucursalPayload {
  codigo?: string
  nombre?: string
  direccion?: string
  idDepartamento?: number
  idProvincia?: number
  idDistrito?: number
  telefono?: string
}

export interface DeleteSucursalResponse {
  eliminado: boolean
  id: number
}

export type SucursalFormMode = 'create' | 'edit'

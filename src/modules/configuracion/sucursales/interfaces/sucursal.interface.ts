export interface Sucursal {
  id: number
  codigo: string
  nombre: string
  direccion?: string
  id_departamento?: number
  id_provincia?: number
  id_distrito?: number
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
  telefono?: string
}

export interface UpdateSucursalPayload {
  codigo?: string
  nombre?: string
  direccion?: string
  telefono?: string
}

export interface DeleteSucursalResponse {
  eliminado: boolean
  id: number
}

export type SucursalFormMode = 'create' | 'edit'

export interface Almacen {
  id: number
  id_sucursal: number
  nombre_sucursal?: string
  nombre: string
  ubicacion?: string
  descripcion?: string
  estado: boolean
  fecha_creacion: string
  fecha_modificacion: string
}

export interface AlmacenListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idSucursal?: number
}

export interface CreateAlmacenPayload {
  idSucursal: number
  nombre: string
  ubicacion?: string
  descripcion?: string
}

export interface UpdateAlmacenPayload {
  idSucursal?: number
  nombre?: string
  ubicacion?: string
  descripcion?: string
}

export interface DeleteAlmacenResponse {
  eliminado: boolean
  id: number
}

export type AlmacenFormMode = 'create' | 'edit'

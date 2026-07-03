export interface CategoriaProducto {
  id: number
  nombre: string
  descripcion?: string
  estado: number
  total_sub_categorias?: number
  fecha_creacion: string
  fecha_modificacion: string
}

export interface CategoriaProductoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
}

export interface CreateCategoriaProductoPayload {
  nombre: string
  descripcion?: string
}

export interface UpdateCategoriaProductoPayload {
  nombre?: string
  descripcion?: string
}

export interface DeleteCategoriaProductoResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type CategoriaProductoFormMode = 'create' | 'edit'

export interface SubCategoriaProducto {
  id: number
  id_categoria: number
  nombre_categoria?: string
  nombre: string
  descripcion?: string
  estado: number
  total_productos?: number
  fecha_creacion: string
  fecha_modificacion: string
}

export interface SubCategoriaProductoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idCategoria?: number
}

export interface CreateSubCategoriaProductoPayload {
  idCategoria: number
  nombre: string
  descripcion?: string
}

export interface UpdateSubCategoriaProductoPayload {
  idCategoria?: number
  nombre?: string
  descripcion?: string
}

export interface DeleteSubCategoriaProductoResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type SubCategoriaProductoFormMode = 'create' | 'edit'

export interface Producto {
  id: number
  codigo: string
  codigo_barra?: string
  codigo_ubicacion?: string | null
  nombre: string
  id_sub_categoria?: number
  nombre_sub_categoria?: string
  id_categoria?: number
  nombre_categoria?: string
  id_unidad_medida?: number
  nombre_unidad_medida?: string
  marca?: string
  presentacion?: string
  es_gas: boolean
  es_servicio: boolean
  es_alquilable: boolean
  afecta_stock: boolean
  precio: number
  stock_actual?: number | null
  stock_minimo?: number | null
  stock_bajo?: boolean | null
  estado: number
  fecha_creacion: string
  fecha_modificacion: string
}

export interface ProductoListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idSubCategoria?: number
  idCategoria?: number
  esGas?: boolean
  esServicio?: boolean
  esAlquilable?: boolean
  afectaStock?: boolean
  soloActivos?: number | null
  idAlmacen?: number
}

export interface CreateProductoPayload {
  codigo: string
  nombre: string
  idSubCategoria?: number
  codigoBarra?: string
  codigoUbicacion?: string
  idUnidadMedida?: number
  marca?: string
  presentacion?: string
  esGas?: boolean
  esServicio?: boolean
  esAlquilable?: boolean
  afectaStock?: boolean
  precio?: number
}

export interface UpdateProductoPayload {
  codigo?: string
  nombre?: string
  idSubCategoria?: number
  codigoBarra?: string
  codigoUbicacion?: string
  idUnidadMedida?: number
  marca?: string
  presentacion?: string
  esGas?: boolean
  esServicio?: boolean
  esAlquilable?: boolean
  afectaStock?: boolean
  precio?: number
}

export interface DeleteProductoResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type ProductoFormMode = 'create' | 'edit'
export type ProductoEstadoFiltro = 'activos' | 'inactivos' | 'todos'

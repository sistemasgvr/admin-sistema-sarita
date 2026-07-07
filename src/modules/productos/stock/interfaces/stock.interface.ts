export interface Stock {
  id: number
  id_almacen: number
  nombre_almacen: string
  id_sucursal: number
  nombre_sucursal: string
  id_producto: number
  codigo_producto: string
  nombre_producto: string
  id_unidad_medida?: number
  nombre_unidad_medida?: string
  stock: number
  stock_minimo: number
  bajo_minimo: boolean
  estado: number
  fecha_creacion: string
  fecha_modificacion: string
}

export interface StockListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idAlmacen?: number
  idProducto?: number
  soloBajoMinimo?: boolean
}

export interface CreateStockPayload {
  idAlmacen: number
  idProducto: number
  stock?: number
  stockMinimo?: number
}

export interface UpdateStockPayload {
  stock?: number
  stockMinimo?: number
}

export interface DeleteStockResponse {
  eliminado: boolean
  id: number
  error?: string
}

export type StockFormMode = 'create' | 'edit'

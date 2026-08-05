export interface Stock {
  id: number
  id_almacen: number
  nombre_almacen: string
  id_sucursal: number
  nombre_sucursal: string
  id_producto: number
  codigo_producto: string
  nombre_producto: string
  /** true = stock alineado a balones empresa LLENO en almacén */
  es_gas?: boolean
  id_unidad_medida?: number
  nombre_unidad_medida?: string
  id_sub_categoria?: number | null
  nombre_sub_categoria?: string | null
  id_categoria?: number | null
  nombre_categoria?: string | null
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
  soloActivos?: number | null
}

export interface CreateStockPayload {
  idAlmacen: number
  idProducto: number
  stock?: number
  stockMinimo?: number
}

export interface UpdateStockPayload {
  /** Solo stock mínimo. La cantidad cambia por movimientos. */
  stockMinimo?: number
}

export interface DeleteStockResponse {
  eliminado: boolean
  id: number
  error?: string
}

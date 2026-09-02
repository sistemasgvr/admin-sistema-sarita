export interface StockGas {
  id_producto_gas: number
  codigo_producto?: string | null
  nombre_producto?: string | null
  nombre_unidad_medida?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  /** Stock actual en pro_stock (alias histórico: capacidad_disponible). */
  capacidad_disponible: number
  stock_minimo?: number | null
  bajo_minimo?: boolean
}

export interface StockGasListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idAlmacen?: number
  idProductoGas?: number
}

export interface StockGasResumen {
  total_productos?: number
  capacidad_disponible?: number
  bajo_minimo?: number
}

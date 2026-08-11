export interface StockGas {
  id_producto_gas: number
  codigo_producto?: string | null
  nombre_producto?: string | null
  nombre_unidad_medida?: string | null
  id_almacen?: number | null
  nombre_almacen?: string | null
  balones_llenos: number
  capacidad_disponible: number
  capacidad_disponible_lb?: number
  balones_vacios: number
  balones_llenos_fuera: number
  tiene_stock_disponible: boolean
}

export interface StockGasListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  idAlmacen?: number
  idProductoGas?: number
}

export interface StockGasResumen {
  balones_llenos?: number
  capacidad_disponible?: number
  capacidad_disponible_lb?: number
  balones_vacios?: number
  balones_llenos_fuera?: number
}

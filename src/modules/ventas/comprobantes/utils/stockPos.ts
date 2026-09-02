import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'

/**
 * Accesorios físicos descontan pro_stock.
 * Gas: inventario físico en balones (no pro_stock).
 * Servicios / alquilables no afectan stock de almacén.
 */
export function productoAfectaStock(
  producto: Pick<Producto, 'afecta_stock' | 'es_servicio' | 'es_alquilable' | 'es_gas'>,
): boolean {
  if (producto.es_gas) return false
  if (producto.afecta_stock === false) return false
  if (producto.afecta_stock === true) return true
  if (producto.es_servicio || producto.es_alquilable) return false
  return true
}

export function productoSinStockParaVenta(producto: Producto): boolean {
  if (!productoAfectaStock(producto)) return false
  if (producto.stock_actual == null) return false
  return Number(producto.stock_actual) <= 0
}

/** Gas: sin cilindros con m³ disponible en el almacén (no usa pro_stock). */
export function productoGasSinStockParaVenta(
  producto: Pick<Producto, 'es_gas'>,
  info?: StockGasPosInfo | null,
  options?: { sinAlmacen?: boolean; stockGasListo?: boolean },
): boolean {
  if (!producto.es_gas) return false
  if (options?.sinAlmacen) return true
  if (options?.stockGasListo === false) return false
  return stockGasSinDisponible(info)
}

/**
 * Valida si se puede agregar/aumentar cantidad en el carrito POS.
 * @returns mensaje de error o null si está permitido
 */
export function validarStockParaAgregar(
  producto: Producto,
  cantidadDeseada: number,
  options?: {
    requiereAlmacenSeleccionado?: boolean
    stockGas?: StockGasPosInfo | null
    sinAlmacen?: boolean
  },
): string | null {
  if (producto.es_gas) {
    if (options?.sinAlmacen) {
      return options?.requiereAlmacenSeleccionado
        ? 'Selecciona un almacén para verificar el stock del producto'
        : `${producto.nombre} no tiene stock disponible`
    }
    if (!('stockGas' in (options ?? {}))) return null

    const info = options?.stockGas
    if (stockGasSinDisponible(info)) {
      return `${producto.nombre} no tiene stock disponible`
    }
    const disponible = Number(info?.capacidad_disponible || 0)
    if (cantidadDeseada > disponible) {
      return `${producto.nombre}: stock insuficiente (disponible: ${formatStockPos(disponible)})`
    }
    return null
  }

  if (!productoAfectaStock(producto)) return null

  if (producto.stock_actual == null) {
    if (options?.requiereAlmacenSeleccionado) {
      return 'Selecciona un almacén para verificar el stock del producto'
    }
    return null
  }

  const stock = Number(producto.stock_actual)
  if (stock <= 0) {
    return `${producto.nombre} no tiene stock disponible`
  }

  if (cantidadDeseada > stock) {
    return `${producto.nombre}: stock insuficiente (disponible: ${formatStockPos(stock)})`
  }

  return null
}

export function formatStockPos(value: number): string {
  return new Intl.NumberFormat('es-PE', {
    maximumFractionDigits: 2,
  }).format(value)
}

export function etiquetaStockPos(producto: Producto): string | null {
  if (!productoAfectaStock(producto)) return null
  if (producto.stock_actual == null) return null
  const um = producto.nombre_unidad_medida?.trim()
  const qty = formatStockPos(Number(producto.stock_actual))
  return um ? `Stock: ${qty} ${um}` : `Stock: ${qty}`
}

/** Stock de gas global (pro_stock), no conteo de cilindros. */
export interface StockGasPosInfo {
  capacidad_disponible: number
  nombre_unidad_medida?: string | null
}

export function etiquetaStockGasPos(
  info?: StockGasPosInfo | null,
  options?: { sinAlmacen?: boolean },
): string | null {
  if (options?.sinAlmacen) return 'Selecciona almacén'
  if (!info) return 'Stock: 0'
  const um = info.nombre_unidad_medida?.trim()
  const qty = formatStockPos(Number(info.capacidad_disponible || 0))
  return um ? `Stock: ${qty} ${um}` : `Stock: ${qty}`
}

export function stockGasSinDisponible(info?: StockGasPosInfo | null): boolean {
  if (!info) return true
  return Number(info.capacidad_disponible || 0) <= 0
}

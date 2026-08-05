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

/**
 * Valida si se puede agregar/aumentar cantidad en el carrito POS.
 * @returns mensaje de error o null si está permitido
 */
export function validarStockParaAgregar(
  producto: Producto,
  cantidadDeseada: number,
  options?: { requiereAlmacenSeleccionado?: boolean },
): string | null {
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

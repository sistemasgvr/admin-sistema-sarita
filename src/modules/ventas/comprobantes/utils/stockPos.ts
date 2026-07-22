import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'

/** Productos que no afectan inventario pueden venderse sin stock. */
export function productoAfectaStock(producto: Pick<Producto, 'afecta_stock'>): boolean {
  return producto.afecta_stock !== false
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

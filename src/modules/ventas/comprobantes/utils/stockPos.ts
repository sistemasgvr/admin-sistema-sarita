import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'

/**
 * Gas y accesorios físicos descontan inventario.
 * Servicios / alquilables no (el cilindro se gestiona en balones).
 */
export function productoAfectaStock(
  producto: Pick<Producto, 'afecta_stock' | 'es_servicio' | 'es_alquilable' | 'es_gas'>,
): boolean {
  if (producto.afecta_stock === false) return false
  if (producto.afecta_stock === true) return true
  if (producto.es_gas) return true
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
  if (producto.es_gas) {
    return um ? `Stock gas: ${qty} ${um}` : `Stock gas: ${qty}`
  }
  return um ? `Stock: ${qty} ${um}` : `Stock: ${qty}`
}

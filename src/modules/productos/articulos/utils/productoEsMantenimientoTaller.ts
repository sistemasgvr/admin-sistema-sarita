import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'

function textoClaveProducto(producto: Pick<Producto, 'codigo' | 'nombre'>): string {
  return `${producto.codigo} ${producto.nombre}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/**
 * Servicio que entra a taller (cilindro). El resto de servicios solo se cobra.
 * Fuente de verdad: `es_mantenimiento` en el producto. El nombre es solo respaldo
 * de catálogos viejos sin el flag.
 */
export function productoEsMantenimientoTaller(
  producto: Pick<Producto, 'codigo' | 'nombre' | 'es_servicio' | 'es_alquilable'> & {
    es_mantenimiento?: boolean | null
  },
): boolean {
  if (producto.es_mantenimiento === true) return true
  if (producto.es_mantenimiento === false) return false
  if (!producto.es_servicio || producto.es_alquilable) return false
  const texto = textoClaveProducto(producto)
  return /mantenim|\bp\.?\s*h\.?\b|hidraul|prueba hidr/.test(texto)
}

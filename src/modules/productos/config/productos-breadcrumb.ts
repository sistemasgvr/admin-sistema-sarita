import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export const PRODUCTOS_HUB_PATH = '/admin/productos'
export const PRODUCTOS_ARTICULOS_PATH = '/admin/productos/articulos'
export const PRODUCTOS_MOVIMIENTOS_PATH = '/admin/productos/movimientos'

export function productosBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Productos', to: PRODUCTOS_HUB_PATH },
    { label: pageTitle },
  ]
}

export function productosArticulosBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Productos', to: PRODUCTOS_HUB_PATH },
    { label: 'Catálogo', to: PRODUCTOS_ARTICULOS_PATH },
    { label: pageTitle },
  ]
}

export function productosMovimientosBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Productos', to: PRODUCTOS_HUB_PATH },
    { label: 'Movimientos', to: PRODUCTOS_MOVIMIENTOS_PATH },
    { label: pageTitle },
  ]
}

import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export const PRODUCTOS_HUB_PATH = '/admin/productos'
export const PRODUCTOS_ARTICULOS_PATH = '/admin/productos/articulos'

export function productosBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Productos', to: PRODUCTOS_HUB_PATH },
    { label: pageTitle },
  ]
}

export function productosArticulosBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Productos', to: PRODUCTOS_HUB_PATH },
    { label: 'Artículos', to: PRODUCTOS_ARTICULOS_PATH },
    { label: pageTitle },
  ]
}

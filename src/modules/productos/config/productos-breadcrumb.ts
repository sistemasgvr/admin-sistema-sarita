import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export const PRODUCTOS_HUB_PATH = '/admin/productos'

export function productosBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Productos', to: PRODUCTOS_HUB_PATH },
    { label: pageTitle },
  ]
}

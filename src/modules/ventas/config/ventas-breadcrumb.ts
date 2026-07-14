import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export const VENTAS_HUB_PATH = '/admin/ventas'

export function ventasBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Ventas', to: VENTAS_HUB_PATH },
    { label: pageTitle },
  ]
}

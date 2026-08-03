import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export const COMPRAS_PATH = '/admin/compras'

export function comprasBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [{ label: pageTitle }]
}

export function comprasFormBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Compras', to: COMPRAS_PATH },
    { label: pageTitle },
  ]
}

import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export const COMPRAS_PATH = '/admin/finanzas/compras'

export function comprasBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Finanzas', to: COMPRAS_PATH },
    { label: pageTitle },
  ]
}

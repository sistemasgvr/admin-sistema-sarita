import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export const CLIENTES_PATH = '/admin/clientes'

export function clientesBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Clientes', to: CLIENTES_PATH },
    { label: pageTitle },
  ]
}

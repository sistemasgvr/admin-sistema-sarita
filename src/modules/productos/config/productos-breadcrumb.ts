import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export function productosBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [{ label: 'Productos' }, { label: pageTitle }]
}

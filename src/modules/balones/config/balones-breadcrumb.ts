import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export function balonesBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [{ label: 'Balones' }, { label: pageTitle }]
}

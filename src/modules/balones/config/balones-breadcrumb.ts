import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export const BALONES_HUB_PATH = '/admin/balones'

export function balonesBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Balones', to: BALONES_HUB_PATH },
    { label: pageTitle },
  ]
}

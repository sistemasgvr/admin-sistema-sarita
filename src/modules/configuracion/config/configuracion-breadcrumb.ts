import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export const CONFIGURACION_HUB_PATH = '/admin/configuracion'

export function configuracionBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Configuración', to: CONFIGURACION_HUB_PATH },
    { label: pageTitle },
  ]
}

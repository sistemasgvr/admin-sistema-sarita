import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

export const BALONES_HUB_PATH = '/admin/balones'
export const BALONES_CILINDROS_PATH = '/admin/balones/cilindros'
export const BALONES_PRESTAMOS_PATH = '/admin/balones/prestamos'
export const BALONES_RECOJOS_PATH = '/admin/balones/recojos'
export const BALONES_ALQUILERES_PATH = '/admin/balones/alquileres'

export function balonesBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return [
    { label: 'Balones', to: BALONES_HUB_PATH },
    { label: pageTitle },
  ]
}

export function balonesSectionBreadcrumbItems(
  sectionLabel: string,
  sectionPath: string,
  pageTitle: string,
): BreadcrumbItem[] {
  return [
    { label: 'Balones', to: BALONES_HUB_PATH },
    { label: sectionLabel, to: sectionPath },
    { label: pageTitle },
  ]
}

export function balonesCilindrosBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return balonesSectionBreadcrumbItems('Libro de cilindros', BALONES_CILINDROS_PATH, pageTitle)
}

export function balonesPrestamosBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return balonesSectionBreadcrumbItems('Préstamos', BALONES_PRESTAMOS_PATH, pageTitle)
}

export function balonesRecojosBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return balonesSectionBreadcrumbItems('Recojos', BALONES_RECOJOS_PATH, pageTitle)
}

export function balonesAlquileresBreadcrumbItems(pageTitle: string): BreadcrumbItem[] {
  return balonesSectionBreadcrumbItems('Alquileres', BALONES_ALQUILERES_PATH, pageTitle)
}

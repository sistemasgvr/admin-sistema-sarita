import { ICONS, type IconName } from '@/shared/constants/icons'
import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'

export interface BalonesHubItem {
  key: string
  title: string
  description: string
  path: string
  icon: IconName
  permission: PermissionBandera
  implemented: boolean
}

export const balonesHubItems: BalonesHubItem[] = [
  {
    key: 'tipos',
    title: 'Tipos de balón',
    description: 'Catálogo de tipos, capacidades y gases asociados.',
    path: '/admin/balones/tipos',
    icon: ICONS.layers,
    permission: PermisoBanderas.TIPOS_BALON_LISTAR,
    implemented: true,
  },
  {
    key: 'cilindros',
    title: 'Libro de cilindros',
    description: 'Registro, trazabilidad y aprobación de bajas de cilindros.',
    path: '/admin/balones/cilindros',
    icon: ICONS.cylinder,
    permission: PermisoBanderas.BALONES_LISTAR,
    implemented: true,
  },
  {
    key: 'recargas',
    title: 'Recargas',
    description:
      'Recarga en mostrador (cliente) y órdenes a planta externa (GRE / checklist / compra).',
    path: '/admin/balones/recargas',
    icon: ICONS.clipboardList,
    permission: PermisoBanderas.MOVIMIENTOS_RECARGA_LISTAR,
    implemented: true,
  },
  {
    key: 'prestamos',
    title: 'Préstamos',
    description: 'Flujo industrial: comodato de cilindros y control de días en préstamo (30 / 90–180 / 180+).',
    path: '/admin/balones/prestamos',
    icon: ICONS.users,
    permission: PermisoBanderas.PRESTAMOS_BALON_LISTAR,
    implemented: true,
  },
  {
    key: 'recojos',
    title: 'Recojos',
    description: 'Visitas para recoger envases en préstamo y accesorios en alquiler.',
    path: '/admin/balones/recojos',
    icon: ICONS.truck,
    permission: PermisoBanderas.RECOJOS_BALON_LISTAR,
    implemented: true,
  },
  {
    key: 'rutas-pueblos',
    title: 'Ruta pueblos',
    description:
      'Control de libras ida/vuelta y cruce de m³ calculados vs ventas del repartidor.',
    path: '/admin/balones/rutas-pueblos',
    icon: ICONS.mapPin,
    permission: PermisoBanderas.RUTAS_PUEBLOS_LISTAR,
    implemented: true,
  },
  {
    key: 'alquileres',
    title: 'Alquileres',
    description:
      'Alquiler de regulador (kit medicinal). El cilindro se presta; no se alquila el envase.',
    path: '/admin/balones/alquileres',
    icon: ICONS.boxes,
    permission: PermisoBanderas.ALQUILERES_BALON_LISTAR,
    implemented: true,
  },
  {
    key: 'mantenimientos',
    title: 'Mantenimientos',
    description: 'Pruebas hidrostáticas, recertificación y mantenimiento.',
    path: '/admin/balones/mantenimientos',
    icon: ICONS.construction,
    permission: PermisoBanderas.MANTENIMIENTOS_BALON_LISTAR,
    implemented: true,
  },
]

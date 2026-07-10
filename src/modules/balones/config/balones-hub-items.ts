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
    key: 'movimientos',
    title: 'Movimientos',
    description: 'Traslados, entregas y otros movimientos de cilindros.',
    path: '/admin/balones/movimientos',
    icon: ICONS.arrowLeftRight,
    permission: PermisoBanderas.MOVIMIENTOS_BALON_LISTAR,
    implemented: true,
  },
  {
    key: 'recargas',
    title: 'Recargas',
    description: 'Recarga en mostrador (cliente trae balón) y envíos a planta externa.',
    path: '/admin/balones/recargas',
    icon: ICONS.clipboardList,
    permission: PermisoBanderas.MOVIMIENTOS_RECARGA_LISTAR,
    implemented: true,
  },
  {
    key: 'prestamos',
    title: 'Préstamos',
    description: 'Préstamo de cilindros a clientes y terceros.',
    path: '/admin/balones/prestamos',
    icon: ICONS.users,
    permission: PermisoBanderas.PRESTAMOS_BALON_LISTAR,
    implemented: true,
  },
  {
    key: 'alquileres',
    title: 'Alquileres',
    description: 'Alquiler de balones y seguimiento de devoluciones.',
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

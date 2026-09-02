import { ICONS, type IconName } from '@/shared/constants/icons'
import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'

export interface BalonesMenuItem {
  key: string
  title: string
  path: string
  permission: PermissionBandera
  phase: number
  implemented: boolean
  icon: IconName
}

/** Orden por uso operativo del día; maestros (tipos) al final. */
export const balonesMenuItems: BalonesMenuItem[] = [
  {
    key: 'cilindros',
    title: 'Libro de cilindros',
    path: '/admin/balones/cilindros',
    icon: ICONS.cylinder,
    permission: PermisoBanderas.BALONES_LISTAR,
    phase: 2,
    implemented: true,
  },
  {
    key: 'stock-gas',
    title: 'Stock de gas',
    path: '/admin/balones/stock-gas',
    icon: ICONS.gauge,
    permission: PermisoBanderas.BALONES_LISTAR,
    phase: 2,
    implemented: true,
  },
  {
    key: 'recargas',
    title: 'Recargas',
    path: '/admin/balones/recargas',
    icon: ICONS.flame,
    permission: PermisoBanderas.MOVIMIENTOS_RECARGA_LISTAR,
    phase: 4,
    implemented: true,
  },
  {
    key: 'alquileres',
    title: 'Alquileres',
    path: '/admin/balones/alquileres',
    icon: ICONS.clipboardList,
    permission: PermisoBanderas.ALQUILERES_BALON_LISTAR,
    phase: 6,
    implemented: true,
  },
  {
    key: 'prestamos',
    title: 'Préstamos',
    path: '/admin/balones/prestamos',
    icon: ICONS.handCoins,
    permission: PermisoBanderas.PRESTAMOS_BALON_LISTAR,
    phase: 5,
    implemented: true,
  },
  {
    key: 'recojos',
    title: 'Recojos',
    path: '/admin/balones/recojos',
    icon: ICONS.arrowDownToLine,
    permission: PermisoBanderas.RECOJOS_BALON_LISTAR,
    phase: 5,
    implemented: true,
  },
  {
    key: 'movimientos',
    title: 'Movimientos',
    path: '/admin/inventario/movimientos',
    icon: ICONS.arrowLeftRight,
    permission: PermisoBanderas.INVENTARIO_MOVIMIENTOS_LISTAR,
    phase: 3,
    implemented: true,
  },
  {
    key: 'rutas-pueblos',
    title: 'Ruta pueblos',
    path: '/admin/balones/rutas-pueblos',
    icon: ICONS.mapPin,
    permission: PermisoBanderas.RUTAS_PUEBLOS_LISTAR,
    phase: 5,
    implemented: true,
  },
  {
    key: 'mantenimientos',
    title: 'Mantenimientos',
    path: '/admin/balones/mantenimientos',
    icon: ICONS.wrench,
    permission: PermisoBanderas.MANTENIMIENTOS_BALON_LISTAR,
    phase: 7,
    implemented: true,
  },
  {
    key: 'tipos',
    title: 'Tipos de balón',
    path: '/admin/balones/tipos',
    icon: ICONS.tags,
    permission: PermisoBanderas.TIPOS_BALON_LISTAR,
    phase: 1,
    implemented: true,
  },
]

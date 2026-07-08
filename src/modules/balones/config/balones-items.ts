import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'

export interface BalonesMenuItem {
  key: string
  title: string
  path: string
  permission: PermissionBandera
  phase: number
  implemented: boolean
}

/** Orden del menú y plan por fases (ver README interno del módulo). */
export const balonesMenuItems: BalonesMenuItem[] = [
  {
    key: 'tipos',
    title: 'Tipos de balón',
    path: '/admin/balones/tipos',
    permission: PermisoBanderas.TIPOS_BALON_LISTAR,
    phase: 1,
    implemented: true,
  },
  {
    key: 'cilindros',
    title: 'Libro de cilindros',
    path: '/admin/balones/cilindros',
    permission: PermisoBanderas.BALONES_LISTAR,
    phase: 2,
    implemented: true,
  },
  {
    key: 'movimientos',
    title: 'Movimientos',
    path: '/admin/balones/movimientos',
    permission: PermisoBanderas.MOVIMIENTOS_BALON_LISTAR,
    phase: 3,
    implemented: true,
  },
  {
    key: 'recargas',
    title: 'Recargas',
    path: '/admin/balones/recargas',
    permission: PermisoBanderas.MOVIMIENTOS_RECARGA_LISTAR,
    phase: 4,
    implemented: true,
  },
  {
    key: 'prestamos',
    title: 'Préstamos',
    path: '/admin/balones/prestamos',
    permission: PermisoBanderas.PRESTAMOS_BALON_LISTAR,
    phase: 5,
    implemented: true,
  },
  {
    key: 'alquileres',
    title: 'Alquileres',
    path: '/admin/balones/alquileres',
    permission: PermisoBanderas.ALQUILERES_BALON_LISTAR,
    phase: 6,
    implemented: false,
  },
  {
    key: 'mantenimientos',
    title: 'Mantenimientos',
    path: '/admin/balones/mantenimientos',
    permission: PermisoBanderas.MANTENIMIENTOS_BALON_LISTAR,
    phase: 7,
    implemented: false,
  },
]

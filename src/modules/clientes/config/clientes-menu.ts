import { PermisoBanderas } from '@/shared/constants/permissions'
import { ICONS } from '@/shared/constants/icons'
import type { AdminMenuSubItem } from '@/modules/admin/config/menu'

export const clientesMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'Listado General',
    path: '/admin/clientes',
    permission: PermisoBanderas.CLIENTES_LISTAR,
    icon: ICONS.users,
  },
  {
    name: 'Contactos',
    path: '/admin/clientes/contactos',
    permission: PermisoBanderas.CONTACTOS_LISTAR,
    icon: ICONS.contact,
  },
  {
    name: 'Direcciones',
    path: '/admin/clientes/direcciones',
    permission: PermisoBanderas.DIRECCIONES_LISTAR,
    icon: ICONS.mapPin,
  },
  {
    name: 'Vehículos',
    path: '/admin/clientes/vehiculos',
    permission: PermisoBanderas.VEHICULOS_LISTAR,
    icon: ICONS.car,
  },
  {
    name: 'Choferes',
    path: '/admin/clientes/choferes',
    permission: PermisoBanderas.CHOFERES_LISTAR,
    icon: ICONS.idCard,
  },
  {
    name: 'Mapa',
    path: '/admin/clientes/mapa',
    permission: PermisoBanderas.CLIENTES_LISTAR,
    icon: ICONS.locateFixed,
  },
  {
    name: 'Cuentas Bancarias',
    path: '/admin/clientes/cuentas-bancarias',
    permission: PermisoBanderas.CUENTAS_BANCARIAS_LISTAR,
    icon: ICONS.creditCard,
  },
]

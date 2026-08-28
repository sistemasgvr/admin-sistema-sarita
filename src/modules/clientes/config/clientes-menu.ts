import { PermisoBanderas } from '@/shared/constants/permissions'
import { ICONS } from '@/shared/constants/icons'
import type { AdminMenuSubItem } from '@/modules/admin/config/menu'

/** Orden por uso operativo: ficha → entrega → logística → datos bancarios. */
export const clientesMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'Listado General',
    path: '/admin/clientes',
    icon: ICONS.users,
    permission: PermisoBanderas.CLIENTES_LISTAR,
  },
  {
    name: 'Direcciones',
    path: '/admin/clientes/direcciones',
    icon: ICONS.mapPin,
    permission: PermisoBanderas.DIRECCIONES_LISTAR,
  },
  {
    name: 'Contactos',
    path: '/admin/clientes/contactos',
    icon: ICONS.contact,
    permission: PermisoBanderas.CONTACTOS_LISTAR,
  },
  {
    name: 'Mapa',
    path: '/admin/clientes/mapa',
    icon: ICONS.locateFixed,
    permission: PermisoBanderas.CLIENTES_LISTAR,
  },
]

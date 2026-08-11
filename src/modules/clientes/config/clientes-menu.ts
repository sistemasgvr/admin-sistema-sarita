import { PermisoBanderas } from '@/shared/constants/permissions'
import type { AdminMenuSubItem } from '@/modules/admin/config/menu'

/** Orden por uso operativo: ficha → entrega → logística → datos bancarios. */
export const clientesMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'Listado General',
    path: '/admin/clientes',
    permission: PermisoBanderas.CLIENTES_LISTAR,
  },
  {
    name: 'Direcciones',
    path: '/admin/clientes/direcciones',
    permission: PermisoBanderas.DIRECCIONES_LISTAR,
  },
  {
    name: 'Contactos',
    path: '/admin/clientes/contactos',
    permission: PermisoBanderas.CONTACTOS_LISTAR,
  },
  {
    name: 'Mapa',
    path: '/admin/clientes/mapa',
    permission: PermisoBanderas.CLIENTES_LISTAR,
  },
]

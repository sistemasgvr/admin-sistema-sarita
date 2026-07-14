import { PermisoBanderas } from '@/shared/constants/permissions'
import type { AdminMenuSubItem } from '@/modules/admin/config/menu'

export const clientesMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'Listado General',
    path: '/admin/clientes',
    permission: PermisoBanderas.CLIENTES_LISTAR,
  },
  {
    name: 'Contactos',
    path: '/admin/clientes/contactos',
    permission: PermisoBanderas.CONTACTOS_LISTAR,
  },
  {
    name: 'Direcciones',
    path: '/admin/clientes/direcciones',
    permission: PermisoBanderas.DIRECCIONES_LISTAR,
  },
  {
    name: 'Vehículos',
    path: '/admin/clientes/vehiculos',
    permission: PermisoBanderas.VEHICULOS_LISTAR,
  },
  {
    name: 'Choferes',
    path: '/admin/clientes/choferes',
    permission: PermisoBanderas.CHOFERES_LISTAR,
  },
  {
    name: 'Mapa',
    path: '/admin/clientes/mapa',
    permission: PermisoBanderas.CLIENTES_LISTAR,
  },
]
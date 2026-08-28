import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'

/**
 * Subítems del padre "Gestión Empresa" (mismo nivel que "Configuración" en el sidebar).
 * Hoy solo tiene Permisos y certificados; otros módulos de gestión de la empresa
 * pueden sumarse acá más adelante.
 */
export const gestionEmpresaMenuSubItems: AdminMenuSubItem[] = [
  {
    name: 'Permisos y certificados',
    path: '/admin/documentos-vencimiento',
    icon: ICONS.fileKey,
    permission: PermisoBanderas.DOCUMENTOS_VENCIMIENTO_LISTAR,
  },
  {
    name: 'Trabajadores',
    path: '/admin/trabajadores',
    icon: ICONS.userCheck,
    permission: PermisoBanderas.TRABAJADOR_LISTAR,
  },
  {
    name: 'Activos',
    path: '/admin/activos',
    icon: ICONS.archive,
    permission: PermisoBanderas.ACTIVO_LISTAR,
  },
]

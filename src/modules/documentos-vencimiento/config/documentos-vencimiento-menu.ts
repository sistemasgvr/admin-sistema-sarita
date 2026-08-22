import type { AdminMenuSubItem } from '@/modules/admin/config/menu'
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
    permission: PermisoBanderas.DOCUMENTOS_VENCIMIENTO_LISTAR,
  },
  {
    name: 'Trabajadores',
    path: '/admin/trabajadores',
    permission: PermisoBanderas.TRABAJADOR_LISTAR,
  },
]

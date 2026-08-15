import { computed } from 'vue'
import { adminMenuGroups } from '@/modules/admin/config/menu'
import type { AdminMenuGroup, AdminMenuItem } from '@/modules/admin/config/menu'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { canAccessByPermissions } from '@/shared/constants/permissions'

function canAccessMenuNode(
  permisos: string[],
  item: Pick<AdminMenuItem, 'permission' | 'anyPermission'>,
  requireExplicit = false,
): boolean {
  return canAccessByPermissions(permisos, {
    permission: item.permission,
    anyPermission: item.anyPermission,
    requireExplicit,
  })
}

/**
 * Con subItems: el padre se muestra si hay al menos un hijo permitido.
 * Si solo queda el hub (mismo path del padre), se aplana a ítem hoja.
 * Sin subItems: `permission` / `anyPermission` (sin bandera = visible).
 */
export function filterMenuItem(
  item: AdminMenuItem,
  permisos: string[],
): AdminMenuItem | null {
  if (item.subItems?.length) {
    const subItems = item.subItems.filter((subItem) =>
      canAccessMenuNode(permisos, subItem, true),
    )

    if (subItems.length === 0) {
      const canOpenHub =
        Boolean(item.path) && canAccessMenuNode(permisos, item, true)
      return canOpenHub ? { ...item, subItems: undefined } : null
    }

    if (subItems.length === 1 && item.path && subItems[0].path === item.path) {
      return { ...item, subItems: undefined }
    }

    return { ...item, subItems }
  }

  return canAccessMenuNode(permisos, item) ? item : null
}

export function filterAdminMenuGroups(
  groups: AdminMenuGroup[],
  permisos: string[],
): AdminMenuGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => filterMenuItem(item, permisos))
        .filter((item): item is AdminMenuItem => item !== null),
    }))
    .filter((group) => group.items.length > 0)
}

export function useAdminMenu() {
  const authStore = useAuthStore()

  const visibleMenuGroups = computed<AdminMenuGroup[]>(() =>
    filterAdminMenuGroups(adminMenuGroups, authStore.permisos),
  )

  return { visibleMenuGroups }
}

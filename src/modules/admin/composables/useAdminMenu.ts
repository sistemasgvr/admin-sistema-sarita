import { computed } from 'vue'
import { adminMenuGroups } from '@/modules/admin/config/menu'
import type { AdminMenuGroup, AdminMenuItem } from '@/modules/admin/config/menu'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { hasPermissionFlag } from '@/shared/constants/permissions'

function filterMenuItem(
  item: AdminMenuItem,
  permisos: string[],
): AdminMenuItem | null {
  if (item.subItems?.length) {
    const subItems = item.subItems.filter((subItem) =>
      hasPermissionFlag(permisos, subItem.permission),
    )
    const canAccessParent = hasPermissionFlag(permisos, item.permission)

    if (subItems.length === 0 && !canAccessParent) return null

    return {
      ...item,
      subItems: subItems.length > 0 ? subItems : undefined,
    }
  }

  if (!hasPermissionFlag(permisos, item.permission)) return null

  return item
}

export function useAdminMenu() {
  const authStore = useAuthStore()

  const visibleMenuGroups = computed<AdminMenuGroup[]>(() => {
    const permisos = authStore.permisos

    return adminMenuGroups
      .map((group) => ({
        ...group,
        items: group.items
          .map((item) => filterMenuItem(item, permisos))
          .filter((item): item is AdminMenuItem => item !== null),
      }))
      .filter((group) => group.items.length > 0)
  })

  return { visibleMenuGroups }
}

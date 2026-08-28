<template>
  <aside
    :class="[
      'fixed top-16 bottom-0 left-0 z-99999 flex flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:top-0 lg:mt-0 lg:h-screen',
      {
        'lg:w-[290px]': isExpanded || isMobileOpen || isHovered,
        'lg:w-[90px]': !isExpanded && !isHovered,
        'translate-x-0 w-[290px]': isMobileOpen,
        '-translate-x-full': !isMobileOpen,
        'lg:translate-x-0': true,
      },
    ]"
    @mouseenter="!isExpanded && (isHovered = true)"
    @mouseleave="isHovered = false"
  >
    <div
      :class="[
        'hidden py-8 lg:flex',
        !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start',
      ]"
    >
      <router-link to="/admin/dashboard">
        <img
          v-if="isExpanded || isHovered || isMobileOpen"
          src="/images/logo/logo-o-sarita.webp"
          alt="Oxígeno Sarita"
          width="160"
          height="48"
          class="object-contain"
        />
        <img
          v-else
          src="/images/logo/logo-o-sarita.webp"
          alt="Oxígeno Sarita"
          width="40"
          height="40"
          class="rounded-lg object-cover"
        />
      </router-link>
    </div>
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto pt-4 duration-300 ease-linear no-scrollbar lg:pt-0">
      <nav class="mb-6 pb-6">
        <div class="flex flex-col gap-4">
          <div v-for="(menuGroup, groupIndex) in visibleMenuGroups" :key="groupIndex">
            <h2
              :class="[
                'mb-4 text-xs uppercase flex leading-[20px] text-gray-400',
                !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start',
              ]"
            >
              <template v-if="isExpanded || isHovered || isMobileOpen">
                {{ menuGroup.title }}
              </template>
              <AppIcon v-else :name="ICONS.ellipsis" :size="20" />
            </h2>
            <ul class="flex flex-col gap-4">
              <li v-for="(item, index) in menuGroup.items" :key="item.name">
                <button
                  v-if="item.subItems"
                  type="button"
                  @click="toggleSubmenu(groupIndex, index)"
                  :class="[
                    'menu-item group w-full',
                    {
                      'menu-item-active': isParentItemActive(item),
                      'menu-item-inactive': !isParentItemActive(item),
                    },
                    !isExpanded && !isHovered ? 'lg:justify-center' : 'lg:justify-start',
                  ]"
                >
                  <span
                    :class="[
                      isParentItemActive(item)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <AppIcon :name="item.icon" :size="24" />
                  </span>
                  <span v-if="isExpanded || isHovered || isMobileOpen" class="menu-item-text">
                    {{ item.name }}
                  </span>
                  <AppIcon
                    v-if="isExpanded || isHovered || isMobileOpen"
                    :name="ICONS.chevronDown"
                    :size="20"
                    :class="[
                      'ml-auto transition-transform duration-200',
                      { 'rotate-180 text-brand-500': isSubmenuOpen(groupIndex, index) },
                    ]"
                  />
                </button>
                <router-link
                  v-else-if="item.path"
                  :to="item.path"
                  :class="[
                    'menu-item group',
                    {
                      'menu-item-active': isActive(item.path),
                      'menu-item-inactive': !isActive(item.path),
                    },
                  ]"
                >
                  <span
                    :class="[
                      isActive(item.path) ? 'menu-item-icon-active' : 'menu-item-icon-inactive',
                    ]"
                  >
                    <AppIcon :name="item.icon" :size="24" />
                  </span>
                  <span v-if="isExpanded || isHovered || isMobileOpen" class="menu-item-text">
                    {{ item.name }}
                  </span>
                </router-link>
                <transition
                  @enter="startTransition"
                  @after-enter="endTransition"
                  @before-leave="startTransition"
                  @after-leave="endTransition"
                >
                  <div
                    v-show="
                      isSubmenuOpen(groupIndex, index) &&
                      (isExpanded || isHovered || isMobileOpen)
                    "
                  >
                    <ul class="mt-2 space-y-1 ml-9">
                      <li v-for="subItem in item.subItems" :key="subItem.name">
                        <router-link
                          :to="subItem.path"
                          :class="[
                            'menu-dropdown-item',
                            {
                              'menu-dropdown-item-active': isSubmenuRouteActive(
                                subItem.path,
                                item.subItems,
                              ),
                              'menu-dropdown-item-inactive': !isSubmenuRouteActive(
                                subItem.path,
                                item.subItems,
                              ),
                            },
                          ]"
                         >
                           <AppIcon
                             v-if="subItem.icon"
                             :name="subItem.icon"
                             :size="18"
                             class="shrink-0"
                          />
                           {{ subItem.name }}
                         </router-link>
                      </li>
                    </ul>
                  </div>
                </transition>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import type { AdminMenuItem, AdminMenuSubItem } from '@/modules/admin/config/menu'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { useAdminMenu } from '@/modules/admin/composables/useAdminMenu'
import { useSidebar } from '@/modules/admin/composables/useSidebar'

const route = useRoute()
const { visibleMenuGroups } = useAdminMenu()
const { isExpanded, isMobileOpen, isHovered, expandedSubmenus, collapsedSubmenus } = useSidebar()

const submenuKey = (groupIndex: number, itemIndex: number) => `${groupIndex}-${itemIndex}`

const matchesRoute = (path: string) =>
  route.path === path || route.path.startsWith(`${path}/`)

/** Path forzado desde meta de ruta (ej. movimientos → Stock). */
const sidebarActivePathFromRoute = () => {
  const raw = route.meta.sidebarActivePath
  return typeof raw === 'string' && raw.length > 0 ? raw : null
}

/** Resalta hubs y rutas hijas (ej. /admin/configuracion → /admin/configuracion/sucursales). */
const isActive = (path: string) => matchesRoute(path)

const submenuItemMatchScore = (item: AdminMenuSubItem): number => {
  const forced = sidebarActivePathFromRoute()
  if (forced && (item.path === forced || matchesRoute(item.path) && forced.startsWith(item.path))) {
    return item.path.length + 2000
  }
  if (matchesRoute(item.path)) {
    // Preferir coincidencia directa del path del ítem.
    return item.path.length + 1000
  }
  let best = 0
  for (const prefix of item.activeMatchPaths ?? []) {
    if (matchesRoute(prefix)) best = Math.max(best, prefix.length)
  }
  return best
}

/**
 * En submenús con rutas anidadas (ej. /admin/clientes y /admin/clientes/choferes),
 * gana la coincidencia más específica para no resaltar dos ítems a la vez.
 * También contempla `activeMatchPaths` y `meta.sidebarActivePath`.
 */
const isSubmenuRouteActive = (path: string, siblings: AdminMenuSubItem[] = []) => {
  const forced = sidebarActivePathFromRoute()
  if (forced) return path === forced

  const scored = siblings
    .map((sibling) => ({ path: sibling.path, score: submenuItemMatchScore(sibling) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored[0]?.path === path
}

const isParentItemActive = (item: AdminMenuItem) => {
  if (item.path && matchesRoute(item.path)) {
    return true
  }

  return item.subItems?.some((subItem) => isSubmenuRouteActive(subItem.path, item.subItems)) ?? false
}

const hasActiveSubmenuRoute = (groupIndex: number, itemIndex: number) => {
  const item = visibleMenuGroups.value[groupIndex]?.items[itemIndex]
  if (!item) return false

  if (item.path && matchesRoute(item.path)) {
    return true
  }

  return item.subItems?.some((subItem) => isSubmenuRouteActive(subItem.path, item.subItems)) ?? false
}

const isSubmenuOpen = (groupIndex: number, itemIndex: number) => {
  const key = submenuKey(groupIndex, itemIndex)

  if (collapsedSubmenus.value.has(key)) return false
  if (expandedSubmenus.value.has(key)) return true

  return hasActiveSubmenuRoute(groupIndex, itemIndex)
}

const toggleSubmenu = (groupIndex: number, itemIndex: number) => {
  const key = submenuKey(groupIndex, itemIndex)

  if (isSubmenuOpen(groupIndex, itemIndex)) {
    expandedSubmenus.value.delete(key)
    if (hasActiveSubmenuRoute(groupIndex, itemIndex)) {
      collapsedSubmenus.value.add(key)
    }
  } else {
    collapsedSubmenus.value.delete(key)
    expandedSubmenus.value.add(key)
  }

  expandedSubmenus.value = new Set(expandedSubmenus.value)
  collapsedSubmenus.value = new Set(collapsedSubmenus.value)
}

watch(
  () => route.path,
  () => {
    let changed = false

    visibleMenuGroups.value.forEach((group, groupIndex) => {
      group.items.forEach((item, itemIndex) => {
        if (!item.subItems?.length) return

        const key = submenuKey(groupIndex, itemIndex)
        if (hasActiveSubmenuRoute(groupIndex, itemIndex) && collapsedSubmenus.value.has(key)) {
          collapsedSubmenus.value.delete(key)
          changed = true
        }
      })
    })

    if (changed) {
      collapsedSubmenus.value = new Set(collapsedSubmenus.value)
    }
  },
)

const startTransition = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.height = 'auto'
  const height = htmlEl.scrollHeight
  htmlEl.style.height = '0px'
  void htmlEl.offsetHeight
  htmlEl.style.height = `${height}px`
}

const endTransition = (el: Element) => {
  ;(el as HTMLElement).style.height = ''
}
</script>

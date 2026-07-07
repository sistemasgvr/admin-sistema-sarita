<template>
  <aside
    :class="[
      'fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-99999 border-r border-gray-200',
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
        'py-8 flex',
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
    <div class="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
      <nav class="mb-6">
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
                              'menu-dropdown-item-active': isSubmenuRouteActive(subItem.path),
                              'menu-dropdown-item-inactive': !isSubmenuRouteActive(subItem.path),
                            },
                          ]"
                        >
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
import type { AdminMenuItem } from '@/modules/admin/config/menu'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { useAdminMenu } from '@/modules/admin/composables/useAdminMenu'
import { useSidebar } from '@/modules/admin/composables/useSidebar'

const route = useRoute()
const { visibleMenuGroups } = useAdminMenu()
const { isExpanded, isMobileOpen, isHovered, openSubmenu } = useSidebar()

const submenuKey = (groupIndex: number, itemIndex: number) => `${groupIndex}-${itemIndex}`

const isActive = (path: string) => route.path === path

const isSubmenuRouteActive = (path: string) => route.path === path

const isParentItemActive = (item: AdminMenuItem) => {
  if (item.path && (route.path === item.path || route.path.startsWith(`${item.path}/`))) {
    return true
  }

  return item.subItems?.some((subItem) => isSubmenuRouteActive(subItem.path)) ?? false
}

const hasActiveSubmenuRoute = (groupIndex: number, itemIndex: number) => {
  const item = visibleMenuGroups.value[groupIndex]?.items[itemIndex]
  if (!item) return false

  if (item.path && (route.path === item.path || route.path.startsWith(`${item.path}/`))) {
    return true
  }

  return item.subItems?.some((subItem) => isSubmenuRouteActive(subItem.path)) ?? false
}

const toggleSubmenu = (groupIndex: number, itemIndex: number) => {
  const key = submenuKey(groupIndex, itemIndex)

  if (isSubmenuOpen(groupIndex, itemIndex)) {
    openSubmenu.value = `closed:${key}`
    return
  }

  openSubmenu.value = key
}

const isSubmenuOpen = (groupIndex: number, itemIndex: number) => {
  const key = submenuKey(groupIndex, itemIndex)

  if (openSubmenu.value === `closed:${key}`) return false
  if (openSubmenu.value === key) return true

  return hasActiveSubmenuRoute(groupIndex, itemIndex)
}

watch(
  () => route.path,
  () => {
    visibleMenuGroups.value.forEach((group, groupIndex) => {
      group.items.forEach((item, itemIndex) => {
        if (!item.subItems?.length) return

        const key = submenuKey(groupIndex, itemIndex)
        if (hasActiveSubmenuRoute(groupIndex, itemIndex) && openSubmenu.value === `closed:${key}`) {
          openSubmenu.value = null
        }
      })
    })
  },
)

const startTransition = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.height = 'auto'
  const height = htmlEl.scrollHeight
  htmlEl.style.height = '0px'
  htmlEl.offsetHeight
  htmlEl.style.height = `${height}px`
}

const endTransition = (el: Element) => {
  ;(el as HTMLElement).style.height = ''
}
</script>

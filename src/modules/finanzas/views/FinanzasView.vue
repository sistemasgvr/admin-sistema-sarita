<template>
  <div>
    <PageBreadcrumb page-title="Finanzas" />

    <template v-if="visibleTabs.length">
      <AppTabs
        v-model="activeTab"
        :tabs="visibleTabs"
        inline
        full-width
        aria-label="Finanzas"
        class="mb-6"
      />

      <KeepAlive>
        <CuentasListView v-if="activeTab === 'cobrar'" tipo="COBRAR" />
        <CuentasListView v-else-if="activeTab === 'pagar'" tipo="PAGAR" />
        <GarantiasListView v-else-if="activeTab === 'garantias'" />
        <LibroDiarioView v-else-if="activeTab === 'libro-diario'" />
      </KeepAlive>
    </template>

    <div
      v-else
      class="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400">
        No tienes acceso a los módulos de finanzas.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { AppTabs } from '@/shared/components'
import CuentasListView from '@/modules/finanzas/views/CuentasListView.vue'
import GarantiasListView from '@/modules/finanzas/views/GarantiasListView.vue'
import LibroDiarioView from '@/modules/caja/views/LibroDiarioView.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas, type PermissionBandera } from '@/shared/constants/permissions'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'

interface FinanzasTab extends AppTabItem {
  permission: PermissionBandera
  path: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const finanzasTabs: FinanzasTab[] = [
  {
    key: 'cobrar',
    label: 'Cuentas por Cobrar',
    icon: ICONS.banknote,
    permission: PermisoBanderas.FINANZAS_CXC_VER,
    path: '/admin/finanzas',
  },
  {
    key: 'garantias',
    label: 'Garantías',
    icon: ICONS.shield,
    permission: PermisoBanderas.FINANZAS_GARANTIAS_VER,
    path: '/admin/finanzas/garantias',
  },
  {
    key: 'pagar',
    label: 'Cuentas por Pagar',
    icon: ICONS.wallet,
    permission: PermisoBanderas.FINANZAS_CXP_VER,
    path: '/admin/finanzas/pagar',
  },
  {
    key: 'libro-diario',
    label: 'Libro diario',
    icon: ICONS.bookOpen,
    permission: PermisoBanderas.CAJA_LIBRO_DIARIO,
    path: '/admin/finanzas/libro-diario',
  },
]

const visibleTabs = computed<AppTabItem[]>(() =>
  finanzasTabs
    .filter((tab) => authStore.hasPermission(tab.permission))
    .map((tab) => ({ key: tab.key, label: tab.label, icon: tab.icon })),
)

const pathByTab = (tabKey: string) =>
  finanzasTabs.find((tab) => tab.key === tabKey)?.path ?? '/admin/finanzas'

const resolveTabFromRoute = (): string => {
  const metaTab = route.meta.finanzasTab
  if (typeof metaTab === 'string') {
    const byMeta = visibleTabs.value.find((tab) => tab.key === metaTab)
    if (byMeta) return byMeta.key
  }

  const byPath = finanzasTabs.find(
    (tab) => tab.path === route.path && authStore.hasPermission(tab.permission),
  )
  if (byPath) return byPath.key

  const raw = route.query.tab
  const queryVal = (Array.isArray(raw) ? raw[0] : raw) as LocationQueryValue
  const byQuery = visibleTabs.value.find((tab) => tab.key === queryVal)
  return byQuery?.key ?? visibleTabs.value[0]?.key ?? ''
}

const activeTab = ref(resolveTabFromRoute())

watch(activeTab, (tab) => {
  const target = pathByTab(tab)
  if (route.path !== target) {
    router.replace(target)
  }
})

watch(
  () => [route.path, route.meta.finanzasTab, route.query.tab] as const,
  () => {
    const resolved = resolveTabFromRoute()
    if (resolved && activeTab.value !== resolved) {
      activeTab.value = resolved
    }
  },
)

watch(visibleTabs, (tabs) => {
  if (!tabs.some((tab) => tab.key === activeTab.value)) {
    activeTab.value = tabs[0]?.key ?? ''
  }
})
</script>

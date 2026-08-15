<template>
  <div>
    <PageBreadcrumb page-title="Dashboard" />

    <DashboardFiltrosGenerales class="mb-6" />

    <AppTabs
      v-model="activeTab"
      :tabs="tabs"
      inline
      full-width
      aria-label="Dashboard"
      class="mb-6"
    />

    <KeepAlive>
      <DashboardPanelPrincipalView v-if="activeTab === 'panel'" />
      <DashboardGestionClientesView v-else-if="activeTab === 'clientes'" />
      <DashboardAnaliticaProductosView v-else-if="activeTab === 'productos'" />
      <DashboardControlCilindrosView v-else-if="activeTab === 'cilindros'" />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { AppTabs } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'
import DashboardFiltrosGenerales from '@/modules/dashboard/components/DashboardFiltrosGenerales.vue'
import DashboardPanelPrincipalView from '@/modules/dashboard/views/DashboardPanelPrincipalView.vue'
import DashboardGestionClientesView from '@/modules/dashboard/views/DashboardGestionClientesView.vue'
import DashboardAnaliticaProductosView from '@/modules/dashboard/views/DashboardAnaliticaProductosView.vue'
import DashboardControlCilindrosView from '@/modules/dashboard/views/DashboardControlCilindrosView.vue'

const tabs: AppTabItem[] = [
  { key: 'panel', label: 'Panel Principal', icon: ICONS.dashboard },
  { key: 'clientes', label: 'Gestión de clientes', icon: ICONS.users },
  { key: 'productos', label: 'Analítica de productos', icon: ICONS.boxes },
  { key: 'cilindros', label: 'Control de cilindros', icon: ICONS.cylinder },
]

const route = useRoute()
const router = useRouter()

const resolveTabFromRoute = (): string => {
  const raw = route.query.tab
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' && tabs.some((tab) => tab.key === value)
    ? value
    : (tabs[0]?.key ?? '')
}

const activeTab = ref(resolveTabFromRoute())

watch(activeTab, (tab) => {
  const current = route.query.tab
  const currentValue = Array.isArray(current) ? current[0] : current
  if (currentValue !== tab) {
    router.replace({ query: { ...route.query, tab } })
  }
})

watch(
  () => route.query.tab,
  () => {
    const resolved = resolveTabFromRoute()
    if (activeTab.value !== resolved) {
      activeTab.value = resolved
    }
  },
)
</script>
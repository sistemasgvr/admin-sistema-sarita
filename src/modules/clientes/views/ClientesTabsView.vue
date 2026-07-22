<template>
  <div>
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Clientes</h2>
    </div>

    <AppTabs
      v-model="activeTab"
      :tabs="visibleTabs"
      inline
      full-width
      aria-label="Clientes"
      class="mb-4"
    />

    <KeepAlive>
      <ClientesListView v-if="activeTab === 'clientes'" embedded />
      <AprobarBajasClientesView v-else-if="activeTab === 'aprobaciones'" embedded />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import ClientesListView from '@/modules/clientes/views/ClientesListView.vue'
import AprobarBajasClientesView from '@/modules/clientes/bajas-cliente/views/AprobarBajasClientesView.vue'
import { useBajasClienteQuery } from '@/modules/clientes/bajas-cliente/composables/useBajasClienteQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppTabs } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const canVerAprobaciones = computed(() =>
  authStore.hasPermission(PermisoBanderas.CLIENTES_EDITAR),
)

const bajasCountFilters = ref({ pagina: 1, limite: 1 })
const bajasCountQuery = useBajasClienteQuery(bajasCountFilters, {
  enabled: canVerAprobaciones,
})

const resolveTab = (tab: LocationQueryValue | LocationQueryValue[]) => {
  const value = Array.isArray(tab) ? tab[0] : tab
  return value === 'aprobaciones' && canVerAprobaciones.value ? 'aprobaciones' : 'clientes'
}

const activeTab = ref(resolveTab(route.query.tab))

const pendientesCount = computed(() => bajasCountQuery.data.value?.meta?.total ?? 0)

const visibleTabs = computed<AppTabItem[]>(() => {
  const tabs: AppTabItem[] = [
    { key: 'clientes', label: 'Clientes', icon: ICONS.users },
  ]

  if (canVerAprobaciones.value) {
    tabs.push({
      key: 'aprobaciones',
      label: 'Solicitudes',
      icon: ICONS.clipboardCheck,
      badge: pendientesCount.value,
    })
  }

  return tabs
})

watch(activeTab, (tab) => {
  const wantsAprobaciones = tab === 'aprobaciones'
  const hasAprobacionesQuery = route.query.tab === 'aprobaciones'
  if (wantsAprobaciones !== hasAprobacionesQuery) {
    router.replace({ query: wantsAprobaciones ? { tab: 'aprobaciones' } : {} })
  }
})

watch(
  () => route.query.tab,
  (tab) => {
    const resolved = resolveTab(tab)
    if (activeTab.value !== resolved) {
      activeTab.value = resolved
    }
  },
)

watch(canVerAprobaciones, (canVer) => {
  if (!canVer && activeTab.value === 'aprobaciones') {
    activeTab.value = 'clientes'
  }
})
</script>

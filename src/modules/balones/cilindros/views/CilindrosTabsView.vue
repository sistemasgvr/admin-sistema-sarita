<template>
  <div>
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Libro de cilindros</h2>

      <nav class="shrink-0">
        <ol class="flex items-center gap-1.5">
          <li>
            <router-link
              class="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              to="/admin/balones"
            >
              Balones
              <svg
                class="stroke-current"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  stroke=""
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </router-link>
          </li>
          <li class="text-sm text-gray-800 dark:text-white/90">Libro de cilindros</li>
        </ol>
      </nav>
    </div>

    <AppTabs
      v-model="activeTab"
      :tabs="visibleTabs"
      inline
      full-width
      aria-label="Libro de cilindros"
      class="mb-4"
    />

    <KeepAlive>
      <CilindrosListView v-if="activeTab === 'cilindros'" embedded />
      <BajasPendientesListView v-else-if="activeTab === 'aprobaciones'" embedded />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import BajasPendientesListView from '@/modules/balones/bajas-pendientes/views/BajasPendientesListView.vue'
import CilindrosListView from '@/modules/balones/cilindros/views/CilindrosListView.vue'
import { useBajasPendientesQuery } from '@/modules/balones/bajas-pendientes/composables/useBajasPendientesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppTabs } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const canVerAprobaciones = computed(() =>
  authStore.hasPermission(PermisoBanderas.BALONES_EDITAR),
)

const bajasCountFilters = ref({ pagina: 1, limite: 1 })
const bajasCountQuery = useBajasPendientesQuery(bajasCountFilters, {
  enabled: canVerAprobaciones,
})

const resolveTab = (tab: LocationQueryValue | LocationQueryValue[]) => {
  const value = Array.isArray(tab) ? tab[0] : tab
  return value === 'aprobaciones' && canVerAprobaciones.value ? 'aprobaciones' : 'cilindros'
}

const activeTab = ref(resolveTab(route.query.tab))

const pendientesCount = computed(() => bajasCountQuery.data.value?.meta?.total ?? 0)

const visibleTabs = computed<AppTabItem[]>(() => {
  const tabs: AppTabItem[] = [
    { key: 'cilindros', label: 'Libro de cilindros', icon: ICONS.cylinder },
  ]

  if (canVerAprobaciones.value) {
    tabs.push({
      key: 'aprobaciones',
      label: 'Aprobar bajas',
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
    activeTab.value = 'cilindros'
  }
})
</script>

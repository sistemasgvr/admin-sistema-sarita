<template>
  <div>
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Recargas</h2>
        <AppHelpTip :text="helpText" />
      </div>

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
          <li class="text-sm text-gray-800 dark:text-white/90">Recargas</li>
        </ol>
      </nav>
    </div>

    <AppTabs
      v-model="activeTab"
      :tabs="tabs"
      inline
      full-width
      aria-label="Recargas"
      class="mb-4"
    />

    <KeepAlive>
      <RecargasListView v-if="activeTab === 'mostrador'" embedded />
      <RecargasPlantaListView v-else-if="activeTab === 'planta'" embedded />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import RecargasListView from '@/modules/balones/recargas/views/RecargasListView.vue'
import RecargasPlantaListView from '@/modules/balones/recargas/views/RecargasPlantaListView.vue'
import { AppHelpTip, AppTabs } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'

const route = useRoute()
const router = useRouter()

const resolveTab = (tab: LocationQueryValue | LocationQueryValue[]) => {
  const value = Array.isArray(tab) ? tab[0] : tab
  return value === 'planta' ? 'planta' : 'mostrador'
}

const activeTab = ref(resolveTab(route.query.tab))

const helpText = computed(() =>
  activeTab.value === 'planta'
    ? 'Órdenes de envío de vacíos EMPRESA a planta externa: GRE → checklist → retorno / compra. La recarga de cliente en mostrador está en la pestaña Mostrador.'
    : 'Recargas de cliente en mostrador (POS). Los envíos de vacíos propios a planta externa están en la pestaña Planta externa.',
)

const tabs = computed<AppTabItem[]>(() => [
  { key: 'mostrador', label: 'Mostrador', icon: ICONS.clipboardList },
  { key: 'planta', label: 'Planta externa', icon: ICONS.warehouse },
])

watch(activeTab, (tab) => {
  const wantsPlanta = tab === 'planta'
  const hasPlantaQuery = route.query.tab === 'planta'
  if (wantsPlanta !== hasPlantaQuery) {
    if (wantsPlanta) {
      void router.replace({ query: { ...route.query, tab: 'planta' } })
    } else {
      const { tab: _tab, ...rest } = route.query
      void router.replace({ query: rest })
    }
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
</script>

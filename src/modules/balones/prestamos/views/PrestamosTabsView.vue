<template>
  <div>
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Préstamos</h2>

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
          <li class="text-sm text-gray-800 dark:text-white/90">Préstamos</li>
        </ol>
      </nav>
    </div>

    <AppTabs
      v-model="activeTab"
      :tabs="tabs"
      inline
      full-width
      aria-label="Préstamos"
      class="mb-4"
    />

    <KeepAlive>
      <PrestamosListView v-if="activeTab === 'prestamos'" embedded />
      <PrestamosAntiguedadView v-else-if="activeTab === 'antiguedad'" embedded />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import PrestamosAntiguedadView from '@/modules/balones/prestamos/views/PrestamosAntiguedadView.vue'
import PrestamosListView from '@/modules/balones/prestamos/views/PrestamosListView.vue'
import { AppTabs } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'

const route = useRoute()
const router = useRouter()

const resolveTab = (tab: LocationQueryValue | LocationQueryValue[]) => {
  const value = Array.isArray(tab) ? tab[0] : tab
  return value === 'antiguedad' ? 'antiguedad' : 'prestamos'
}

const activeTab = ref(resolveTab(route.query.tab))

const tabs = computed<AppTabItem[]>(() => [
  { key: 'prestamos', label: 'Préstamos', icon: ICONS.users },
  { key: 'antiguedad', label: 'Antigüedad', icon: ICONS.alertCircle },
])

watch(activeTab, (tab) => {
  const wantsAntiguedad = tab === 'antiguedad'
  const hasAntiguedadQuery = route.query.tab === 'antiguedad'
  if (wantsAntiguedad !== hasAntiguedadQuery) {
    router.replace({ query: wantsAntiguedad ? { tab: 'antiguedad' } : {} })
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

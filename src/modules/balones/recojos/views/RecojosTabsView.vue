<template>
  <div>
    <PageBreadcrumb page-title="Recojos" :items="breadcrumbItems" />
    <div class="mb-5 flex gap-2 border-b border-gray-200 dark:border-gray-800">
      <button
        v-for="item in tabs"
        :key="item.value"
        type="button"
        class="inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium"
        :class="tab === item.value ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500'"
        @click="tab = item.value"
      >
        <AppIcon :name="item.icon" :size="16" />
        {{ item.label }}
      </button>
    </div>
    <section v-if="tab === 'pendientes'" class="space-y-4">
      <AppListToolbar
        v-model:search="buscar"
        v-model:filters="dynamicFilters"
        :filter-fields="filterFields"
        search-placeholder="Cliente, número o cilindro..."
        @filter-change="onFiltersChange"
      />
      <AppTable
        :columns="columns"
        :rows="rows"
        row-key="row_key"
        :loading="pendientesQuery.isFetching.value"
      >
        <template #cell-origen="{ row }">
          <span class="inline-flex items-center gap-1.5">
            <AppIcon
              :name="row.origen === 'ALQUILER' ? ICONS.calendarRange : ICONS.package"
              :size="14"
              class="shrink-0 text-gray-500 dark:text-gray-400"
            />
            <ListaOpcionBadge :value="row.origen === 'ALQUILER' ? 'Alquiler' : 'Préstamo'" />
          </span>
        </template>
        <template #cell-origen_numero="{ row }">{{ row.numero_origen || '—' }}</template>
        <template #cell-cilindro="{ row }">
          <span class="inline-flex flex-col">
            <span>{{ etiquetaItem(row) }}</span>
            <span
              v-if="row.tipo_item === 'REGULADOR'"
              class="text-theme-xs text-gray-500 dark:text-gray-400"
            >
              Regulador / accesorio
            </span>
          </span>
        </template>
        <template #cell-fecha_retorno="{ value }">{{ String(value ?? '').slice(0, 10) || '—' }}</template>
        <template #cell-programado="{ row }">
          <span
            v-if="row.tiene_recojo_programado"
            class="inline-flex items-center gap-1 rounded bg-warning-50 px-2 py-1 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
          >
            <AppIcon :name="ICONS.calendar" :size="12" />
            Programado
          </span>
          <span v-else class="text-gray-400">—</span>
        </template>
        <template #actions="{ row }">
          <button
            v-if="canCreate && !row.tiene_recojo_programado"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm text-white hover:bg-brand-600"
            @click="programar(row)"
          >
            <AppIcon :name="ICONS.truck" :size="15" />
            Programar recojo
          </button>
        </template>
        <template #footer>
          <AppPagination
            v-model:pagina="pagina"
            v-model:limite="limite"
            :meta="pendientesQuery.data.value?.meta"
            :disabled="pendientesQuery.isFetching.value"
          />
        </template>
      </AppTable>
    </section>
    <RecojosListView v-else embedded />
    <RecojoProgramarModal
      v-model="programarOpen"
      :id-cliente="pendiente?.id_cliente"
      :id-prestamo="pendiente?.origen === 'PRESTAMO' ? pendiente.id_origen : undefined"
      :id-alquiler="pendiente?.origen === 'ALQUILER' ? pendiente.id_origen : undefined"
      :tipo-origen="pendiente?.origen"
      :numero-origen="pendiente?.numero_origen"
      @saved="onProgramado"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import RecojoProgramarModal from '@/modules/balones/recojos/components/RecojoProgramarModal.vue'
import RecojosListView from '@/modules/balones/recojos/views/RecojosListView.vue'
import { usePendientesRecojoQuery } from '@/modules/balones/recojos/composables/useRecojosQuery'
import type {
  PendienteRecojo,
  PendienteRecojoFilters,
} from '@/modules/balones/recojos/interfaces/recojo.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppListToolbar,
  AppPagination,
  AppTable,
  ListaOpcionBadge,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const route = useRoute()
const router = useRouter()

const resolveTab = (tab: LocationQueryValue | LocationQueryValue[]) => {
  const value = Array.isArray(tab) ? tab[0] : tab
  return value === 'visitas' ? 'visitas' : 'pendientes'
}

const tab = ref<'pendientes' | 'visitas'>(resolveTab(route.query.tab))
const tabs = [
  { value: 'pendientes' as const, label: 'Pendientes', icon: ICONS.clipboardList },
  { value: 'visitas' as const, label: 'Visitas', icon: ICONS.truck },
]

watch(tab, (value) => {
  const wantsVisitas = value === 'visitas'
  const hasVisitasQuery = route.query.tab === 'visitas'
  if (wantsVisitas === hasVisitasQuery) return
  if (wantsVisitas) {
    void router.replace({ query: { ...route.query, tab: 'visitas' } })
    return
  }
  const { tab: _tab, ...rest } = route.query
  void router.replace({ query: rest })
})

watch(
  () => route.query.tab,
  (value) => {
    const resolved = resolveTab(value)
    if (tab.value !== resolved) tab.value = resolved
  },
)
const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(20)
const filters = ref<PendienteRecojoFilters>({ pagina: 1, limite: 20 })
const pendientesQuery = usePendientesRecojoQuery(filters)
const rows = computed(() =>
  (pendientesQuery.data.value?.data ?? []).map((row) => ({
    ...row,
    row_key: `${row.origen}-${row.id_origen}-${row.tipo_item || 'CILINDRO'}-${row.id_detalle}`,
  })),
)
const authStore = useAuthStore()
const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.RECOJOS_BALON_CREAR))
const pendiente = ref<PendienteRecojo | null>(null)
const programarOpen = ref(false)
const breadcrumbItems = balonesBreadcrumbItems('Recojos')
const columns: TableColumn[] = [
  { key: 'origen', label: 'Origen' },
  { key: 'nombre_cliente', label: 'Cliente' },
  { key: 'origen_numero', label: 'N° préstamo / alquiler' },
  { key: 'cilindro', label: 'Cilindro / producto' },
  { key: 'fecha_retorno', label: 'Fecha retorno' },
  { key: 'programado', label: 'Recojo' },
]
const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'tipoOrigen',
    label: 'Origen',
    type: 'select',
    placeholder: 'Todos',
    options: [
      { value: 'PRESTAMO', label: 'Préstamo' },
      { value: 'ALQUILER', label: 'Alquiler' },
    ],
  },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

function syncFilters() {
  const active = dynamicFilters.value
  filters.value = {
    buscar: buscar.value.trim() || undefined,
    pagina: pagina.value,
    limite: limite.value,
    tipoOrigen:
      active.tipoOrigen === 'PRESTAMO' || active.tipoOrigen === 'ALQUILER'
        ? active.tipoOrigen
        : undefined,
  }
}

function onFiltersChange() {
  pagina.value = 1
  syncFilters()
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncFilters()
  }, 350)
})

watch([pagina, limite], () => syncFilters())

function etiquetaItem(row: PendienteRecojo) {
  if (row.codigo_balon) return row.codigo_balon
  if (row.tipo_item === 'REGULADOR') return 'Regulador / accesorio'
  return `#${row.id_balon || row.id_detalle}`
}

function programar(row: PendienteRecojo) {
  pendiente.value = row
  programarOpen.value = true
}

function onProgramado() {
  void pendientesQuery.refetch()
}
</script>

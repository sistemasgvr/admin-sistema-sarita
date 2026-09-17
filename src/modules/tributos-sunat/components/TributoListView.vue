<template>
  <div>
    <PageBreadcrumb :page-title="config.plural" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading" :empty-text="`No hay ${config.plural.toLowerCase()} registradas.`">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          :search-placeholder="`Serie, número o ${config.contraparte.toLowerCase()}...`"
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <button
              v-if="canCreate"
              type="button"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 sm:px-4"
              :title="`Nueva ${config.singular.toLowerCase()}`"
              @click="router.push({ name: config.rutas.nueva })"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              <span class="hidden sm:inline">Nueva {{ config.singular.toLowerCase() }}</span>
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-documento="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ row.serie }}-{{ row.numero }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatFecha(row.fecha_emision) }}</p>
      </template>

      <template #cell-contraparte="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ row[config.campos.nombreContraparte] ?? '—' }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ row[config.campos.documentoContraparte] ?? '' }}</p>
      </template>

      <template #cell-regimen="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.regimen }} · {{ Number(row.tasa) }}%</span>
      </template>

      <template #cell-base_imponible="{ value }">
        <span class="tabular-nums">{{ formatMoney(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-tributo="{ row }">
        <span class="tabular-nums font-medium">{{ formatMoney(Number(row[config.campos.montoTributo] ?? 0)) }}</span>
      </template>

      <template #cell-estado="{ row }">
        <TributoEstadoBadge :estado="row.nombre_estado_sunat" />
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            v-if="canView"
            type="button"
            title="Ver detalle"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="router.push({ name: config.rutas.detalle, params: { id: row.id } })"
          >
            <AppIcon :name="ICONS.eye" :size="15" />
          </button>
        </div>
      </template>

      <template #footer>
        <AppPagination v-model:pagina="pagina" v-model:limite="limite" :meta="query.data.value?.meta" :disabled="isLoading" />
      </template>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useEmpresaSeleccionada } from '@/modules/configuracion/empresas/composables/useEmpresaSeleccionada'
import { AppListToolbar, AppPagination, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { TRIBUTOS_CONFIG } from '../config/tributos.config'
import { useTributosQuery } from '../composables/useTributosQuery'
import type { TipoTributo, TributoListFilters, TributoListItem } from '../interfaces/tributo.interface'
import { formatFecha, formatMoney } from '../utils/formato'
import TributoEstadoBadge from './TributoEstadoBadge.vue'

const props = defineProps<{ tipo: TipoTributo }>()
const config = computed(() => TRIBUTOS_CONFIG[props.tipo])

const router = useRouter()
const authStore = useAuthStore()
const empresaSeleccionada = useEmpresaSeleccionada()

const canCreate = computed(() => authStore.hasPermission(config.value.permisos.crear))
const canView = computed(() => authStore.hasPermission(config.value.permisos.ver))

const breadcrumbItems = computed(() => [config.value.breadcrumbPadre, { label: config.value.plural }])

const buscar = ref('')
const pagina = ref(1)
const limite = ref(20)
const dynamicFilters = ref<DynamicFilterValues>({})

const filterFields: DynamicFilterFieldDef[] = [
  { key: 'fechaDesde', label: 'Desde', type: 'date' },
  { key: 'fechaHasta', label: 'Hasta', type: 'date' },
]

const filters = computed<TributoListFilters>(() => ({
  buscar: buscar.value || undefined,
  idEmpresa: empresaSeleccionada.value ?? undefined,
  fechaDesde: (dynamicFilters.value.fechaDesde as string) || undefined,
  fechaHasta: (dynamicFilters.value.fechaHasta as string) || undefined,
  pagina: pagina.value,
  tamano: limite.value,
}))

const query = useTributosQuery(props.tipo, filters)
const rows = computed(() => query.data.value?.data ?? [])
const isLoading = computed(() => query.isLoading.value || query.isFetching.value)

watch([buscar, limite, empresaSeleccionada], () => {
  pagina.value = 1
})

function onFiltersChange() {
  pagina.value = 1
}

const columns = computed<TableColumn<TributoListItem>[]>(() => [
  { key: 'documento', label: 'Documento', mobile: 'primary' },
  { key: 'contraparte', label: config.value.contraparte },
  { key: 'regimen', label: 'Régimen' },
  { key: 'base_imponible', label: 'Base', align: 'right' },
  { key: 'tributo', label: config.value.singular, align: 'right' },
  { key: 'estado', label: 'SUNAT', align: 'center', mobile: 'badge' },
])
</script>

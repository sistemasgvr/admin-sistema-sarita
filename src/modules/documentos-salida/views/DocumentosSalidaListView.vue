<template>
  <div>
    <PageBreadcrumb page-title="Documentos de salida" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Buscar por número, serie, cliente..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <router-link
              v-if="canCreate"
              :to="{ name: 'admin-documentos-salida-nueva' }"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 sm:px-4"
              title="Nuevo documento de salida"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              <span class="hidden sm:inline">Nuevo documento</span>
            </router-link>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-numero="{ row }">
        <router-link
          :to="{ name: 'admin-documentos-salida-editar', params: { id: row.id } }"
          class="font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          {{ row.numero }}
        </router-link>
        <p v-if="row.serie && row.numero_sunat" class="text-xs text-gray-500 dark:text-gray-400">
          GRE {{ row.serie }}-{{ row.numero_sunat }}
        </p>
      </template>

      <template #cell-nombre_tipo_orden="{ value }">
        <AppBadge size="sm" color="primary">{{ formatTipoOrden(value) }}</AppBadge>
      </template>

      <template #cell-nombre_estado_ciclo="{ value }">
        <AppBadge size="sm" :color="estadoCicloColor(value)">{{ value }}</AppBadge>
      </template>

      <template #cell-estado_sunat="{ row }">
        <AppBadge v-if="row.nombre_estado_sunat" size="sm" :color="estadoSunatColor(row.nombre_estado_sunat)">
          {{ row.nombre_estado_sunat }}
        </AppBadge>
        <span v-else class="text-xs text-gray-400">—</span>
      </template>

      <template #cell-contraparte="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.nombre_cliente ?? row.nombre_proveedor ?? '—' }}
        </p>
        <p v-if="row.detalle_desde_venta" class="text-xs text-gray-500 dark:text-gray-400">
          Venta {{ row.serie_venta }}-{{ row.numero_venta }}
        </p>
      </template>

      <template #cell-almacen="{ row }">
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ row.nombre_almacen ?? '—' }}</p>
      </template>

      <template #cell-fecha="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ row.fecha }}</p>
      </template>

      <template #cell-total_items="{ value }">
        <span class="tabular-nums">{{ value }}</span>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <router-link
            :to="{ name: 'admin-documentos-salida-editar', params: { id: row.id } }"
            title="Ver / editar"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <AppIcon :name="ICONS.eye" :size="15" />
          </router-link>
        </div>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="listQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useDocumentosSalidaQuery } from '../composables/useDocumentosSalidaQuery'
import type {
  CodigoTipoOrdenSalida,
  DocumentoSalidaListFilters,
} from '../interfaces/documento-salida.interface'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { AppBadge, AppListToolbar, AppPagination, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const breadcrumbItems = [{ label: 'Documentos de salida' }]

const authStore = useAuthStore()
const route = useRoute()

const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<DocumentoSalidaListFilters>({ buscar: '', pagina: 1, limite: 10 })
const listQuery = useDocumentosSalidaQuery(filters)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.DOCUMENTOS_SALIDA_CREAR))

const isLoading = computed(() => listQuery.isFetching.value)
const rows = computed(() => listQuery.data.value?.data ?? [])

const TIPO_LABELS: Record<string, string> = {
  ORDEN_SALIDA_VENTA: 'Orden de venta',
  ORDEN_SALIDA_INTERNA: 'Orden interna',
  RECARGA_PLANTA_EXTERNA: 'Recarga planta',
  RETORNO_PLANTA_EXTERNA: 'Retorno planta',
  TRASLADO: 'Traslado',
}
function formatTipoOrden(codigo: unknown) {
  const key = String(codigo ?? '')
  return TIPO_LABELS[key] ?? key
}

function estadoCicloColor(estado: unknown) {
  if (estado === 'ANULADA') return 'error'
  if (estado === 'EMITIDA_SUNAT') return 'success'
  if (estado === 'GENERADA') return 'primary'
  return 'warning'
}

function estadoSunatColor(estado: string) {
  if (estado === 'ACEPTADO') return 'success'
  if (estado === 'RECHAZADO') return 'error'
  return 'warning'
}

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'codigoTipoOrden',
    label: 'Tipo',
    type: 'select',
    placeholder: 'Todos',
    options: Object.entries(TIPO_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    key: 'fechaDesde',
    label: 'Desde',
    type: 'date',
  },
  {
    key: 'fechaHasta',
    label: 'Hasta',
    type: 'date',
  },
])

const columns: TableColumn[] = [
  { key: 'numero', label: 'Número', mobile: 'primary' },
  { key: 'nombre_tipo_orden', label: 'Tipo', mobile: 'badge' },
  { key: 'nombre_estado_ciclo', label: 'Estado' },
  { key: 'estado_sunat', label: 'SUNAT' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'contraparte', label: 'Cliente / Proveedor' },
  { key: 'almacen', label: 'Almacén' },
  { key: 'total_items', label: 'Ítems', align: 'right' },
]

function syncFilters() {
  const active = dynamicFilters.value
  const codigoFromQuery = String(route.query.codigoTipoOrden ?? '') as CodigoTipoOrdenSalida | ''

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    codigoTipoOrden:
      (active.codigoTipoOrden as CodigoTipoOrdenSalida) || codigoFromQuery || undefined,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
  }
}

function onFiltersChange() {
  pagina.value = 1
  syncFilters()
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined
watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncFilters()
  }, 350)
})

watch([pagina, limite], () => {
  syncFilters()
})

watch(
  () => route.query.codigoTipoOrden,
  () => syncFilters(),
  { immediate: true },
)
</script>

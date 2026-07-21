<template>
  <div>
    <PageBreadcrumb
      v-if="!embedded"
      page-title="Antigüedad de préstamos"
      :items="breadcrumbItems"
    />

    <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
      <button
        v-for="card in resumenCards"
        :key="card.key"
        type="button"
        class="rounded-xl border px-4 py-3 text-left transition"
        :class="
          isRangoActivo(card.rango)
            ? card.activeClass
            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03]'
        "
        @click="aplicarRango(card.rango)"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="text-theme-xs text-gray-500 dark:text-gray-400">{{ card.label }}</p>
          <span
            class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            :class="card.iconClass"
          >
            <AppIcon :name="card.icon" :size="15" />
          </span>
        </div>
        <p class="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
          {{ card.count }}
        </p>
      </button>
    </div>

    <AppTable :columns="columns" :rows="rows" row-key="id_detalle" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Cliente, código, gas..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              :disabled="!rows.length"
              @click="exportCsv"
            >
              <AppIcon :name="ICONS.download" :size="18" />
              Exportar CSV
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-cliente="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.nombre_cliente || '—' }}
        </p>
        <p v-if="row.numero_prestamo" class="text-theme-xs text-gray-500">
          {{ row.numero_prestamo }}
        </p>
      </template>

      <template #cell-cilindro="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.codigo_balon || '—' }}
        </p>
        <p class="text-theme-xs text-gray-500">
          {{ row.nombre_producto_gas || '—' }}
          <span v-if="row.capacidad != null">
            · {{ row.capacidad }}{{ row.nombre_unidad_medida ? ` ${row.nombre_unidad_medida}` : '' }}
          </span>
        </p>
      </template>

      <template #cell-ph="{ row }">
        {{ formatMonthYear(row.fecha_proxima_prueba_hidrostatica) }}
      </template>

      <template #cell-fecha_inicio_prestamo="{ value }">
        <span class="whitespace-nowrap">
          {{ typeof value === 'string' && value ? value.slice(0, 10) : '—' }}
        </span>
      </template>

      <template #cell-dias_en_prestamo="{ row }">
        <span class="font-medium">{{ row.dias_en_prestamo ?? '—' }}</span>
      </template>

      <template #cell-rango_antiguedad="{ row }">
        <AppBadge size="sm" :color="rangoBadgeColor(row.rango_antiguedad)">
          {{ rangoLabel(row.rango_antiguedad) }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            type="button"
            title="Ver detalle del préstamo"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openPrestamoDetail(row)"
          >
            <AppIcon :name="ICONS.eye" :size="15" />
          </button>
          <AppActionMenu
            :items="actionItemsForRow(row)"
            :execute="(key) => onActionSelect(key, row)"
          />
        </div>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="query.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <PrestamoDetailModal v-model="prestamoDetailOpen" :prestamo-id="prestamoToViewId" />
    <BalonDetailModal v-model="balonDetailOpen" :balon-id="balonToViewId" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import BalonDetailModal from '@/modules/balones/cilindros/components/BalonDetailModal.vue'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import PrestamoDetailModal from '@/modules/balones/prestamos/components/PrestamoDetailModal.vue'
import { usePrestamosAntiguedadQuery } from '@/modules/balones/prestamos/composables/usePrestamosAntiguedadQuery'
import type {
  PrestamoAntiguedadFilters,
  PrestamoAntiguedadItem,
  PrestamoAntiguedadResumen,
  RangoAntiguedadPrestamo,
} from '@/modules/balones/prestamos/interfaces/prestamo-antiguedad.interface'
import { formatMonthYear } from '@/modules/balones/utils/formatMonthYear'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import {
  AppActionMenu,
  AppBadge,
  AppListToolbar,
  AppPagination,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS, type IconName } from '@/shared/constants/icons'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'
import type {
  DynamicFilterFieldDef,
  DynamicFilterValues,
} from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false,
  },
)

const router = useRouter()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({
  excluirBajas: true,
  soloPendientes: true,
})
const pagina = ref(1)
const limite = ref(50)

const filters = ref<PrestamoAntiguedadFilters>({
  buscar: '',
  pagina: 1,
  limite: 50,
  excluirBajas: true,
  soloPendientes: true,
})

const query = usePrestamosAntiguedadQuery(filters)
const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const prestamoDetailOpen = ref(false)
const prestamoToViewId = ref<number | null>(null)
const balonDetailOpen = ref(false)
const balonToViewId = ref<number | null>(null)

const breadcrumbItems = computed(() => [
  ...balonesBreadcrumbItems('Préstamos').slice(0, 1),
  { label: 'Préstamos', to: '/admin/balones/prestamos' },
  { label: 'Antigüedad' },
])

const isLoading = computed(() => query.isFetching.value)
const rows = computed(() => query.data.value?.data ?? [])
const resumen = computed(
  () => (query.data.value?.meta?.resumen ?? {}) as PrestamoAntiguedadResumen,
)

const isRangoActivo = (rango?: RangoAntiguedadPrestamo) =>
  (filters.value.rangoDias ?? undefined) === rango

const resumenCards = computed(() => [
  {
    key: 'todos',
    label: 'Todos',
    count: resumen.value.total_pendientes ?? 0,
    rango: undefined as RangoAntiguedadPrestamo | undefined,
    icon: ICONS.list as IconName,
    iconClass: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
    activeClass: 'border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10',
  },
  {
    key: 'critico',
    label: '180+ días',
    count: resumen.value.critico_180 ?? 0,
    rango: 'CRITICO_180' as const,
    icon: ICONS.alertTriangle as IconName,
    iconClass: 'bg-error-100 text-error-600 dark:bg-error-500/20 dark:text-error-300',
    activeClass: 'border-error-300 bg-error-50 dark:border-error-500/40 dark:bg-error-500/10',
  },
  {
    key: 'seguimiento',
    label: '90–180 días',
    count: resumen.value.seguimiento_90_180 ?? 0,
    rango: 'SEGUIMIENTO_90_180' as const,
    icon: ICONS.alertCircle as IconName,
    iconClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    activeClass: 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10',
  },
  {
    key: 'atencion',
    label: '30–90 días',
    count: resumen.value.atencion_30_90 ?? 0,
    rango: 'ATENCION_30_90' as const,
    icon: ICONS.clock as IconName,
    iconClass: 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300',
    activeClass:
      'border-warning-300 bg-warning-50 dark:border-warning-500/40 dark:bg-warning-500/10',
  },
  {
    key: 'reciente',
    label: '< 30 días',
    count: resumen.value.reciente_0_30 ?? 0,
    rango: 'RECIENTE_0_30' as const,
    icon: ICONS.check as IconName,
    iconClass: 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300',
    activeClass:
      'border-success-300 bg-success-50 dark:border-success-500/40 dark:bg-success-500/10',
  },
])

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idCliente',
    label: 'Cliente',
    type: 'select',
    placeholder: 'Todos',
    disabled: clientesQuery.isLoading.value,
    options: (clientesQuery.data.value?.data ?? []).map((cliente) => ({
      label:
        cliente.razon_social ||
        [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
        cliente.numero_documento,
      value: cliente.id,
    })),
  },
  {
    key: 'excluirBajas',
    label: 'Excluir bajas',
    type: 'checkbox',
    placeholder: 'Excluir dados de baja / robados',
  },
  {
    key: 'soloPendientes',
    label: 'Solo pendientes',
    type: 'checkbox',
    placeholder: 'Sin devolución',
  },
])

const columns = computed<TableColumn<PrestamoAntiguedadItem>[]>(() => [
  { key: 'cliente', label: 'Cliente' },
  { key: 'cilindro', label: 'Cilindro / gas' },
  { key: 'nombre_marca_cilindro', label: 'Marca' },
  { key: 'nombre_planta', label: 'Planta' },
  { key: 'ph', label: 'Próx. P.H.' },
  { key: 'fecha_inicio_prestamo', label: 'Desde', cellClass: 'whitespace-nowrap' },
  { key: 'dias_en_prestamo', label: 'Días', cellClass: 'whitespace-nowrap' },
  { key: 'rango_antiguedad', label: 'Alerta', cellClass: 'whitespace-nowrap' },
])

const rangoLabel = (rango: RangoAntiguedadPrestamo) => {
  if (rango === 'CRITICO_180') return '180+ días'
  if (rango === 'SEGUIMIENTO_90_180') return '90–180'
  if (rango === 'ATENCION_30_90') return '30–90'
  if (rango === 'RECIENTE_0_30') return '< 30'
  return 'Devuelto'
}

const rangoBadgeColor = (rango: RangoAntiguedadPrestamo): BadgeColor => {
  if (rango === 'CRITICO_180') return 'error'
  if (rango === 'SEGUIMIENTO_90_180') return 'warning'
  if (rango === 'ATENCION_30_90') return 'warning'
  if (rango === 'RECIENTE_0_30') return 'success'
  return 'neutral'
}

function actionItemsForRow(row: PrestamoAntiguedadItem): ActionMenuItem[] {
  return [
    {
      key: 'detalle-prestamo',
      label: 'Ver detalle del préstamo',
      icon: ICONS.eye,
    },
    {
      key: 'detalle-cilindro',
      label: 'Ver ficha del cilindro',
      icon: ICONS.cylinder,
      disabled: !row.id_balon,
    },
    {
      key: 'mapa-cliente',
      label: 'Ver cliente en el mapa',
      icon: ICONS.mapPin,
      disabled: !row.id_cliente,
    },
  ]
}

function openPrestamoDetail(row: PrestamoAntiguedadItem) {
  prestamoToViewId.value = row.id_prestamo
  prestamoDetailOpen.value = true
}

function openBalonDetail(row: PrestamoAntiguedadItem) {
  if (!row.id_balon) return
  balonToViewId.value = row.id_balon
  balonDetailOpen.value = true
}

function openClienteMapa(row: PrestamoAntiguedadItem) {
  if (!row.id_cliente) return
  router.push({
    name: 'admin-clientes-mapa',
    query: {
      idCliente: String(row.id_cliente),
      ...(row.nombre_cliente ? { buscar: row.nombre_cliente } : {}),
    },
  })
}

function onActionSelect(key: string, row: PrestamoAntiguedadItem) {
  switch (key) {
    case 'detalle-prestamo':
      openPrestamoDetail(row)
      return
    case 'detalle-cilindro':
      openBalonDetail(row)
      return
    case 'mapa-cliente':
      openClienteMapa(row)
      return
  }
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  const active = dynamicFilters.value
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idCliente: active.idCliente != null ? Number(active.idCliente) : undefined,
    rangoDias: (active.rangoDias as string | undefined) || undefined,
    excluirBajas: active.excluirBajas !== false,
    soloPendientes: active.soloPendientes !== false,
  }
}

const onFiltersChange = () => {
  pagina.value = 1
  syncFilters()
}

const aplicarRango = (rango?: RangoAntiguedadPrestamo) => {
  dynamicFilters.value = {
    ...dynamicFilters.value,
    rangoDias: rango,
  }
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

watch([pagina, limite], () => {
  syncFilters()
})

const exportCsv = () => {
  const header = [
    'Cliente',
    'Nro préstamo',
    'Código',
    'Serie',
    'Gas',
    'Capacidad',
    'Marca',
    'Planta',
    'Órgano',
    'Desde',
    'Días',
    'Rango',
    'P.H. próxima',
  ]

  const lines = rows.value.map((row) =>
    [
      row.nombre_cliente,
      row.numero_prestamo,
      row.codigo_balon,
      row.numero_serie,
      row.nombre_producto_gas,
      row.capacidad != null
        ? `${row.capacidad}${row.nombre_unidad_medida ? ` ${row.nombre_unidad_medida}` : ''}`
        : '',
      row.nombre_marca_cilindro,
      row.nombre_planta,
      row.organo_inspector_no_aplica ? 'N/A' : row.nombre_organo_inspector,
      row.fecha_inicio_prestamo?.slice(0, 10),
      row.dias_en_prestamo,
      rangoLabel(row.rango_antiguedad),
      formatMonthYear(row.fecha_proxima_prueba_hidrostatica),
    ]
      .map((value) => {
        const text = value == null ? '' : String(value)
        return `"${text.replace(/"/g, '""')}"`
      })
      .join(','),
  )

  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `prestamos-antiguedad-${filters.value.rangoDias || 'todos'}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
    <PageBreadcrumb page-title="Historial de caja" :items="breadcrumbItems" />

    <div class="space-y-4">
      <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
        <template #toolbar>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div class="w-full sm:w-64">
                <AppDateRangePicker v-model="rango" placeholder="Rango de fechas" />
              </div>
              <div class="w-full sm:w-48">
                <AppSelect v-model="filtroEstado" :options="estadoOptions" />
              </div>
            </div>
            <RouterLink
              :to="{ name: 'admin-ventas-caja' }"
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <AppIcon :name="ICONS.cashRegister" :size="16" />
              Ir a caja del día
            </RouterLink>
          </div>
        </template>

        <template #cell-fecha="{ row }">
          <div>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ formatListDate(row.fecha) }}
            </p>
            <p v-if="row.nombreSucursal" class="text-theme-xs text-gray-400">
              {{ row.nombreSucursal }}
            </p>
          </div>
        </template>

        <template #cell-estado="{ row }">
          <div class="flex flex-col gap-1">
            <AppBadge :color="row.estadoCaja === 'ABIERTA' ? 'success' : 'warning'" size="sm">
              {{ row.estadoCaja || '—' }}
            </AppBadge>
            <AppBadge
              v-if="esSesionPendiente(row)"
              color="error"
              size="sm"
            >
              Sin cierre diario
            </AppBadge>
          </div>
        </template>

        <template #cell-montos="{ row }">
          <div class="text-right text-theme-sm">
            <p class="font-semibold text-gray-800 dark:text-white/90">
              Inicial {{ formatCurrency(row.montoInicial) }}
            </p>
            <p v-if="row.estadoCaja === 'CERRADA'" class="text-theme-xs text-gray-400">
              Contado {{ formatCurrency(row.montoEfectivoContado ?? 0) }} · Dif.
              {{ formatCurrency(row.diferencia ?? 0) }}
            </p>
            <p v-else-if="row.montoEsperado != null" class="text-theme-xs text-gray-400">
              Esperado {{ formatCurrency(row.montoEsperado) }}
            </p>
          </div>
        </template>

        <template #cell-apertura="{ row }">
          <div class="text-theme-sm">
            <p class="text-gray-800 dark:text-white/90">{{ formatDateTime(row.fechaApertura) }}</p>
            <p v-if="row.usuarioApertura" class="text-theme-xs text-gray-400">
              {{ row.usuarioApertura }}
            </p>
          </div>
        </template>

        <template #cell-cierre="{ row }">
          <div class="text-theme-sm">
            <p class="text-gray-800 dark:text-white/90">{{ formatDateTime(row.fechaCierre) }}</p>
            <p v-if="row.usuarioCierre" class="text-theme-xs text-gray-400">
              {{ row.usuarioCierre }}
            </p>
          </div>
        </template>

        <template #actions="{ row }">
          <button
            type="button"
            title="Ver detalle del día"
            class="inline-flex items-center rounded-lg px-2 py-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            @click="abrirDia(row)"
          >
            <AppIcon :name="ICONS.eye" :size="16" />
          </button>
        </template>

        <template #footer>
          <AppPagination
            v-model:pagina="pagina"
            v-model:limite="limite"
            :meta="sesionesQuery.data.value?.meta"
            :disabled="isLoading"
          />
        </template>
      </AppTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { ventasBreadcrumbItems } from '@/modules/ventas/config/ventas-breadcrumb'
import { useCajaSesionesQuery } from '@/modules/caja/composables/useCajaQuery'
import type {
  CajaSesion,
  CajaSesionesListFilters,
} from '@/modules/caja/interfaces/caja.interface'
import {
  AppBadge,
  AppDateRangePicker,
  AppPagination,
  AppSelect,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { RangoFechas, SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { ICONS } from '@/shared/constants/icons'
import { formatCurrency } from '@/shared/utils/currency'
import { formatDateTime, formatListDate, hoyIsoLima } from '@/shared/utils/date'

const breadcrumbItems = ventasBreadcrumbItems('Historial de caja')
const router = useRouter()

const rango = ref<RangoFechas>({ start: '', end: '' })
const filtroEstado = ref('')
const pagina = ref(1)
const limite = ref(20)

watch([rango, filtroEstado, limite], () => {
  pagina.value = 1
})

const estadoOptions: SelectOption[] = [
  { label: 'Todos los estados', value: '' },
  { label: 'Abierta', value: 'ABIERTA' },
  { label: 'Cerrada', value: 'CERRADA' },
]

const filters = computed<CajaSesionesListFilters>(() => ({
  fechaDesde: rango.value.start || undefined,
  fechaHasta: rango.value.end || undefined,
  estadoCaja: filtroEstado.value || undefined,
  pagina: pagina.value,
  limite: limite.value,
}))

const sesionesQuery = useCajaSesionesQuery(filters)
const rows = computed(() => sesionesQuery.data.value?.data ?? [])
const isLoading = computed(() => sesionesQuery.isLoading.value)

const columns: TableColumn[] = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'estado', label: 'Estado' },
  { key: 'montos', label: 'Montos', align: 'right' },
  { key: 'apertura', label: 'Apertura' },
  { key: 'cierre', label: 'Cierre' },
  { key: 'actions', label: '', align: 'right' },
]

function abrirDia(row: CajaSesion) {
  const fecha = String(row.fecha ?? '').slice(0, 10)
  void router.push({ name: 'admin-ventas-caja', query: fecha ? { fecha } : undefined })
}

function hoyLocal(): string {
  return hoyIsoLima()
}

function esSesionPendiente(row: CajaSesion) {
  return (
    row.estadoCaja === 'ABIERTA' &&
    Boolean(row.fecha) &&
    String(row.fecha).slice(0, 10) < hoyLocal()
  )
}
</script>

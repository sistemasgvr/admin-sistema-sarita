<template>
  <div class="space-y-5">
    <!-- data-tutorial: anclas de la ruta guiada de Soporte (Finanzas › garantías). -->
    <AppTable data-tutorial="garantias-tabla" :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Buscar por cliente, préstamo, alquiler..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <button
              v-if="canExportar"
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] lg:h-auto lg:w-auto lg:px-3 lg:py-2"
              data-tutorial="garantias-exportar"
              title="Exportar"
              aria-label="Exportar"
              @click="exportarModalOpen = true"
            >
              <AppIcon :name="ICONS.download" :size="16" />
              <span class="hidden lg:inline">Exportar</span>
            </button>
            <button
              v-if="canCrear"
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 lg:h-auto lg:w-auto lg:px-4 lg:py-2.5"
              data-tutorial="garantias-nueva"
              title="Nueva garantía"
              aria-label="Nueva garantía"
              @click="openCrear"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              <span class="hidden lg:inline">Nueva garantía</span>
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-fecha="{ row }">{{ formatListDate(row.fecha_registro) }}</template>

      <template #cell-cliente="{ row }">
        <div class="min-w-0">
          <p class="truncate font-medium text-gray-800 dark:text-white/90">
            {{ row.nombre_cliente || '—' }}
          </p>
          <p class="text-theme-xs text-gray-400 dark:text-gray-500">
            {{ row.documento_cliente || '—' }}
          </p>
        </div>
      </template>

      <template #cell-origen="{ row }">
        <div class="min-w-0">
          <AppBadge :color="origenColor(resolveOrigen(row))" size="sm">
            {{ origenLabel(resolveOrigen(row)) }}
          </AppBadge>
          <p class="mt-0.5 truncate text-theme-xs text-gray-400 dark:text-gray-500">
            {{ origenDetalle(row) }}
          </p>
        </div>
      </template>

      <template #cell-montos="{ row }">
        <div class="text-right text-theme-sm">
          <p class="font-semibold text-gray-800 dark:text-white/90">
            {{ formatCurrency(row.monto_cobrado) }}
          </p>
          <p class="text-theme-xs text-gray-400 dark:text-gray-500">
            Saldo {{ formatCurrency(row.monto_saldo) }}
            <span v-if="Number(row.monto_devuelto) > 0">
              · Dev. {{ formatCurrency(row.monto_devuelto) }}
            </span>
          </p>
          <p v-if="row.medio_pago" class="text-theme-xs text-gray-400 dark:text-gray-500">
            {{ row.medio_pago }}
          </p>
        </div>
      </template>

      <template #cell-estado="{ row }">
        <AppBadge :color="estadoColor(row.nombre_estado)" size="sm">
          {{ row.nombre_estado || '—' }}
        </AppBadge>
      </template>

      <template #cell-observacion="{ row }">
        <span class="line-clamp-2 text-theme-sm text-gray-500 dark:text-gray-400">
          {{ row.observacion || '—' }}
        </span>
      </template>

      <template #actions="{ row }">
        <button
          type="button"
          data-tutorial="garantias-ver"
          title="Ver detalle"
          class="inline-flex items-center rounded-lg px-2 py-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetalle(row)"
        >
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>
        <button
          v-if="canReembolsar && Number(row.monto_saldo) > 0"
          type="button"
          data-tutorial="garantias-devolver"
          title="Devolver garantía"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
          @click="openReembolsar(row)"
        >
          <AppIcon :name="ICONS.banknote" :size="16" />
        </button>
        <button
          v-if="canEditar && row.puede_editar"
          type="button"
          data-tutorial="garantias-editar"
          title="Editar garantía"
          class="inline-flex items-center rounded-lg px-2 py-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
          @click="openEditar(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
        </button>
        <button
          v-if="canEliminar && row.puede_eliminar"
          type="button"
          title="Eliminar garantía manual"
          class="inline-flex items-center rounded-lg px-2 py-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          @click="openEliminar(row)"
        >
          <AppIcon :name="ICONS.trash" :size="16" />
        </button>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="garantiasQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <GarantiaFormModal
      v-if="canCrear || canEditar"
      v-model="formModalOpen"
      :garantia="garantiaEditando"
    />

    <ReembolsarGarantiaModal
      v-if="canReembolsar"
      v-model="reembolsarModalOpen"
      :garantia="garantiaAReembolsar"
    />

    <GarantiaDetalleModal
      v-model="detalleOpen"
      :garantia-id="garantiaDetalleId"
      :inicial="garantiaDetalleInicial"
    />

    <AppConfirmDialog
      v-if="canEliminar"
      v-model="eliminarOpen"
      title="Eliminar garantía"
      variant="danger"
      confirm-label="Sí, eliminar"
      loading-label="Eliminando..."
      :loading="eliminarMutation.isPending.value"
      @confirm="confirmarEliminar"
    >
      <span>
        ¿Confirmas eliminar la garantía de
        <strong v-if="garantiaAEliminar">{{ garantiaAEliminar.nombre_cliente }}</strong>
        por
        <strong v-if="garantiaAEliminar">{{ formatCurrency(garantiaAEliminar.monto_cobrado) }}</strong>?
        Se hace una baja lógica.
      </span>
    </AppConfirmDialog>

    <AppExportarExcelModal
      v-model="exportarModalOpen"
      title="Exportar garantías"
      :on-exportar="exportarGarantias"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  AppBadge,
  AppConfirmDialog,
  AppListToolbar,
  AppPagination,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import GarantiaFormModal from '@/modules/finanzas/components/GarantiaFormModal.vue'
import GarantiaDetalleModal from '@/modules/finanzas/components/GarantiaDetalleModal.vue'
import ReembolsarGarantiaModal from '@/modules/finanzas/components/ReembolsarGarantiaModal.vue'
import AppExportarExcelModal from '@/modules/finanzas/components/AppExportarExcelModal.vue'
import { useGarantiasQuery } from '@/modules/finanzas/composables/useGarantiasQuery'
import { useEliminarGarantiaMutation } from '@/modules/finanzas/composables/useGarantiaMutations'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type {
  EstadoGarantia,
  Garantia,
  GarantiaListFilters,
} from '@/modules/finanzas/interfaces/garantia.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatCurrency } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'
import { exportarGarantiasExcel } from '@/modules/finanzas/utils/exportarExcel'
import {
  estadoColor,
  origenColor,
  origenDetalle,
  origenLabel,
  resolveOrigen,
} from '@/modules/finanzas/utils/garantiaDetalle'
import { useTutorialAutoStart } from '@/modules/soporte/composables/useTutorialAutoStart'
import { createFinanzasGarantiasTutorial } from '@/modules/soporte/tutorials/finanzas-garantias.tutorial'

const authStore = useAuthStore()

const canCrear = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_CREAR))

useTutorialAutoStart('finanzas-garantias', createFinanzasGarantiasTutorial)
const canEditar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_EDITAR))
const canEliminar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_ELIMINAR))
const canReembolsar = computed(() =>
  authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_REEMBOLSAR),
)
const canExportar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_EXPORTAR))

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filterFields: DynamicFilterFieldDef[] = [
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Todas',
    options: [
      { label: 'Activas', value: 'ACTIVA' },
      { label: 'Parciales', value: 'PARCIAL' },
      { label: 'Devueltas', value: 'DEVUELTA' },
    ],
  },
  { key: 'desde', label: 'Desde', type: 'date' },
  { key: 'hasta', label: 'Hasta', type: 'date' },
]

const filters = ref<GarantiaListFilters>({ buscar: '', pagina: 1, limite: 10 })

const garantiasQuery = useGarantiasQuery(filters)
const rows = computed(() => garantiasQuery.data.value?.data ?? [])
const isLoading = computed(() => garantiasQuery.isFetching.value)

const columns: TableColumn<Garantia>[] = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'origen', label: 'Origen' },
  { key: 'montos', label: 'Montos', align: 'right' },
  { key: 'estado', label: 'Estado', align: 'center' },
  { key: 'observacion', label: 'Observaciones' },
]

function parseEstado(): EstadoGarantia | undefined {
  const raw = String(dynamicFilters.value.estado ?? '')
  if (raw === 'ACTIVA' || raw === 'PARCIAL' || raw === 'DEVUELTA') return raw
  return undefined
}

function parseFecha(key: 'desde' | 'hasta'): string | undefined {
  const raw = dynamicFilters.value[key]
  if (raw === '' || raw == null) return undefined
  return String(raw)
}

function syncFilters() {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    estado: parseEstado(),
    desde: parseFecha('desde'),
    hasta: parseFecha('hasta'),
  }
}

function onFiltersChange() {
  pagina.value = 1
  syncFilters()
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined
watch(buscar, (v) => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    filters.value = { ...filters.value, buscar: v.trim(), pagina: 1 }
  }, 300)
})

watch([pagina, limite], () => {
  syncFilters()
})

const formModalOpen = ref(false)
const garantiaEditando = ref<Garantia | null>(null)
const openCrear = () => {
  garantiaEditando.value = null
  formModalOpen.value = true
}
const openEditar = (g: Garantia) => {
  garantiaEditando.value = g
  formModalOpen.value = true
}
watch(formModalOpen, (open) => {
  if (!open) garantiaEditando.value = null
})

const detalleOpen = ref(false)
const garantiaDetalleId = ref<number | null>(null)
const garantiaDetalleInicial = ref<Garantia | null>(null)

const openDetalle = (g: Garantia) => {
  garantiaDetalleInicial.value = g
  garantiaDetalleId.value = g.id
  detalleOpen.value = true
}

const reembolsarModalOpen = ref(false)
const garantiaAReembolsar = ref<Garantia | null>(null)
const openReembolsar = (g: Garantia) => {
  garantiaAReembolsar.value = g
  reembolsarModalOpen.value = true
}

const eliminarOpen = ref(false)
const garantiaAEliminar = ref<Garantia | null>(null)
const eliminarMutation = useEliminarGarantiaMutation()

const openEliminar = (g: Garantia) => {
  garantiaAEliminar.value = g
  eliminarOpen.value = true
}

const confirmarEliminar = async () => {
  const g = garantiaAEliminar.value
  if (!g) return
  try {
    await eliminarMutation.mutateAsync({
      id: g.id,
      idUsuarioAuditoria: authStore.user?.id ?? undefined,
    })
  } catch {
    /* toast en mutación */
  } finally {
    eliminarOpen.value = false
    garantiaAEliminar.value = null
  }
}

const exportarModalOpen = ref(false)
const exportarGarantias = async (r: { desde?: string; hasta?: string }) => {
  await exportarGarantiasExcel(r)
}
</script>

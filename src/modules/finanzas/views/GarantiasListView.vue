<template>
  <div class="space-y-5">
    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div class="w-full sm:max-w-sm">
              <AppInput
                v-model="buscar"
                type="search"
                placeholder="Buscar por cliente, DNI o comentario..."
              />
            </div>
            <div class="w-full sm:w-56">
              <AppSelect v-model="filtroEstado" :options="filtroEstadoOptions" />
            </div>
            <div class="w-full sm:w-56">
              <AppDateRangePicker v-model="rango" placeholder="Rango de fechas" />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="canExportar"
              type="button"
              class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              @click="exportarModalOpen = true"
            >
              <AppIcon :name="ICONS.download" :size="16" />
              Exportar
            </button>
            <button
              v-if="canCrear"
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              @click="openCrear"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nueva garantía
            </button>
          </div>
        </div>
      </template>

      <template #cell-fecha="{ row }">{{ formatListDate(row.fecha) }}</template>

      <template #cell-cliente="{ row }">
        <div class="min-w-0">
          <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ row.cliente }}</p>
          <p class="text-theme-xs text-gray-400 dark:text-gray-500">{{ row.documento_cliente || '—' }}</p>
        </div>
      </template>

      <template #cell-medio="{ row }">{{ row.medio_pago || '—' }}</template>

      <template #cell-importe="{ row }">
        <span class="font-semibold text-gray-800 dark:text-white/90">{{ formatCurrency(row.importe) }}</span>
      </template>

      <template #cell-estado="{ row }">
        <AppBadge :color="row.fecha_reembolso ? 'success' : 'warning'" size="sm">
          {{ row.fecha_reembolso ? 'DEVUELTA' : 'ACTIVA' }}
        </AppBadge>
        <p v-if="row.fecha_reembolso" class="mt-0.5 text-theme-xs text-gray-400 dark:text-gray-500">
          {{ formatListDate(row.fecha_reembolso) }}
        </p>
      </template>

      <template #cell-observacion="{ row }">
        <span class="line-clamp-2 text-theme-sm text-gray-500 dark:text-gray-400">
          {{ row.observacion || '—' }}
        </span>
      </template>

      <template #actions="{ row }">
        <button
          type="button"
          title="Ver detalle"
          class="inline-flex items-center rounded-lg px-2 py-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetalle(row)"
        >
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>
        <button
          v-if="canReembolsar && !row.fecha_reembolso"
          type="button"
          title="Registrar reembolso"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
          @click="openReembolsar(row)"
        >
          <AppIcon :name="ICONS.banknote" :size="16" />
        </button>
        <button
          v-if="canReembolsar && row.fecha_reembolso"
          type="button"
          title="Anular reembolso"
          class="inline-flex items-center rounded-lg px-2 py-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openAnularReembolso(row)"
        >
          <AppIcon :name="ICONS.refreshCw" :size="16" />
        </button>
        <button
          v-if="canEditar && !row.fecha_reembolso"
          type="button"
          title="Editar"
          class="inline-flex items-center rounded-lg px-2 py-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
          @click="openEditar(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
        </button>
        <button
          v-if="canEliminar"
          type="button"
          title="Eliminar"
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

    <GarantiaFormModal v-if="canCrear || canEditar" v-model="formModalOpen" :garantia="garantiaEditando" @saved="onGuardada" />

    <ReembolsarGarantiaModal
      v-if="canReembolsar"
      v-model="reembolsarModalOpen"
      :garantia="garantiaAReembolsar"
    />

    <AppModal v-model="detalleOpen" title="Detalle de la garantía" size="lg">
      <div v-if="garantiaDetalle" class="space-y-4">
        <!-- Badge de estado -->
        <div class="flex flex-wrap items-center gap-2">
          <AppBadge :color="garantiaDetalle.fecha_reembolso ? 'success' : 'warning'" size="sm">
            {{ garantiaDetalle.fecha_reembolso ? 'DEVUELTA' : 'ACTIVA' }}
          </AppBadge>
        </div>

        <!-- Recepción -->
        <div class="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <h4 class="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Recepción</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500">Fecha</p>
              <p class="text-sm text-gray-800 dark:text-white/90">{{ formatListDate(garantiaDetalle.fecha) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500">Importe</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
                {{ formatCurrency(garantiaDetalle.importe) }}
              </p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-gray-400 dark:text-gray-500">Cliente</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ garantiaDetalle.cliente }}</p>
              <p class="text-theme-xs text-gray-400 dark:text-gray-500">{{ garantiaDetalle.documento_cliente || '—' }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-gray-400 dark:text-gray-500">Método de pago recibido</p>
              <p class="text-sm text-gray-700 dark:text-gray-300">{{ garantiaDetalle.medio_pago || '—' }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-gray-400 dark:text-gray-500">Observaciones</p>
              <p class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {{ garantiaDetalle.observacion || 'Sin observaciones.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Reembolso (solo si existe) -->
        <div
          v-if="garantiaDetalle.fecha_reembolso"
          class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10"
        >
          <h4 class="mb-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Reembolso registrado
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs text-emerald-600 dark:text-emerald-300">Fecha del reembolso</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ formatListDate(garantiaDetalle.fecha_reembolso) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-emerald-600 dark:text-emerald-300">Método usado</p>
              <p class="text-sm text-gray-800 dark:text-white/90">
                {{ garantiaDetalle.medio_reembolso || '—' }}
              </p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-emerald-600 dark:text-emerald-300">Observaciones del reembolso</p>
              <p class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {{ garantiaDetalle.observacion_reembolso || 'Sin observaciones.' }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-else
          class="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-3 text-center dark:border-amber-500/30 dark:bg-amber-500/10"
        >
          <p class="text-theme-sm text-amber-700 dark:text-amber-300">
            Garantía activa · aún no se ha registrado el reembolso.
          </p>
        </div>
      </div>
    </AppModal>

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
        <strong v-if="garantiaAEliminar">{{ garantiaAEliminar.cliente }}</strong>
        por <strong v-if="garantiaAEliminar">{{ formatCurrency(garantiaAEliminar.importe) }}</strong>?
        Se hace una baja lógica reversible.
      </span>
    </AppConfirmDialog>

    <AppConfirmDialog
      v-if="canReembolsar"
      v-model="anularReembolsoOpen"
      title="Anular reembolso"
      variant="warning"
      confirm-label="Sí, anular reembolso"
      loading-label="Anulando..."
      :loading="anularReembolsoMutation.isPending.value"
      @confirm="confirmarAnularReembolso"
    >
      <span>
        La garantía volverá a estado <strong>ACTIVA</strong> y se limpiarán los datos del reembolso
        (fecha, método y observaciones). Podrás registrar un nuevo reembolso después.
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
  AppDateRangePicker,
  AppInput,
  AppModal,
  AppPagination,
  AppSelect,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import GarantiaFormModal from '@/modules/finanzas/components/GarantiaFormModal.vue'
import ReembolsarGarantiaModal from '@/modules/finanzas/components/ReembolsarGarantiaModal.vue'
import AppExportarExcelModal from '@/modules/finanzas/components/AppExportarExcelModal.vue'
import { useGarantiasQuery } from '@/modules/finanzas/composables/useGarantiasQuery'
import {
  useAnularReembolsoGarantiaMutation,
  useEliminarGarantiaMutation,
} from '@/modules/finanzas/composables/useGarantiaMutations'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type {
  EstadoGarantia,
  Garantia,
  GarantiaListFilters,
} from '@/modules/finanzas/interfaces/garantia.interface'
import type { RangoFechas, SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatCurrency } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'
import { exportarGarantiasExcel } from '@/modules/finanzas/utils/exportarExcel'

const authStore = useAuthStore()

const canCrear = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_CREAR))
const canEditar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_EDITAR))
const canEliminar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_ELIMINAR))
const canReembolsar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_REEMBOLSAR))
const canExportar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_EXPORTAR))

const buscar = ref('')
const rango = ref<RangoFechas>({ start: '', end: '' })
const filtroEstado = ref<'' | EstadoGarantia>('')
const pagina = ref(1)
const limite = ref(10)

const filtroEstadoOptions: SelectOption[] = [
  { label: 'Todas', value: '' },
  { label: 'Activas', value: 'ACTIVA' },
  { label: 'Devueltas', value: 'DEVUELTA' },
]

const filters = ref<GarantiaListFilters>({ buscar: '', pagina: 1, limite: 10 })

const garantiasQuery = useGarantiasQuery(filters)
const rows = computed(() => garantiasQuery.data.value?.data ?? [])
const isLoading = computed(() => garantiasQuery.isFetching.value)

const columns: TableColumn<Garantia>[] = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'medio', label: 'Método de pago' },
  { key: 'importe', label: 'Importe', align: 'right' },
  { key: 'estado', label: 'Estado', align: 'center' },
  { key: 'observacion', label: 'Observaciones' },
]

let buscarTimeout: ReturnType<typeof setTimeout> | undefined
watch(buscar, (v) => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    filters.value = { ...filters.value, buscar: v.trim(), pagina: 1 }
  }, 300)
})

watch(rango, (r) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    desde: r.start || undefined,
    hasta: r.end || undefined,
    pagina: 1,
  }
}, { deep: true })

watch(filtroEstado, (v) => {
  pagina.value = 1
  filters.value = { ...filters.value, estado: v || undefined, pagina: 1 }
})

watch([pagina, limite], () => {
  filters.value = { ...filters.value, pagina: pagina.value, limite: limite.value }
})

/* Modal form */
const formModalOpen = ref(false)
const garantiaEditando = ref<Garantia | null>(null)
const openCrear = () => { garantiaEditando.value = null; formModalOpen.value = true }
const openEditar = (g: Garantia) => { garantiaEditando.value = g; formModalOpen.value = true }
const onGuardada = () => { garantiaEditando.value = null }

/* Detalle */
const detalleOpen = ref(false)
const garantiaDetalle = ref<Garantia | null>(null)
const openDetalle = (g: Garantia) => { garantiaDetalle.value = g; detalleOpen.value = true }

/* Reembolsar */
const reembolsarModalOpen = ref(false)
const garantiaAReembolsar = ref<Garantia | null>(null)
const openReembolsar = (g: Garantia) => { garantiaAReembolsar.value = g; reembolsarModalOpen.value = true }

const anularReembolsoOpen = ref(false)
const garantiaAAnularReembolso = ref<Garantia | null>(null)
const anularReembolsoMutation = useAnularReembolsoGarantiaMutation()

const openAnularReembolso = (g: Garantia) => {
  garantiaAAnularReembolso.value = g
  anularReembolsoOpen.value = true
}

const confirmarAnularReembolso = async () => {
  const g = garantiaAAnularReembolso.value
  if (!g) return
  try {
    await anularReembolsoMutation.mutateAsync({
      id: g.id,
      idUsuarioAuditoria: authStore.user?.id ?? undefined,
    })
  } catch {
    /* toast en la mutación */
  } finally {
    anularReembolsoOpen.value = false
    garantiaAAnularReembolso.value = null
  }
}

/* Eliminar */
const eliminarOpen = ref(false)
const garantiaAEliminar = ref<Garantia | null>(null)
const eliminarMutation = useEliminarGarantiaMutation()

const openEliminar = (g: Garantia) => { garantiaAEliminar.value = g; eliminarOpen.value = true }

const confirmarEliminar = async () => {
  const g = garantiaAEliminar.value
  if (!g) return
  try {
    await eliminarMutation.mutateAsync({ id: g.id, idUsuarioAuditoria: authStore.user?.id ?? undefined })
  } catch {
    /* Toast lo maneja la mutación */
  } finally {
    eliminarOpen.value = false
    garantiaAEliminar.value = null
  }
}

/* Exportar */
const exportarModalOpen = ref(false)
const exportarGarantias = async (r: { desde?: string; hasta?: string }) => {
  await exportarGarantiasExcel(r)
}
</script>

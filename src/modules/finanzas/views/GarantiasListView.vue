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
                placeholder="Buscar por cliente, préstamo, alquiler..."
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
          title="Ver detalle"
          class="inline-flex items-center rounded-lg px-2 py-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetalle(row)"
        >
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>
        <button
          v-if="canReembolsar && Number(row.monto_saldo) > 0"
          type="button"
          title="Devolver garantía"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
          @click="openReembolsar(row)"
        >
          <AppIcon :name="ICONS.banknote" :size="16" />
        </button>
        <button
          v-if="canEditar && row.puede_editar"
          type="button"
          title="Editar garantía manual"
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

    <AppModal v-model="detalleOpen" title="Detalle de la garantía" size="lg">
      <div v-if="detalleLoading" class="py-8 text-center text-sm text-gray-500">Cargando...</div>
      <div v-else-if="garantiaDetalle" class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <AppBadge :color="estadoColor(garantiaDetalle.nombre_estado)" size="sm">
            {{ garantiaDetalle.nombre_estado || '—' }}
          </AppBadge>
          <AppBadge :color="origenColor(resolveOrigen(garantiaDetalle))" size="sm">
            {{ origenLabel(resolveOrigen(garantiaDetalle)) }}
          </AppBadge>
        </div>

        <div class="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <h4 class="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Cobro</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500">Fecha</p>
              <p class="text-sm text-gray-800 dark:text-white/90">
                {{ formatListDate(garantiaDetalle.fecha_registro) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500">Montos</p>
              <p class="text-sm text-gray-800 dark:text-white/90">
                Cobrado {{ formatCurrency(garantiaDetalle.monto_cobrado) }} · Saldo
                {{ formatCurrency(garantiaDetalle.monto_saldo) }}
              </p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-gray-400 dark:text-gray-500">Cliente</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ garantiaDetalle.nombre_cliente || '—' }}
              </p>
              <p class="text-theme-xs text-gray-400 dark:text-gray-500">
                {{ garantiaDetalle.documento_cliente || '—' }}
              </p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-gray-400 dark:text-gray-500">Origen / vínculo</p>
              <p class="text-sm text-gray-700 dark:text-gray-300">{{ origenDetalle(garantiaDetalle) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 dark:text-gray-500">Método de pago</p>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {{ garantiaDetalle.medio_pago || '—' }}
              </p>
            </div>
            <div v-if="garantiaDetalle.fecha_reembolso || garantiaDetalle.medio_reembolso">
              <p class="text-xs text-gray-400 dark:text-gray-500">Reembolso</p>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {{
                  [
                    garantiaDetalle.fecha_reembolso
                      ? formatListDate(garantiaDetalle.fecha_reembolso)
                      : null,
                    garantiaDetalle.medio_reembolso,
                  ]
                    .filter(Boolean)
                    .join(' · ') || '—'
                }}
              </p>
            </div>
            <div v-if="garantiaDetalle.nombre_producto" class="col-span-2">
              <p class="text-xs text-gray-400 dark:text-gray-500">Producto</p>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {{ garantiaDetalle.nombre_producto }}
              </p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-gray-400 dark:text-gray-500">Observaciones</p>
              <p class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {{ garantiaDetalle.observacion || 'Sin observaciones.' }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <h4 class="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Movimientos</h4>
          <div v-if="!(garantiaDetalle.movimientos?.length)" class="text-sm text-gray-500">
            Sin movimientos.
          </div>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <li
              v-for="m in garantiaDetalle.movimientos"
              :key="m.id"
              class="flex items-start justify-between gap-3 py-2 text-sm"
            >
              <div class="min-w-0">
                <p class="font-medium text-gray-800 dark:text-white/90">
                  {{ m.nombre_tipo_movimiento || 'Movimiento' }}
                </p>
                <p class="text-theme-xs text-gray-400">
                  {{ formatListDate(m.fecha) }}
                  <span v-if="m.comprobante"> · {{ m.comprobante }}</span>
                </p>
                <p v-if="m.observacion" class="mt-0.5 text-theme-xs text-gray-500">
                  {{ m.observacion }}
                </p>
              </div>
              <p class="shrink-0 font-semibold text-gray-800 dark:text-white/90">
                {{ formatCurrency(m.monto) }}
              </p>
            </li>
          </ul>
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
import { useEliminarGarantiaMutation } from '@/modules/finanzas/composables/useGarantiaMutations'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type {
  EstadoGarantia,
  Garantia,
  GarantiaListFilters,
  OrigenGarantia,
} from '@/modules/finanzas/interfaces/garantia.interface'
import type { RangoFechas, SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatCurrency } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'
import { exportarGarantiasExcel } from '@/modules/finanzas/utils/exportarExcel'
import { toastApiError } from '@/shared/composables/useToast'

const authStore = useAuthStore()

const canCrear = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_CREAR))
const canEditar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_EDITAR))
const canEliminar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_ELIMINAR))
const canReembolsar = computed(() =>
  authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_REEMBOLSAR),
)
const canExportar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_EXPORTAR))

const buscar = ref('')
const rango = ref<RangoFechas>({ start: '', end: '' })
const filtroEstado = ref<'' | EstadoGarantia>('')
const pagina = ref(1)
const limite = ref(10)

const filtroEstadoOptions: SelectOption[] = [
  { label: 'Todas', value: '' },
  { label: 'Activas', value: 'ACTIVA' },
  { label: 'Parciales', value: 'PARCIAL' },
  { label: 'Devueltas', value: 'DEVUELTA' },
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

let buscarTimeout: ReturnType<typeof setTimeout> | undefined
watch(buscar, (v) => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    filters.value = { ...filters.value, buscar: v.trim(), pagina: 1 }
  }, 300)
})

watch(
  rango,
  (r) => {
    pagina.value = 1
    filters.value = {
      ...filters.value,
      desde: r.start || undefined,
      hasta: r.end || undefined,
      pagina: 1,
    }
  },
  { deep: true },
)

watch(filtroEstado, (v) => {
  pagina.value = 1
  filters.value = { ...filters.value, estado: v || undefined, pagina: 1 }
})

watch([pagina, limite], () => {
  filters.value = { ...filters.value, pagina: pagina.value, limite: limite.value }
})

function resolveOrigen(g: Garantia): OrigenGarantia {
  if (g.origen) return g.origen
  if (g.id_prestamo) return 'PRESTAMO'
  if (g.id_alquiler) return 'ALQUILER'
  if (g.comprobante_cobro || g.movimientos?.some((m) => m.id_comprobante)) return 'POS'
  return 'MANUAL'
}

function origenLabel(origen?: OrigenGarantia | null) {
  switch (origen) {
    case 'PRESTAMO':
      return 'Préstamo'
    case 'ALQUILER':
      return 'Alquiler'
    case 'POS':
      return 'POS'
    case 'MANUAL':
      return 'Manual'
    default:
      return '—'
  }
}

function origenColor(origen?: OrigenGarantia | null): 'primary' | 'success' | 'warning' | 'neutral' {
  switch (origen) {
    case 'PRESTAMO':
      return 'primary'
    case 'ALQUILER':
      return 'success'
    case 'POS':
      return 'warning'
    default:
      return 'neutral'
  }
}

function origenDetalle(g: Garantia) {
  if (g.numero_prestamo) return `Préstamo ${g.numero_prestamo}`
  if (g.numero_alquiler) return `Alquiler ${g.numero_alquiler}`
  if (g.comprobante_cobro) return `Comprobante ${g.comprobante_cobro}`
  if (g.nombre_producto) return g.nombre_producto
  return 'Sin vínculo operativo'
}

function estadoColor(estado?: string | null): 'success' | 'warning' | 'primary' | 'neutral' {
  switch (estado) {
    case 'DEVUELTA':
      return 'success'
    case 'PARCIAL':
      return 'primary'
    case 'ACTIVA':
      return 'warning'
    default:
      return 'neutral'
  }
}

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
const detalleLoading = ref(false)
const garantiaDetalle = ref<Garantia | null>(null)

const openDetalle = async (g: Garantia) => {
  detalleOpen.value = true
  detalleLoading.value = true
  garantiaDetalle.value = g
  try {
    garantiaDetalle.value = await finanzasService.obtenerGarantia(g.id)
  } catch (error) {
    toastApiError(error, 'No se pudo cargar el detalle')
  } finally {
    detalleLoading.value = false
  }
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

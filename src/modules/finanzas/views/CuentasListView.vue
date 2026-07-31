<template>
  <div class="space-y-5">
    <!-- Resumen -->
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="text-xs text-gray-500 dark:text-gray-400">Total pendiente</p>
        <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          {{ formatCurrency(resumen?.totalPendiente) }}
        </p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="text-xs text-gray-500 dark:text-gray-400">Cuentas pendientes</p>
        <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          {{ formatNumber(resumen?.cantidadCuentas) }}
        </p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="text-xs text-gray-500 dark:text-gray-400">Total vencido</p>
        <p class="mt-1 text-lg font-semibold text-rose-600 dark:text-rose-400">
          {{ formatCurrency(resumen?.totalVencido) }}
        </p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ terceroLabelPlural }}</p>
        <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          {{ formatNumber(resumen?.cantidadTerceros) }}
        </p>
      </div>
    </div>

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div class="w-full sm:max-w-sm">
              <AppInput
                v-model="buscar"
                type="search"
                :placeholder="`Buscar por ${terceroLabel.toLowerCase()}, documento o comprobante...`"
              />
            </div>
            <div class="w-full sm:w-64">
              <AppSelect v-model="filtroEstado" :options="filtroEstadoOptions" />
            </div>
          </div>

          <button
            v-if="canCrear"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="crearModalOpen = true"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            {{ ctaCrearLabel }}
          </button>
        </div>
      </template>

      <template #cell-tercero="{ row }">
        <div class="min-w-0">
          <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ row.tercero }}</p>
          <p class="text-theme-xs text-gray-400 dark:text-gray-500">{{ row.documento_tercero || '—' }}</p>
        </div>
      </template>

      <template #cell-vencimiento="{ row }">
        <div class="flex flex-col">
          <span class="text-gray-600 dark:text-gray-300">{{ formatListDate(row.fecha_vencimiento) }}</span>
          <span v-if="row.dias_vencido > 0" class="text-theme-xs font-medium text-rose-500">
            {{ row.dias_vencido }} d. vencido
          </span>
        </div>
      </template>

      <template #cell-saldo="{ row }">
        <span class="font-semibold text-rose-600 dark:text-rose-400">{{ formatCurrency(row.saldo) }}</span>
      </template>

      <template #cell-estado="{ row }">
        <AppBadge :color="estadoColor(row.estado_calculado)" size="sm">
          {{ row.estado_calculado }}
        </AppBadge>
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
          v-if="canRegistrarPago && row.saldo > 0"
          type="button"
          :title="ctaPagoLabel"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click="openPago(row)"
        >
          <AppIcon :name="ICONS.banknote" :size="16" />
        </button>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="cuentasQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <RegistrarPagoModal v-model="pagoModalOpen" :cuenta="cuentaSeleccionada" :tipo="tipo" />
    <CuentaDetalleModal
      v-model="detalleModalOpen"
      :cuenta-id="cuentaDetalleId"
      :tipo="tipo"
      :can-anular="canRegistrarPago"
    />
    <CrearCuentaModal v-if="canCrear" v-model="crearModalOpen" :tipo="tipo" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AppBadge, AppInput, AppPagination, AppSelect, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import RegistrarPagoModal from '@/modules/finanzas/components/RegistrarPagoModal.vue'
import CuentaDetalleModal from '@/modules/finanzas/components/CuentaDetalleModal.vue'
import CrearCuentaModal from '@/modules/finanzas/components/CrearCuentaModal.vue'
import { useCuentasQuery } from '@/modules/finanzas/composables/useCuentasQuery'
import { useResumenCuentasQuery } from '@/modules/finanzas/composables/useResumenCuentasQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type {
  CuentaFinanciera,
  CuentaListFilters,
  EstadoCuenta,
  TipoCuenta,
} from '@/modules/finanzas/interfaces/cuenta.interface'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatCurrency, formatNumber } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const props = defineProps<{ tipo: TipoCuenta }>()

const authStore = useAuthStore()

const esCobrar = computed(() => props.tipo === 'COBRAR')
const terceroLabel = computed(() => (esCobrar.value ? 'Cliente' : 'Proveedor'))
const terceroLabelPlural = computed(() => (esCobrar.value ? 'Clientes' : 'Proveedores'))
const ctaPagoLabel = computed(() => (esCobrar.value ? 'Registrar cobranza' : 'Registrar pago'))

const canRegistrarPago = computed(() =>
  authStore.hasPermission(
    esCobrar.value
      ? PermisoBanderas.FINANZAS_CXC_REGISTRAR_PAGO
      : PermisoBanderas.FINANZAS_CXP_REGISTRAR_PAGO,
  ),
)

const canCrear = computed(() =>
  authStore.hasPermission(
    esCobrar.value ? PermisoBanderas.FINANZAS_CXC_CREAR : PermisoBanderas.FINANZAS_CXP_CREAR,
  ),
)

const ctaCrearLabel = computed(() =>
  esCobrar.value ? 'Nueva cuenta por cobrar' : 'Nueva cuenta por pagar',
)

const buscar = ref('')
const filtroEstado = ref<'saldo' | 'todos' | 'VENCIDO' | 'PAGADO'>('saldo')
const pagina = ref(1)
const limite = ref(10)

const filtroEstadoOptions: SelectOption[] = [
  { label: 'Con saldo pendiente', value: 'saldo' },
  { label: 'Vencidos', value: 'VENCIDO' },
  { label: 'Pagados', value: 'PAGADO' },
  { label: 'Todos', value: 'todos' },
]

const buildEstadoFilter = (): Pick<CuentaListFilters, 'estado' | 'soloPendientes'> => {
  switch (filtroEstado.value) {
    case 'saldo':
      return { soloPendientes: 1 }
    case 'VENCIDO':
      return { estado: 'VENCIDO' }
    case 'PAGADO':
      return { estado: 'PAGADO' }
    default:
      return {}
  }
}

const filters = ref<CuentaListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  soloPendientes: 1,
})

const cuentasQuery = useCuentasQuery(props.tipo, filters)
const resumenQuery = useResumenCuentasQuery(props.tipo)

const rows = computed(() => cuentasQuery.data.value?.data ?? [])
const resumen = computed(() => resumenQuery.data.value ?? null)
const isLoading = computed(() => cuentasQuery.isFetching.value)

const columns: TableColumn<CuentaFinanciera>[] = [
  { key: 'tercero', label: 'Tercero' },
  { key: 'comprobante', label: 'Comprobante' },
  { key: 'vencimiento', label: 'Vencimiento' },
  {
    key: 'monto_pendiente',
    label: 'Monto',
    align: 'right',
    formatter: (value) => formatCurrency(Number(value)),
  },
  { key: 'saldo', label: 'Saldo', align: 'right' },
  { key: 'estado', label: 'Estado', align: 'center' },
]

const estadoColor = (estado: EstadoCuenta): BadgeColor => {
  switch (estado) {
    case 'PAGADO':
      return 'success'
    case 'VENCIDO':
      return 'error'
    case 'PARCIAL':
      return 'warning'
    default:
      return 'neutral'
  }
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

watch(buscar, (value) => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    filters.value = { ...filters.value, buscar: value.trim(), pagina: 1 }
  }, 350)
})

watch(filtroEstado, () => {
  pagina.value = 1
  filters.value = {
    buscar: filters.value.buscar,
    pagina: 1,
    limite: limite.value,
    estado: undefined,
    soloPendientes: undefined,
    ...buildEstadoFilter(),
  }
})

watch([pagina, limite], () => {
  filters.value = { ...filters.value, pagina: pagina.value, limite: limite.value }
})

/* Modales */
const pagoModalOpen = ref(false)
const cuentaSeleccionada = ref<CuentaFinanciera | null>(null)

const detalleModalOpen = ref(false)
const cuentaDetalleId = ref<number | null>(null)

const crearModalOpen = ref(false)

const openPago = (cuenta: CuentaFinanciera) => {
  cuentaSeleccionada.value = cuenta
  pagoModalOpen.value = true
}

const openDetalle = (cuenta: CuentaFinanciera) => {
  cuentaDetalleId.value = cuenta.id
  detalleModalOpen.value = true
}
</script>

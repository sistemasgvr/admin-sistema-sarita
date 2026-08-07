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
        <p class="text-xs text-gray-500 dark:text-gray-400">Documentos pendientes</p>
        <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          {{ formatNumber(resumen?.cantidadCuentas) }}
        </p>
        <p class="mt-0.5 text-theme-xs text-gray-400 dark:text-gray-500">
          Incluye cuentas simples y cuotas
        </p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="text-xs text-gray-500 dark:text-gray-400">Total vencido</p>
        <p class="mt-1 text-lg font-semibold text-rose-600 dark:text-rose-400">
          {{ formatCurrency(resumen?.totalVencido) }}
        </p>
      </div>
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ terceroLabelPlural }} con saldo</p>
        <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          {{ formatNumber(resumen?.cantidadTerceros) }}
        </p>
        <p class="mt-0.5 text-theme-xs text-gray-400 dark:text-gray-500">
          Solo con deuda pendiente
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
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="crearModalOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              {{ ctaCrearLabel }}
            </button>
          </div>
        </div>
      </template>

      <template #cell-tercero="{ row }">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ row.tercero }}</p>
            <AppBadge v-if="row.es_plan" color="dark" size="sm">
              {{ row.numero_cuotas_total }}
              {{ (row.numero_cuotas_total ?? 0) === 1 ? 'cuota' : 'cuotas' }}
            </AppBadge>
          </div>
          <p class="text-theme-xs text-gray-400 dark:text-gray-500">
            {{ row.documento_tercero || row.descripcion || '—' }}
          </p>
        </div>
      </template>

      <template #cell-vencimiento="{ row }">
        <div v-if="row.es_plan" class="text-theme-xs text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.layers" :size="14" class="mr-1 inline align-middle" />
          Plan de cuotas
        </div>
        <div v-else class="flex flex-col">
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
          :title="row.es_plan ? 'Ver cuotas y pagar' : 'Ver detalle'"
          class="inline-flex items-center rounded-lg px-2 py-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetalle(row)"
        >
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>
        <button
          v-if="canRegistrarPago && !row.es_plan && row.saldo > 0"
          type="button"
          :title="ctaPagoLabel"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click="openPago(row)"
        >
          <AppIcon :name="ICONS.banknote" :size="16" />
        </button>
        <button
          v-if="canEditar"
          type="button"
          title="Editar cuenta"
          class="inline-flex items-center rounded-lg px-2 py-1.5 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
          @click="openEditar(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
        </button>
        <button
          v-if="canEliminar"
          type="button"
          title="Eliminar cuenta"
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
      :can-registrar-pago="canRegistrarPago"
      @pagar-cuota="onPagarCuota"
    />
    <CrearCuentaModal v-if="canCrear" v-model="crearModalOpen" :tipo="tipo" />

    <AppExportarExcelModal
      v-if="canExportar"
      v-model="exportarModalOpen"
      :title="`Exportar ${terceroLabelPlural.toLowerCase()} — ${tipo === 'COBRAR' ? 'Por Cobrar' : 'Por Pagar'}`"
      :on-exportar="exportarCuentas"
    />

    <EditarCuentaModal
      v-if="canEditar"
      v-model="editarModalOpen"
      :cuenta="cuentaEditando"
      :tipo="tipo"
      :tiene-pagos="(cuentaEditando?.monto_abonado ?? 0) > 0"
      @saved="onCuentaEditada"
    />

    <AppConfirmDialog
      v-if="canEliminar"
      v-model="eliminarModalOpen"
      title="Eliminar cuenta"
      variant="danger"
      confirm-label="Sí, eliminar"
      loading-label="Eliminando..."
      :loading="eliminarMutation.isPending.value"
      @confirm="confirmarEliminar"
    >
      <span>
        ¿Confirmas eliminar esta cuenta? Esta acción es una <strong>baja lógica</strong>
        y se puede revertir manualmente en la BD. No se permite eliminar cuentas con pagos aplicados.
      </span>
    </AppConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  AppBadge,
  AppConfirmDialog,
  AppInput,
  AppPagination,
  AppSelect,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import RegistrarPagoModal from '@/modules/finanzas/components/RegistrarPagoModal.vue'
import CuentaDetalleModal from '@/modules/finanzas/components/CuentaDetalleModal.vue'
import CrearCuentaModal from '@/modules/finanzas/components/CrearCuentaModal.vue'
import EditarCuentaModal from '@/modules/finanzas/components/EditarCuentaModal.vue'
import AppExportarExcelModal from '@/modules/finanzas/components/AppExportarExcelModal.vue'
import { exportarCuentasExcel } from '@/modules/finanzas/utils/exportarExcel'
import { useCuentasQuery } from '@/modules/finanzas/composables/useCuentasQuery'
import { useResumenCuentasQuery } from '@/modules/finanzas/composables/useResumenCuentasQuery'
import { useEliminarCuentaMutation } from '@/modules/finanzas/composables/usePagoMutations'
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

const canEditar = computed(() =>
  authStore.hasPermission(
    esCobrar.value ? PermisoBanderas.FINANZAS_CXC_EDITAR : PermisoBanderas.FINANZAS_CXP_EDITAR,
  ),
)

const canEliminar = computed(() =>
  authStore.hasPermission(
    esCobrar.value ? PermisoBanderas.FINANZAS_CXC_ELIMINAR : PermisoBanderas.FINANZAS_CXP_ELIMINAR,
  ),
)

const canExportar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_EXPORTAR))

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

/* Exportar Excel */
const exportarModalOpen = ref(false)
const exportarCuentas = async (rango: { desde?: string; hasta?: string }) => {
  await exportarCuentasExcel(props.tipo, rango)
}

const editarModalOpen = ref(false)
const cuentaEditando = ref<CuentaFinanciera | null>(null)

const eliminarModalOpen = ref(false)
const cuentaAEliminar = ref<CuentaFinanciera | null>(null)
const eliminarMutation = useEliminarCuentaMutation(props.tipo)

const openPago = (cuenta: CuentaFinanciera) => {
  cuentaSeleccionada.value = cuenta
  pagoModalOpen.value = true
}

const openDetalle = (cuenta: CuentaFinanciera) => {
  cuentaDetalleId.value = cuenta.id
  detalleModalOpen.value = true
}

/** Recibe una cuota "proyectada" como CuentaFinanciera desde el detalle
 *  y abre el modal de pago encima. El modal de detalle queda abierto para
 *  ver el resultado tras cerrar el de pago. */
const onPagarCuota = (cuota: CuentaFinanciera) => {
  cuentaSeleccionada.value = cuota
  pagoModalOpen.value = true
}

const openEditar = (cuenta: CuentaFinanciera) => {
  cuentaEditando.value = cuenta
  editarModalOpen.value = true
}

const onCuentaEditada = () => {
  editarModalOpen.value = false
  cuentaEditando.value = null
}

const openEliminar = (cuenta: CuentaFinanciera) => {
  cuentaAEliminar.value = cuenta
  eliminarModalOpen.value = true
}

const confirmarEliminar = async () => {
  const c = cuentaAEliminar.value
  if (!c) return
  try {
    await eliminarMutation.mutateAsync({
      id: c.id,
      idUsuarioAuditoria: authStore.user?.id ?? undefined,
    })
  } catch {
    // El toast con el mensaje del backend lo dispara la mutación.
  } finally {
    // Cerramos siempre para que el toast (éxito o error, ej. "tiene pagos aplicados")
    // quede totalmente visible. El usuario puede reintentar si aplica.
    eliminarModalOpen.value = false
    cuentaAEliminar.value = null
  }
}
</script>

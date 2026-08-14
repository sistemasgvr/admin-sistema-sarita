<template>
  <AppModal v-model="open" title="Detalle de la cuenta" size="xl">
    <div v-if="query.isLoading.value" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando detalle...
    </div>

    <div v-else-if="cuenta" class="space-y-5">
      <!-- Cabecera con badges de tipo/plan -->
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge :color="cuenta.tipo === 'COBRAR' ? 'primary' : 'warning'" size="sm">
          {{ cuenta.tipo === 'COBRAR' ? 'Por cobrar' : 'Por pagar' }}
        </AppBadge>
        <AppBadge v-if="esPlan" color="dark" size="sm">
          Plan de {{ cuenta.numero_cuotas_total }}
          {{ (cuenta.numero_cuotas_total ?? 0) === 1 ? 'cuota' : 'cuotas' }}
        </AppBadge>
        <AppBadge v-else-if="esCuotaHija" color="neutral" size="sm">
          Cuota #{{ cuenta.numero_cuota }}
        </AppBadge>
        <AppBadge :color="estadoColor(cuenta.estado_calculado)" size="sm">
          {{ cuenta.estado_calculado }}
        </AppBadge>
      </div>

      <!-- Datos generales -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div class="col-span-2 sm:col-span-1">
          <p class="text-xs text-gray-400 dark:text-gray-500">{{ terceroLabel }}</p>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ cuenta.tercero }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">{{ cuenta.documento_tercero || '—' }}</p>
        </div>
        <div v-if="cuenta.descripcion">
          <p class="text-xs text-gray-400 dark:text-gray-500">Descripción</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ cuenta.descripcion }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Comprobante</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ cuenta.comprobante || '—' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Emisión</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatListDate(cuenta.fecha_emision) }}</p>
        </div>
        <div v-if="!esPlan">
          <p class="text-xs text-gray-400 dark:text-gray-500">Vencimiento</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatListDate(cuenta.fecha_vencimiento) }}</p>
        </div>
      </div>

      <!-- Datos del plan (solo cabecera) -->
      <div
        v-if="esPlan && (cuenta.banco || cuenta.tasa_interes != null)"
        class="grid grid-cols-2 gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3 dark:border-brand-500/20 dark:bg-brand-500/10 sm:grid-cols-3"
      >
        <div v-if="cuenta.banco">
          <p class="text-xs text-brand-600 dark:text-brand-300">Banco</p>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ cuenta.banco }}</p>
        </div>
        <div v-if="cuenta.tasa_interes != null">
          <p class="text-xs text-brand-600 dark:text-brand-300">Tasa de interés</p>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">
            {{ Number(cuenta.tasa_interes).toFixed(2) }}%
          </p>
        </div>
        <div>
          <p class="text-xs text-brand-600 dark:text-brand-300">Número de cuotas</p>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">
            {{ cuenta.numero_cuotas_total }}
          </p>
        </div>
      </div>

      <!-- Montos -->
      <div class="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            {{ esPlan ? 'Monto total del plan' : 'Monto original' }}
          </p>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">
            {{ formatCurrency(cuenta.monto_pendiente) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Abonado</p>
          <p class="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {{ formatCurrency(cuenta.monto_abonado) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Saldo</p>
          <p class="text-sm font-semibold text-rose-600 dark:text-rose-400">
            {{ formatCurrency(cuenta.saldo) }}
          </p>
        </div>
      </div>

      <!-- Cuotas del plan (solo cabecera) -->
      <div v-if="esPlan">
        <div class="mb-2 flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">
            Cuotas del plan
          </h4>
          <p class="text-theme-xs text-gray-400 dark:text-gray-500">
            {{ cuotasPagadas }}/{{ cuenta.cuotas.length }} pagadas
          </p>
        </div>

        <div class="rounded-xl border border-gray-200 dark:border-gray-800">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 text-theme-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
                <th class="px-3 py-2 text-left font-medium">#</th>
                <th class="px-3 py-2 text-left font-medium">Vencimiento</th>
                <th class="px-3 py-2 text-right font-medium">Monto</th>
                <th class="px-3 py-2 text-right font-medium">Abonado</th>
                <th class="px-3 py-2 text-right font-medium">Saldo</th>
                <th class="px-3 py-2 text-center font-medium">Estado</th>
                <th v-if="canRegistrarPago" class="px-3 py-2 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="cuota in cuenta.cuotas" :key="cuota.id">
                <td class="px-3 py-2 font-medium text-gray-700 dark:text-gray-200">
                  {{ cuota.numeroCuota }}
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {{ formatListDate(cuota.fechaVencimiento) }}
                </td>
                <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-200">
                  {{ formatCurrency(cuota.montoPendiente) }}
                </td>
                <td class="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">
                  {{ formatCurrency(cuota.montoAbonado) }}
                </td>
                <td class="px-3 py-2 text-right font-semibold text-rose-600 dark:text-rose-400">
                  {{ formatCurrency(cuota.saldo) }}
                </td>
                <td class="px-3 py-2 text-center">
                  <AppBadge :color="estadoColor(cuota.estadoCalculado)" size="sm">
                    {{ cuota.estadoCalculado }}
                  </AppBadge>
                </td>
                <td v-if="canRegistrarPago" class="px-3 py-2 text-right">
                  <div class="inline-flex items-center gap-1">
                    <button
                      v-if="tieneSaldoPendiente(cuota.saldo)"
                      type="button"
                      title="Registrar pago de esta cuota"
                      class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                      @click="iniciarPagoCuota(cuota.id)"
                    >
                      <AppIcon :name="ICONS.banknote" :size="14" />
                      Pagar
                    </button>
                    <button
                      type="button"
                      title="Ver historial de esta cuota"
                      class="inline-flex items-center rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                      @click="verCuotaDetalle(cuota.id)"
                    >
                      <AppIcon :name="ICONS.eye" :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Observaciones y comentarios -->
      <div class="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
        <h4 class="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
          Observaciones y comentarios
        </h4>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p class="text-xs text-gray-400 dark:text-gray-500">N° de comprobante</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ cuenta.numero_comprobante || '—' }}</p>
          </div>
          <div v-if="cuenta.descripcion">
            <p class="text-xs text-gray-400 dark:text-gray-500">Descripción</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ cuenta.descripcion }}</p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-xs text-gray-400 dark:text-gray-500">Observación de la cuenta</p>
            <p class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {{ cuenta.observacion || 'Sin observaciones.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Historial de pagos -->
      <div v-if="!esPlan">
        <h4 class="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
          Historial de pagos
        </h4>
        <div v-if="!cuenta.pagos.length" class="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
          Sin pagos registrados.
        </div>
        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <li v-for="pago in cuenta.pagos" :key="pago.id" class="flex items-center justify-between gap-3 py-2.5">
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ formatCurrency(pago.monto) }}
                <span class="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
                  {{ pago.medioPago || 'Sin medio' }}
                </span>
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                {{ formatListDate(pago.fechaPago) }}
                <span v-if="pago.numeroOperacion"> · Op. {{ pago.numeroOperacion }}</span>
                <span v-if="pago.referencia"> · {{ pago.referencia }}</span>
              </p>
              <p v-if="pago.observacion" class="mt-1 whitespace-pre-wrap text-theme-xs italic text-gray-500 dark:text-gray-400">
                “{{ pago.observacion }}”
              </p>
            </div>
            <button
              v-if="canAnular"
              type="button"
              class="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-500/10"
              :disabled="anularMutation.isPending.value"
              @click="pedirAnular(pago.id, pago.monto)"
            >
              Anular
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      No se pudo cargar la cuenta.
    </div>
  </AppModal>

  <!-- Detalle de una cuota individual (modal apilado) -->
  <CuentaDetalleModal
    v-if="cuotaDetalleId != null"
    v-model="cuotaDetalleAbierto"
    :cuenta-id="cuotaDetalleId"
    :tipo="tipo"
    :can-anular="canAnular"
    :can-registrar-pago="canRegistrarPago"
    @pagar-cuota="(c) => emit('pagar-cuota', c)"
  />

  <!-- Confirmación de anular pago -->
  <AppConfirmDialog
    v-model="confirmAnularOpen"
    title="Anular pago"
    variant="danger"
    confirm-label="Sí, anular"
    loading-label="Anulando..."
    :loading="anularMutation.isPending.value"
    @confirm="ejecutarAnular"
  >
    <span>
      ¿Confirmas anular este pago
      <strong v-if="pagoAAnular">{{ formatCurrency(pagoAAnular.monto) }}</strong>?
      El saldo de la cuenta se restaurará automáticamente.
    </span>
  </AppConfirmDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppBadge, AppConfirmDialog, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCuentaDetalleQuery } from '@/modules/finanzas/composables/useCuentaDetalleQuery'
import { useAnularPagoMutation } from '@/modules/finanzas/composables/usePagoMutations'
import type {
  CuentaFinanciera,
  EstadoCuenta,
  TipoCuenta,
} from '@/modules/finanzas/interfaces/cuenta.interface'
import { formatCurrency, tieneSaldoPendiente } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'
import { ICONS } from '@/shared/constants/icons'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'

const props = defineProps<{
  cuentaId: number | null
  tipo: TipoCuenta
  canAnular?: boolean
  canRegistrarPago?: boolean
}>()

const emit = defineEmits<{
  /** Emite una "cuenta" completa (proyectada desde la cuota hija) lista
   *  para pasar directo a RegistrarPagoModal. */
  'pagar-cuota': [cuenta: CuentaFinanciera]
}>()

const open = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const cuentaIdRef = computed(() => props.cuentaId)
const query = useCuentaDetalleQuery(props.tipo, cuentaIdRef)
const anularMutation = useAnularPagoMutation(props.tipo)

const cuenta = computed(() => query.data.value ?? null)

const terceroLabel = computed(() => (props.tipo === 'COBRAR' ? 'Cliente' : 'Proveedor'))

const esPlan = computed(() => (cuenta.value?.numero_cuotas_total ?? null) !== null)
const esCuotaHija = computed(() => (cuenta.value?.id_cuenta_padre ?? null) !== null)

const cuotasPagadas = computed(
  () => (cuenta.value?.cuotas ?? []).filter((c) => c.estadoCalculado === 'PAGADO').length,
)

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

/** Proyecta una cuota hija a la forma CuentaFinanciera para que RegistrarPagoModal
 *  la pueda mostrar y pagar directamente. */
const iniciarPagoCuota = (idCuota: number) => {
  const c = cuenta.value
  if (!c) return
  const cuota = c.cuotas.find((x) => x.id === idCuota)
  if (!cuota) return

  const proyectada: CuentaFinanciera = {
    id: cuota.id,
    id_tipo_cuenta: c.id_tipo_cuenta,
    tipo: c.tipo,
    id_tercero: c.id_tercero,
    tercero_nombre: c.tercero_nombre,
    tercero: c.tercero,
    documento_tercero: c.documento_tercero,
    id_comprobante_venta: null,
    id_comprobante_compra: null,
    id_cuenta_padre: c.id,
    numero_cuota: cuota.numeroCuota,
    numero_cuotas_total: null,
    descripcion: `Cuota ${cuota.numeroCuota}/${c.numero_cuotas_total ?? '?'}`,
    id_banco: null,
    tasa_interes: null,
    numero_comprobante: c.numero_comprobante ?? null,
    comprobante: `Cuota ${cuota.numeroCuota} de ${c.numero_cuotas_total ?? '?'}`,
    fecha_emision: c.fecha_emision,
    fecha_vencimiento: cuota.fechaVencimiento,
    monto_pendiente: cuota.montoPendiente,
    monto_abonado: cuota.montoAbonado,
    saldo: cuota.saldo,
    estado_calculado: cuota.estadoCalculado,
    observacion: null,
    dias_vencido: 0,
    es_plan: false,
  }

  emit('pagar-cuota', proyectada)
}

/* Confirmación al anular pago */
const confirmAnularOpen = ref(false)
const pagoAAnular = ref<{ id: number; monto: number } | null>(null)

const pedirAnular = (idPago: number, monto: number) => {
  pagoAAnular.value = { id: idPago, monto }
  confirmAnularOpen.value = true
}

const ejecutarAnular = async () => {
  const p = pagoAAnular.value
  if (!p) return
  try {
    await anularMutation.mutateAsync({
      idPago: p.id,
      idUsuarioAuditoria: authStore.user?.id ?? undefined,
    })
    await query.refetch()
  } catch {
    // El toast con el mensaje del backend lo dispara la mutación.
  } finally {
    // Cerramos siempre para que el toast quede visible sin ser tapado por el diálogo.
    confirmAnularOpen.value = false
    pagoAAnular.value = null
  }
}

/* Drill-down: ver detalle de una cuota (modal apilado, recursivo) */
const cuotaDetalleId = ref<number | null>(null)
const cuotaDetalleAbierto = ref(false)

const verCuotaDetalle = (idCuota: number) => {
  cuotaDetalleId.value = idCuota
  cuotaDetalleAbierto.value = true
}
</script>

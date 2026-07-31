<template>
  <AppModal v-model="open" title="Detalle de la cuenta" size="lg">
    <div v-if="query.isLoading.value" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando detalle...
    </div>

    <div v-else-if="cuenta" class="space-y-5">
      <!-- Datos de la cuenta -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div class="col-span-2 sm:col-span-1">
          <p class="text-xs text-gray-400 dark:text-gray-500">{{ terceroLabel }}</p>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ cuenta.tercero }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">{{ cuenta.documento_tercero || '—' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Comprobante</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ cuenta.comprobante || '—' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Estado</p>
          <AppBadge :color="estadoColor(cuenta.estado_calculado)" size="sm">
            {{ cuenta.estado_calculado }}
          </AppBadge>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Emisión</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatListDate(cuenta.fecha_emision) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Vencimiento</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatListDate(cuenta.fecha_vencimiento) }}</p>
        </div>
      </div>

      <!-- Montos -->
      <div class="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03]">
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Monto original</p>
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

      <!-- Historial de pagos -->
      <div>
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
                <span v-if="pago.referencia"> · {{ pago.referencia }}</span>
              </p>
            </div>
            <button
              v-if="canAnular"
              type="button"
              class="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-500/10"
              :disabled="anularMutation.isPending.value"
              @click="anular(pago.id)"
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppBadge, AppModal } from '@/shared/components'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCuentaDetalleQuery } from '@/modules/finanzas/composables/useCuentaDetalleQuery'
import { useAnularPagoMutation } from '@/modules/finanzas/composables/usePagoMutations'
import type { EstadoCuenta, TipoCuenta } from '@/modules/finanzas/interfaces/cuenta.interface'
import { formatCurrency } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'

const props = defineProps<{
  cuentaId: number | null
  tipo: TipoCuenta
  canAnular?: boolean
}>()

const open = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const cuentaIdRef = computed(() => props.cuentaId)
const query = useCuentaDetalleQuery(props.tipo, cuentaIdRef)
const anularMutation = useAnularPagoMutation(props.tipo)

const cuenta = computed(() => query.data.value ?? null)

const terceroLabel = computed(() => (props.tipo === 'COBRAR' ? 'Cliente' : 'Proveedor'))

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

const anular = async (idPago: number) => {
  try {
    await anularMutation.mutateAsync({
      idPago,
      idUsuarioAuditoria: authStore.user?.id ?? undefined,
    })
    await query.refetch()
  } catch {
    // El toast de error ya lo maneja la mutación.
  }
}
</script>

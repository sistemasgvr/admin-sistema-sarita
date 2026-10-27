<template>
  <AppModal v-model="open" title="Detalle de la garantía" size="xl">
    <div v-if="!garantia && detalleQuery.isFetching.value" class="py-8 text-center text-sm text-gray-500">
      Cargando...
    </div>
    <div v-else-if="garantia" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <AppBadge :color="estadoColor(garantia.nombre_estado)" size="sm">
            {{ garantia.nombre_estado || '—' }}
          </AppBadge>
          <AppBadge :color="origenColor(resolveOrigen(garantia))" size="sm">
            {{ origenLabel(resolveOrigen(garantia)) }}
          </AppBadge>
          <span class="text-theme-sm text-gray-500 dark:text-gray-400">{{ origenDetalle(garantia) }}</span>
        </div>
        <button
          v-if="puedeEditar"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10"
          @click="editar"
        >
          <AppIcon :name="ICONS.pencil" :size="14" />
          Editar
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="item in resumen"
          :key="item.label"
          class="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
        >
          <p class="text-xs text-gray-400 dark:text-gray-500">{{ item.label }}</p>
          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
            {{ formatCurrency(item.valor) }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800 sm:grid-cols-2">
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Cliente</p>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">
            {{ garantia.nombre_cliente || '—' }}
          </p>
          <p class="text-theme-xs text-gray-400 dark:text-gray-500">
            {{ garantia.documento_cliente || '—' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Fecha de registro</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ formatListDate(garantia.fecha_registro) }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500">Cobro</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ garantia.cobro_medio_pago || garantia.medio_pago || '—' }}
            <span v-if="cuentaCobro !== '—'" class="text-theme-xs text-gray-400"> · {{ cuentaCobro }}</span>
          </p>
        </div>
        <div v-if="reembolso">
          <p class="text-xs text-gray-400 dark:text-gray-500">Reembolso</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ reembolso }}</p>
        </div>
        <div v-if="garantia.nombre_producto">
          <p class="text-xs text-gray-400 dark:text-gray-500">Producto</p>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ garantia.nombre_producto }}</p>
        </div>
        <div class="sm:col-span-2">
          <p class="text-xs text-gray-400 dark:text-gray-500">Observaciones</p>
          <p class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {{ garantia.observacion || 'Sin observaciones.' }}
          </p>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 dark:border-gray-800">
        <h4 class="px-3 pt-3 text-sm font-semibold text-gray-800 dark:text-white/90">Movimientos</h4>
        <div v-if="!movimientos.length" class="p-3 text-sm text-gray-500">Sin movimientos.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-left text-theme-sm">
            <thead class="text-theme-xs text-gray-400 dark:text-gray-500">
              <tr>
                <th class="px-3 py-2 font-medium">Tipo</th>
                <th class="px-3 py-2 font-medium">Fecha</th>
                <th class="px-3 py-2 text-right font-medium">Monto</th>
                <th class="px-3 py-2 font-medium">Medio</th>
                <th class="px-3 py-2 font-medium">Cuenta</th>
                <th class="px-3 py-2 font-medium">Nº operación</th>
                <th class="px-3 py-2 font-medium">Comprobante</th>
                <th class="px-3 py-2 font-medium">Observación</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="m in movimientos" :key="m.id" class="text-gray-700 dark:text-gray-300">
                <td class="whitespace-nowrap px-3 py-2 font-medium text-gray-800 dark:text-white/90">
                  {{ m.nombre_tipo_movimiento || 'Movimiento' }}
                </td>
                <td class="whitespace-nowrap px-3 py-2">{{ formatListDate(m.fecha) }}</td>
                <td class="whitespace-nowrap px-3 py-2 text-right font-semibold">
                  {{ formatCurrency(m.monto) }}
                </td>
                <td class="whitespace-nowrap px-3 py-2">{{ m.medio_pago || '—' }}</td>
                <td class="px-3 py-2">{{ m.cuenta_bancaria || '—' }}</td>
                <td class="whitespace-nowrap px-3 py-2">{{ m.numero_operacion || '—' }}</td>
                <td class="whitespace-nowrap px-3 py-2">{{ m.comprobante || '—' }}</td>
                <td class="min-w-40 px-3 py-2 text-theme-xs text-gray-500">{{ m.observacion || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppModal>

  <GarantiaFormModal
    v-if="puedeEditar"
    v-model="formOpen"
    :garantia="garantia"
  />
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { AppBadge, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import GarantiaFormModal from '@/modules/finanzas/components/GarantiaFormModal.vue'
import { useGarantiaDetalleQuery } from '@/modules/finanzas/composables/useGarantiasQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { ICONS } from '@/shared/constants/icons'
import { formatCurrency } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'
import { toastApiError } from '@/shared/composables/useToast'
import {
  estadoColor,
  formatCuentaMovimiento,
  origenColor,
  origenDetalle,
  origenLabel,
  resolveOrigen,
} from '@/modules/finanzas/utils/garantiaDetalle'
import type { Garantia } from '@/modules/finanzas/interfaces/garantia.interface'

const props = defineProps<{ garantiaId: number | null; inicial?: Garantia | null }>()
const open = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const canEditar = computed(() => authStore.hasPermission(PermisoBanderas.FINANZAS_GARANTIAS_EDITAR))

const detalleQuery = useGarantiaDetalleQuery(toRef(props, 'garantiaId'))
watch(detalleQuery.error, (error) => {
  if (error) toastApiError(error, 'No se pudo cargar el detalle')
})

const garantia = computed<Garantia | null>(() => detalleQuery.data.value ?? props.inicial ?? null)
const movimientos = computed(() => garantia.value?.movimientos ?? [])
const puedeEditar = computed(() => canEditar.value && Boolean(garantia.value?.puede_editar))
const cuentaCobro = computed(() =>
  garantia.value
    ? formatCuentaMovimiento({
        cuenta_bancaria: garantia.value.cobro_cuenta_bancaria ?? garantia.value.cuenta_bancaria,
        numero_operacion: garantia.value.numero_operacion,
      })
    : '—',
)

const reembolso = computed(() => {
  const g = garantia.value
  if (!g) return ''
  return [
    g.fecha_reembolso ? formatListDate(g.fecha_reembolso) : null,
    g.medio_reembolso,
    g.cuenta_bancaria_reembolso,
  ]
    .filter(Boolean)
    .join(' · ')
})

const resumen = computed(() => {
  const g = garantia.value
  if (!g) return []
  return [
    { label: 'Cobrado', valor: g.monto_cobrado },
    { label: 'Devuelto', valor: g.monto_devuelto },
    { label: 'Transferido', valor: g.monto_transferido ?? 0 },
    { label: 'Saldo', valor: g.monto_saldo },
  ]
})

// Sin modales apilados: el detalle se cierra mientras se edita y se reabre al terminar
// (guardar o cancelar), así los selectores y toasts del formulario usan el apilado por defecto.
const formOpen = ref(false)
const editar = () => {
  open.value = false
  formOpen.value = true
}
watch(formOpen, (abierto, antes) => {
  if (antes && !abierto) open.value = true
})
</script>

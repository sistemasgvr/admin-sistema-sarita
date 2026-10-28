<template>
  <AppModal
    v-model="open"
    title="Renovar regulador"
    :subtitle="alquiler?.numero_alquiler || undefined"
    size="md"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Se emitirá un comprobante solo por el
        <strong class="font-medium text-gray-800 dark:text-white/90">regulador</strong>
        y se registrará el siguiente periodo quincenal.
      </p>

      <div class="rounded-xl border border-gray-100 p-3 text-sm dark:border-gray-800">
        <p class="text-gray-500 dark:text-gray-400">Regulador</p>
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{
            alquiler?.nombre_producto_regulador
              ? `${alquiler.codigo_producto_regulador ? `${alquiler.codigo_producto_regulador} — ` : ''}${alquiler.nombre_producto_regulador}`
              : 'Sin regulador'
          }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AppSelect
          v-model="idTipoComprobante"
          label="Comprobante"
          placeholder="Selecciona"
          :options="tipoComprobanteOptions"
        />
        <AppFormField label="Monto periodo" required :error="errorMonto">
          <MoneyInput
            v-model="monto"
            placeholder="0.00"
            :state="errorMonto ? 'error' : 'default'"
            @blur="onBlurMonto"
          />
        </AppFormField>
        <AppDatePicker v-model="fecha" label="Fecha de emisión" />
        <div class="hidden sm:block" />
        <AppDatePicker v-model="fechaInicio" label="Inicio periodo" />
        <AppDatePicker v-model="fechaFin" label="Fin periodo" />
      </div>

      <p
        v-if="mensajeBloqueoCaja"
        class="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
      >
        {{ mensajeBloqueoCaja }}
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="guardando"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="guardando || !puedeRenovar"
        @click="confirmar"
      >
        {{ guardando ? 'Renovando...' : 'Cobrar y renovar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { alquileresService } from '@/modules/balones/alquileres/services/alquileres.service'
import type { Alquiler } from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import { useCreateComprobanteMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import { usePosComprobanteForm } from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import { addDaysIso } from '@/modules/ventas/comprobantes/composables/usePosKitMedicinal'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCajaAbiertaRequerida } from '@/modules/caja/composables/useCajaAbiertaRequerida'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { AppDatePicker, AppModal, AppSelect, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { parseMoneyInput, roundMoney } from '@/shared/utils/currency'

const props = defineProps<{
  alquiler?: Alquiler | null
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [] }>()

const authStore = useAuthStore()
const createComprobanteMutation = useCreateComprobanteMutation()
const {
  idTipoComprobante,
  serie,
  fecha,
  tipoComprobanteOptions,
  idAfectacionGravado,
  idMonedaPen,
  idTipoOperacionVentaInterna,
  esNotaVenta,
} = usePosComprobanteForm()

/** Caja es por fecha + sucursal; la sucursal sale del almacén del alquiler. */
const almacenesQuery = useAlmacenesQuery(ref({ pagina: 1, limite: 100 }))
const idSucursalCaja = computed(() => {
  const idAlmacen = props.alquiler?.id_almacen
  if (idAlmacen == null) return null
  const alm = almacenesQuery.data.value?.data?.find((a) => a.id === Number(idAlmacen))
  return alm?.id_sucursal == null ? null : Number(alm.id_sucursal)
})
const {
  cajaAbierta,
  pendienteCierre,
  mensajeBloqueo: mensajeBloqueoCaja,
  assertCajaAbierta,
} = useCajaAbiertaRequerida(fecha, idSucursalCaja)

// Si la caja de hoy no está abierta pero sigue abierta la de un día anterior, se emite con esa fecha.
watch(
  () => [open.value, cajaAbierta.value, pendienteCierre.value?.fecha] as const,
  ([isOpen, abierta, fechaPendiente]) => {
    if (!isOpen || abierta || !fechaPendiente) return
    fecha.value = String(fechaPendiente).slice(0, 10)
  },
)

const monto = ref('')
const fechaInicio = ref('')
const fechaFin = ref('')
const guardando = ref(false)

const { error: errorMonto, valido: montoValido, onBlur: onBlurMonto } = useMoneyField(monto, {
  min: 0.01,
})

const puedeRenovar = computed(
  () =>
    Boolean(props.alquiler?.id_producto_regulador) &&
    Boolean(props.alquiler?.id_cliente) &&
    Boolean(idTipoComprobante.value) &&
    montoValido.value &&
    Boolean(fechaInicio.value) &&
    Boolean(fechaFin.value),
)

watch(
  () => [open.value, props.alquiler?.id] as const,
  ([isOpen]) => {
    if (!isOpen || !props.alquiler) return
    const base =
      props.alquiler.fecha_fin_pactada?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10)
    const inicio = addDaysIso(base, 1)
    const dias = props.alquiler.dias_periodo && props.alquiler.dias_periodo > 0
      ? props.alquiler.dias_periodo
      : 14
    fechaInicio.value = inicio
    fechaFin.value = addDaysIso(inicio, dias - 1)
    const tarifa = Number(props.alquiler.tarifa_diaria ?? 0)
    monto.value = tarifa > 0 ? tarifa.toFixed(2) : ''
  },
)

async function confirmar() {
  const alquiler = props.alquiler
  const userId = authStore.user?.id
  if (!alquiler?.id_producto_regulador || !userId) {
    toastWarning('El alquiler no tiene regulador vinculado')
    return
  }
  if (!puedeRenovar.value) {
    toastWarning('Completa tipo de comprobante, monto y fechas')
    return
  }
  if (!assertCajaAbierta()) return

  const montoNum = roundMoney(parseMoneyInput(monto.value))

  guardando.value = true
  try {
    const comprobante = await createComprobanteMutation.mutateAsync({
      idUsuarioAuditoria: userId,
      idTipoComprobante: Number(idTipoComprobante.value),
      serie: serie.value.trim(),
      fecha: fecha.value,
      idSucursal: idSucursalCaja.value ?? undefined,
      idCliente: Number(alquiler.id_cliente),
      detalles: [
        {
          idProducto: Number(alquiler.id_producto_regulador),
          cantidad: 1,
          precioUnitario: montoNum,
          descuento: 0,
          porcentajeIgv: 18,
          idAfectacionIgv: idAfectacionGravado.value,
          descripcion: `Renovación regulador — ${alquiler.nombre_producto_regulador || 'periodo'}`,
        },
      ],
      idTipoOperacionSunat: idTipoOperacionVentaInterna.value,
      idMoneda: idMonedaPen.value,
      glosa: `Renovación alquiler ${alquiler.numero_alquiler}`,
    })

    await alquileresService.renovar(alquiler.id, {
      idUsuarioAuditoria: userId,
      idComprobante: comprobante.id,
      monto: montoNum,
      fechaInicio: fechaInicio.value,
      fechaFin: fechaFin.value,
      observacion: 'Renovación regulador',
    })

    toastSuccess(
      esNotaVenta.value
        ? 'Renovación registrada (venta sin documento)'
        : 'Renovación cobrada y periodo registrado',
    )
    open.value = false
    emit('saved')
  } catch {
    // toast en mutation / api
  } finally {
    guardando.value = false
  }
}
</script>

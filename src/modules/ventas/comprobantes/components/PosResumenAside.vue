<template>
  <DetailSectionCard title="Resumen" :icon="ICONS.creditCard">
    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-500 dark:text-gray-400">Valor venta</span>
        <span class="tabular-nums text-gray-800 dark:text-white/90">{{
          formatMoney(totales.valorVenta)
        }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500 dark:text-gray-400">IGV (18% incluido)</span>
        <span class="tabular-nums text-gray-800 dark:text-white/90">{{
          formatMoney(totales.igv)
        }}</span>
      </div>
      <div
        class="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold dark:border-gray-800"
      >
        <span class="text-gray-800 dark:text-white/90">Total</span>
        <span class="tabular-nums text-gray-800 dark:text-white/90">{{
          formatMoney(totales.total)
        }}</span>
      </div>
    </div>

    <div class="mt-5 space-y-3">
      <div>
        <div class="mb-1.5 flex items-center gap-1">
          <span
            class="text-sm font-medium"
            :class="
              comprobanteGuardadoId
                ? 'text-gray-300 dark:text-white/15'
                : 'text-gray-700 dark:text-gray-300'
            "
          >
            Condición de pago
            <span class="text-error-500" aria-hidden="true">*</span>
          </span>
          <AppHelpTip
            v-if="esVentaCredito"
            tone="warning"
            placement="top"
            :text="textoAyudaCredito"
            aria-label="Detalle de la condición de pago a crédito"
          />
        </div>
        <AppSelect
          v-model="idCondicionPagoModel"
          placeholder="Contado / crédito"
          :options="condicionPagoOptions"
          :disabled="Boolean(comprobanteGuardadoId)"
        />
      </div>
      <MedioPagoCuentaField
        v-model:id-medio-pago="idMedioPagoField"
        v-model:id-cuenta-bancaria="idCuentaBancariaModel"
        v-model:numero-operacion="numeroOperacionModel"
        v-model:valido="pagoValidoModel"
        :medio-requerido="!esVentaCredito"
        :disabled="Boolean(comprobanteGuardadoId)"
        excluir-credito
        numero-operacion-opcional
      />
      <p class="-mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
        {{
          esVentaCredito
            ? 'El cobro se registra después en Cuentas por cobrar.'
            : 'Obligatorio al contado (caja / libro diario).'
        }}
      </p>
      <AppInput v-model="glosaModel" label="Glosa" placeholder="Opcional" />
      <div v-if="mostrarGenerarGre" class="space-y-1">
        <div class="flex items-start gap-1">
          <AppCheckbox
            v-model="generarGreModel"
            class="flex-1"
            label="Generar guía de remisión (GRE)"
            :disabled="Boolean(comprobanteGuardadoId)"
          />
          <AppHelpTip
            placement="top"
            text="Marca esta opción si el cilindro sale de almacén y quieres emitir la GRE ahora. El préstamo se registra igual si no la marcas; puedes generar la guía después. Requiere chofer, vehículo y ubigeo configurados."
            aria-label="Ayuda sobre generar guía de remisión"
          />
        </div>
      </div>
    </div>

    <div
      v-if="comprobanteGuardadoSerie && comprobanteGuardadoNumero"
      class="mt-4 inline-flex w-full items-center gap-2 rounded-lg bg-success-500/10 p-3 text-sm text-success-700 dark:text-success-400"
    >
      <AppIcon :name="ICONS.clipboardCheck" :size="16" class="shrink-0" />
      <span>
        Comprobante {{ comprobanteGuardadoSerie }}-{{ comprobanteGuardadoNumero }} registrado.
      </span>
    </div>

    <div class="mt-5 flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="!puedeGuardar || guardando || Boolean(comprobanteGuardadoId)"
          @click="emit('guardar')"
        >
          <AppIcon
            :name="guardando ? ICONS.loader : ICONS.clipboardCheck"
            :size="16"
            :class="guardando ? 'animate-spin' : ''"
          />
          {{
            guardando
              ? guardandoLabel
              : comprobanteGuardadoId
                ? 'Ya guardado'
                : guardarLabel
          }}
        </button>
        <AppHelpTip
          v-if="motivoNoGuardar && !comprobanteGuardadoId"
          tone="error"
          placement="top"
          :text="motivoNoGuardar"
          aria-label="Motivo por el que no se puede guardar"
        />
      </div>

      <button
        v-if="comprobanteGuardadoId && (esNotaVenta ? canPrint : canEmit)"
        type="button"
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-success-500 px-4 py-2.5 text-sm font-medium text-success-600 hover:bg-success-500/10 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="emitiendo"
        @click="emit('emitir')"
      >
        <AppIcon
          :name="emitiendo ? ICONS.loader : ICONS.receipt"
          :size="16"
          :class="emitiendo ? 'animate-spin' : ''"
        />
        {{
          emitiendo
            ? esNotaVenta
              ? 'Imprimiendo...'
              : 'Emitiendo...'
            : esNotaVenta
              ? 'Imprimir ticket'
              : 'Emitir SUNAT'
        }}
      </button>

      <RouterLink
        :to="{
          name: esNotaVenta ? 'admin-ventas-vsd' : 'admin-ventas-comprobantes',
        }"
        class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
      >
        <AppIcon :name="ICONS.list" :size="16" />
        {{ esNotaVenta ? 'Ver ventas sin documento' : 'Ver comprobantes' }}
      </RouterLink>
    </div>
  </DetailSectionCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatPosMoney } from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import { AppCheckbox, AppHelpTip, AppInput, AppSelect } from '@/shared/components'
import MedioPagoCuentaField from '@/modules/finanzas/components/MedioPagoCuentaField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { ICONS } from '@/shared/constants/icons'

const props = withDefaults(
  defineProps<{
    totales: { valorVenta: number; igv: number; total: number }
    puedeGuardar: boolean
    guardando?: boolean
    emitiendo?: boolean
    canEmit?: boolean
    canPrint?: boolean
    esNotaVenta?: boolean
    comprobanteGuardadoId?: number | null
    comprobanteGuardadoSerie?: string | null
    comprobanteGuardadoNumero?: string | null
    guardarLabel?: string
    guardandoLabel?: string
    condicionPagoOptions?: { value: number; label: string }[]
    esVentaCredito?: boolean
    diasCredito?: number
    numeroCuotas?: number
    diaMesPago?: number
    fechaVencimiento?: string
    /** Motivo en tooltip cuando el botón Guardar está deshabilitado. */
    motivoNoGuardar?: string | null
    /** Muestra el check para emitir GRE junto al préstamo de cilindro. */
    mostrarGenerarGre?: boolean
  }>(),
  {
    guardarLabel: 'Guardar',
    guardandoLabel: 'Guardando...',
    canPrint: false,
    esNotaVenta: false,
    condicionPagoOptions: () => [],
    esVentaCredito: false,
    diasCredito: 0,
    numeroCuotas: 0,
    diaMesPago: 0,
    fechaVencimiento: '',
    motivoNoGuardar: null,
    mostrarGenerarGre: false,
  },
)

const emit = defineEmits<{
  guardar: []
  emitir: []
}>()

const glosaModel = defineModel<string>('glosa', { default: '' })
const idCondicionPagoModel = defineModel<number | ''>('idCondicionPago', { default: '' })
const idMedioPagoModel = defineModel<number | ''>('idMedioPago', { default: '' })
const idCuentaBancariaModel = defineModel<number | null>('idCuentaBancaria', { default: null })
const numeroOperacionModel = defineModel<string>('numeroOperacion', { default: '' })
const pagoValidoModel = defineModel<boolean>('pagoValido', { default: true })

// El POS guarda el medio como `number | ''` (convención del formulario); el
// campo compartido usa `number | null`. Se adapta aquí para no cambiar el tipo
// en los cinco paneles que ya lo consumen.
const idMedioPagoField = computed<number | null>({
  get: () => (idMedioPagoModel.value === '' ? null : Number(idMedioPagoModel.value)),
  set: (v) => {
    idMedioPagoModel.value = v ?? ''
  },
})
const generarGreModel = defineModel<boolean>('generarGre', { default: false })

const formatMoney = formatPosMoney

const textoAyudaCredito = computed(() => {
  if (props.numeroCuotas > 1) {
    return `Plan de ${props.numeroCuotas} cuotas · cobro día ${props.diaMesPago || '—'} del mes. Se registrará cuenta por cobrar con cuotas.`
  }
  return `Crédito a ${props.diasCredito} días · vence ${props.fechaVencimiento || '—'}. Se registrará cuenta por cobrar.`
})
</script>

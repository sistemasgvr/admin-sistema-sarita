<template>
  <div class="grid grid-cols-2   gap-4" :class="columnas">
    <AppFormField :label="labelMedio" :optional="!medioRequerido" :required="medioRequerido" :error="errorMedio" class = "sm:col-span-2">
      <AppSelect
        v-model="idMedioPago"
        :options="medioOptions"
        :disabled="disabled"
        placeholder="Efectivo / Yape / Transferencia..."
      />
    </AppFormField>

    <AppFormField
      v-if="pideCuenta"no
      label="Cuenta de la empresa"
      required
      :error="errorCuenta"
      :hint="hintCuenta"
      class = "sm:col-span-2"
    >
      <AppSelect
        v-model="idCuentaBancaria"
        :options="cuentaOptions"
        :disabled="disabled || cuentaOptions.length === 0"
        :placeholder="cuentaOptions.length ? 'Seleccionar cuenta' : 'Sin cuentas para este medio'"
      />
    </AppFormField>

    <AppFormField
      v-if="mostrarNumeroOperacion"
      label="Nº operación"
      :required="pideNumeroOperacion"
      :optional="!pideNumeroOperacion"
      :error="errorNumeroOperacion"
      class="sm:col-span-2"
    >
      <AppInput v-model="numeroOperacion" :disabled="disabled" placeholder="Voucher / constancia" />
    </AppFormField>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, watchEffect } from 'vue'
import { AppInput, AppSelect } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useMediosPagoQuery } from '@/modules/finanzas/composables/useMediosPagoQuery'
import type { MedioPago } from '@/modules/finanzas/interfaces/cuenta.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const idMedioPago = defineModel<number | null>('idMedioPago', { default: null })
const idCuentaBancaria = defineModel<number | null>('idCuentaBancaria', { default: null })
const numeroOperacion = defineModel<string>('numeroOperacion', { default: '' })
const valido = defineModel<boolean>('valido', { default: true })

const props = withDefaults(
  defineProps<{
    labelMedio?: string
    medioRequerido?: boolean
    disabled?: boolean
    excluirCredito?: boolean
    mostrarSiempreNumeroOperacion?: boolean
    numeroOperacionOpcional?: boolean
    mostrarErrores?: boolean
  }>(),
  {
    labelMedio: 'Medio de pago',
    medioRequerido: false,
    disabled: false,
    excluirCredito: false,
    mostrarSiempreNumeroOperacion: false,
    numeroOperacionOpcional: false,
    mostrarErrores: false,
  },
)

const mediosQuery = useMediosPagoQuery()

const medios = computed<MedioPago[]>(() =>
  (mediosQuery.data.value ?? []).filter((m) => !props.excluirCredito || !m.esCredito),
)

const medioOptions = computed<SelectOption[]>(() =>
  medios.value.map((m) => ({
    value: m.id,

    label: m.configurado ? m.nombre : `${m.nombre} (sin configurar)`,
    disabled: !m.configurado,
  })),
)

const medioSeleccionado = computed<MedioPago | null>(
  () => medios.value.find((m) => m.id === idMedioPago.value) ?? null,
)

const pideCuenta = computed(() => medioSeleccionado.value?.requiereCuentaBancaria === true)
const medioSugiereNumeroOperacion = computed(
  () => medioSeleccionado.value?.requiereNumeroOperacion === true,
)
const pideNumeroOperacion = computed(
  () => !props.numeroOperacionOpcional && medioSugiereNumeroOperacion.value,
)
const mostrarNumeroOperacion = computed(
  () => props.mostrarSiempreNumeroOperacion || medioSugiereNumeroOperacion.value,
)

const cuentaOptions = computed<SelectOption[]>(() =>
  (medioSeleccionado.value?.cuentas ?? []).map((c) => ({
    value: c.id,
    label: [c.alias ?? c.titular, c.banco, c.numeroCuenta ?? c.telefonoBilletera]
      .filter(Boolean)
      .join(' · '),
  })),
)

const hintCuenta = computed(() =>
  pideCuenta.value && cuentaOptions.value.length === 0
    ? `Ninguna cuenta de la empresa tiene asociado ${medioSeleccionado.value?.nombre}. Configúralo en Configuración → Cuentas bancarias.`
    : undefined,
)

const errorMedio = computed(() =>
  props.mostrarErrores && props.medioRequerido && !idMedioPago.value ? 'Obligatorio' : '',
)
const errorCuenta = computed(() =>
  props.mostrarErrores && pideCuenta.value && !idCuentaBancaria.value ? 'Obligatorio' : '',
)
const errorNumeroOperacion = computed(() =>
  props.mostrarErrores && pideNumeroOperacion.value && !numeroOperacion.value.trim()
    ? 'Obligatorio'
    : '',
)
const columnas = computed(() =>
  pideCuenta.value || mostrarNumeroOperacion.value ? 'sm:grid-cols-2' : '',
)

watch(idMedioPago, () => {
  if (!pideCuenta.value) {
    idCuentaBancaria.value = null
    return
  }
  const cuentas = medioSeleccionado.value?.cuentas ?? []
  if (cuentas.some((c) => c.id === idCuentaBancaria.value)) return
  idCuentaBancaria.value =
    cuentas.find((c) => c.esPredeterminada)?.id ?? (cuentas.length === 1 ? cuentas[0].id : null)
})

watchEffect(() => {
  if (props.medioRequerido && !idMedioPago.value) return (valido.value = false)
  if (pideCuenta.value && !idCuentaBancaria.value) return (valido.value = false)
  if (pideNumeroOperacion.value && !numeroOperacion.value.trim()) return (valido.value = false)
  valido.value = true
})
</script>

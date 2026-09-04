<template>
  <div class="grid grid-cols-1 gap-4" :class="columnas">
    <AppFormField :label="labelMedio" :optional="!medioRequerido" :required="medioRequerido" :error="errorMedio">
      <AppSelect
        v-model="idMedioPago"
        :options="medioOptions"
        :disabled="disabled"
        placeholder="Efectivo / Yape / Transferencia..."
      />
    </AppFormField>

    <AppFormField
      v-if="pideCuenta"
      label="Cuenta de la empresa"
      required
      :error="errorCuenta"
      :hint="hintCuenta"
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
/**
 * Medio de pago + cuenta bancaria de la empresa + nº de operación.
 *
 * Fase 3, principio 3 del plan ("todo dinero tiene medio de pago y cuenta"):
 * las reglas de qué campos son obligatorios NO se repiten aquí, se leen de
 * `GET /finanzas/medios-pago`, que las sirve desde `fin_medio_pago_config` —
 * la misma tabla que valida el backend. Así un cambio de configuración no exige
 * tocar los formularios.
 *
 * Publica `v-model:valido` para que el formulario contenedor deshabilite su
 * botón de guardar, pero la validación real sigue siendo del backend.
 */
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
    /** Exigir un medio de pago para considerar el formulario válido. */
    medioRequerido?: boolean
    disabled?: boolean
    /** Ocultar CREDITO: los cobros inmediatos no admiten "venta a crédito". */
    excluirCredito?: boolean
    /** Mostrar el campo de nº operación aunque el medio no lo exija. */
    mostrarSiempreNumeroOperacion?: boolean
    /**
     * Nunca bloquear por falta de nº de operación. En el mostrador el cajero no
     * siempre tiene el voucher a mano al cobrar, y frenar la venta por eso es
     * peor que registrarla sin él: el dato se completa después.
     */
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
    // Un medio sin configurar hace fallar el guardado en el backend; se marca
    // y se deshabilita en vez de dejar que el usuario lo descubra al enviar.
    label: m.configurado ? m.nombre : `${m.nombre} (sin configurar)`,
    disabled: !m.configurado,
  })),
)

const medioSeleccionado = computed<MedioPago | null>(
  () => medios.value.find((m) => m.id === idMedioPago.value) ?? null,
)

const pideCuenta = computed(() => medioSeleccionado.value?.requiereCuentaBancaria === true)
/** El medio pide voucher según su configuración: decide si el campo se muestra. */
const medioSugiereNumeroOperacion = computed(
  () => medioSeleccionado.value?.requiereNumeroOperacion === true,
)
/** ...y si además bloquea el guardado. */
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

/**
 * Como mucho dos columnas: el medio y la cuenta caben juntos, pero el número de
 * operación ocupa la fila completa (`sm:col-span-2`). Con tres columnas los
 * selects quedaban ilegibles en contenedores estrechos como el aside del POS.
 */
const columnas = computed(() =>
  pideCuenta.value || mostrarNumeroOperacion.value ? 'sm:grid-cols-2' : '',
)

// Cambiar de medio invalida la cuenta anterior — es la misma regla que aplica
// el backend, así que la dejamos visible en vez de mandar una combinación que
// será rechazada. Si el nuevo medio tiene una cuenta predeterminada, se propone.
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

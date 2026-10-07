<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2" :class="$slots.default ? 'lg:grid-cols-3' : ''">
    <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:col-span-2" :class="$slots.default ? 'lg:col-span-3' : ''">
      <input v-model="montoDirecto" type="checkbox" role="switch" class="peer sr-only" />
      <span class="relative h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" aria-hidden="true" />
      <span>
        {{ montoDirecto ? 'Cobro por monto total' : 'Cobro por m³' }}
        <span class="block text-xs font-normal text-gray-500 dark:text-gray-400">{{ montoDirecto ? 'Ingresa el total a cobrar por el gas.' : 'El total se calcula con la cantidad y el precio por m³.' }}</span>
      </span>
    </label>
    <CantidadUnidadInput
      v-if="!cantidadBloqueada"
      v-model="cantidad"
      name="pos-anadir-cantidad"
      :nombre-unidad="nombreUnidad ?? 'UNID'"
      es-gas
      label="Cantidad de gas (m³)"
      :error="errorCantidad || undefined"
      :hint="hintCantidad"
    />
    <p v-if="cantidadBloqueada" class="self-center text-sm text-gray-600 dark:text-gray-300">
      Cantidad de gas: <strong>{{ cantidad }} m³</strong>
    </p>
    <div>
      <AppFormField :label="montoDirecto ? 'Monto total del gas' : 'Precio por m³'" required :error="errorPrecio">
        <MoneyInput
          v-model="precio"
          placeholder="0.00"
          :state="errorPrecio ? 'error' : 'default'"
          @blur="emit('blurPrecio')"
        />
      </AppFormField>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * Cantidad de gas y precio por m³ de la línea del POS.
 *
 * Vive aparte porque el mismo par de campos se coloca en dos sitios distintos
 * del modal: dentro de la columna del préstamo (donde acompaña al cilindro y
 * las fechas) y al final del formulario en el resto de escenarios de gas.
 */
import CantidadUnidadInput from '@/modules/ventas/comprobantes/components/CantidadUnidadInput.vue'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { MoneyInput } from '@/shared/components'

withDefaults(
  defineProps<{
    nombreUnidad?: string | null
    /** El cilindro elegido fija la cantidad: solo se pide el precio. */
    cantidadBloqueada?: boolean
    errorCantidad?: string
    hintCantidad?: string
    errorPrecio?: string
  }>(),
  {
    nombreUnidad: null,
    cantidadBloqueada: false,
    errorCantidad: '',
    hintCantidad: undefined,
    errorPrecio: '',
  },
)

const emit = defineEmits<{ blurPrecio: [] }>()

const montoDirecto = defineModel<boolean>('montoDirecto', { default: false })
const cantidad = defineModel<number>('cantidad', { default: 1 })
const precio = defineModel<string>('precio', { default: '' })
</script>

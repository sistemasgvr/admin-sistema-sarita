<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
    <div :class="cantidadBloqueada ? 'sm:col-span-2' : ''">
      <AppFormField label="Precio por m³" required :error="errorPrecio">
        <MoneyInput
          v-model="precio"
          placeholder="0.00"
          :state="errorPrecio ? 'error' : 'default'"
          @blur="emit('blurPrecio')"
        />
      </AppFormField>
    </div>
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

const cantidad = defineModel<number>('cantidad', { default: 1 })
const precio = defineModel<string>('precio', { default: '' })
</script>

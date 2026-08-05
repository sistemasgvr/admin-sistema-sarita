<template>
  <AppModal
    v-model="open"
    title="Stock mínimo"
    subtitle="La cantidad solo cambia con movimientos. Aquí defines el mínimo de alerta."
    size="md"
    @close="handleClose"
  >
    <form id="stock-form" autocomplete="off" @submit="onSubmit">
      <FormCardsLayout>
        <DetailSectionCard
          v-if="stock"
          title="Registro"
          :icon="ICONS.package"
          :full-width="true"
        >
          <div class="text-sm">
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ stock.nombre_almacen }}
            </p>
            <p class="mt-1 text-gray-600 dark:text-gray-400">
              {{ stock.codigo_producto }} — {{ stock.nombre_producto }}
            </p>
            <p class="mt-2 tabular-nums text-gray-700 dark:text-gray-300">
              Stock actual:
              {{ formatCantidad(stock.stock, stock.nombre_unidad_medida) }}
            </p>
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Alerta" :icon="ICONS.boxes" :full-width="true">
          <AppInput
            v-model="stockMinimo"
            label="Stock mínimo"
            type="number"
            :min="NUMBER_MIN.unitZero"
            :step="stepCantidad"
            placeholder="0"
            required
            v-bind="stockMinimoAttrs"
            :disabled="isSubmitting"
            :error="errors.stockMinimo"
            :hint="hintCantidad"
          />
        </DetailSectionCard>
      </FormCardsLayout>
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="stock-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : 'Guardar mínimo' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useUpdateStockMutation } from '@/modules/productos/stock/composables/useStockMutations'
import type { Stock } from '@/modules/productos/stock/interfaces/stock.interface'
import { AppInput, AppModal } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { NUMBER_MIN } from '@/shared/constants/number-input'
import {
  MSG_STOCK_UNID_ENTERO,
  formatCantidadPorUnidad,
  stepInputCantidadPorUnidad,
  unidadRequiereCantidadEntera,
} from '@/shared/utils/unidadMedidaCantidad'

const props = defineProps<{
  stock?: Stock | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const updateMutation = useUpdateStockMutation()

const nombreUnidad = computed(() => props.stock?.nombre_unidad_medida ?? null)
const requiereEnteros = computed(() =>
  unidadRequiereCantidadEntera(nombreUnidad.value, props.stock?.es_gas),
)
const stepCantidad = computed(() =>
  stepInputCantidadPorUnidad(nombreUnidad.value, props.stock?.es_gas),
)
const hintCantidad = computed(() =>
  requiereEnteros.value ? 'UNID / piezas: solo números enteros' : undefined,
)

const formatCantidad = (value: unknown, nombreUnidadMedida?: string | null) =>
  formatCantidadPorUnidad(value, nombreUnidadMedida)

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      stockMinimo: yup
        .number()
        .transform((_value, originalValue) => {
          if (originalValue === '' || originalValue == null) return undefined
          const n = typeof originalValue === 'number' ? originalValue : Number(originalValue)
          return Number.isFinite(n) ? n : undefined
        })
        .typeError('Ingresa una cantidad válida')
        .min(0, 'El stock mínimo no puede ser negativo')
        .required('El stock mínimo es obligatorio')
        .test('unidad-entera', MSG_STOCK_UNID_ENTERO, function (value) {
          if (value == null || !Number.isFinite(value)) return true
          if (!unidadRequiereCantidadEntera(nombreUnidad.value, props.stock?.es_gas)) {
            return true
          }
          return Math.abs(value - Math.round(value)) < 1e-9
        }),
    }),
  ),
  initialValues: {
    stockMinimo: 0,
  },
})

const [stockMinimo, stockMinimoAttrs] = defineField('stockMinimo')

const syncFormValues = () => {
  resetForm({
    values: {
      stockMinimo: props.stock?.stock_minimo ?? 0,
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  if (!props.stock) return
  try {
    await updateMutation.mutateAsync({
      id: props.stock.id,
      payload: {
        stockMinimo: Number(values.stockMinimo),
      },
    })
    emit('saved')
    open.value = false
  } catch {
    // toast en mutation
  }
})

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) syncFormValues()
  },
)

watch(
  () => props.stock,
  () => {
    if (open.value) syncFormValues()
  },
)
</script>

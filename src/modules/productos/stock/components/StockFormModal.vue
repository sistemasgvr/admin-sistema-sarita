<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Registrar stock' : 'Ajustar stock'"
    :subtitle="
      mode === 'create'
        ? 'Asocia un producto a un almacén con cantidad inicial.'
        : 'Actualiza la cantidad o el stock mínimo del registro seleccionado.'
    "
    size="md"
    @close="handleClose"
  >
    <form
      id="stock-form"
      autocomplete="off"
      @submit="onSubmit"
    >
      <FormCardsLayout>
        <DetailSectionCard
          v-if="mode === 'create'"
          title="Ubicación y producto"
          :icon="ICONS.warehouse"
          :full-width="true"
        >
          <div class="space-y-4">
            <AppSelect
              v-model="idAlmacen"
              label="Almacén"
              placeholder="Selecciona un almacén"
              required
              v-bind="idAlmacenAttrs"
              :disabled="isSubmitting"
              :error="errors.idAlmacen"
              :options="almacenOptions"
            />

            <AppSelect
              v-model="idProducto"
              label="Producto"
              placeholder="Selecciona un producto"
              required
              v-bind="idProductoAttrs"
              :disabled="isSubmitting"
              :error="errors.idProducto"
              :options="productoOptions"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          v-else-if="stock"
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
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Cantidades" :icon="ICONS.boxes" :full-width="true">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppInput
              v-model="stockCantidad"
              label="Cantidad en stock"
              type="number"
              :min="NUMBER_MIN.unitZero"
              :step="NUMBER_STEP.unit"
              placeholder="0"
              required
              v-bind="stockCantidadAttrs"
              :disabled="isSubmitting"
              :error="errors.stock"
            />

            <AppInput
              v-model="stockMinimo"
              label="Stock mínimo"
              type="number"
              :min="NUMBER_MIN.unitZero"
              :step="NUMBER_STEP.unit"
              placeholder="0"
              required
              v-bind="stockMinimoAttrs"
              :disabled="isSubmitting"
              :error="errors.stockMinimo"
            />
          </div>
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
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Registrar stock' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  useCreateStockMutation,
  useUpdateStockMutation,
} from '@/modules/productos/stock/composables/useStockMutations'
import type { Stock, StockFormMode } from '@/modules/productos/stock/interfaces/stock.interface'
import type { Almacen } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'

interface StockFormModalProps {
  mode: StockFormMode
  stock?: Stock | null
  almacenes: Almacen[]
  productos: Producto[]
}

const props = defineProps<StockFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateStockMutation()
const updateMutation = useUpdateStockMutation()

const almacenOptions = computed(() =>
  props.almacenes.map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre_sucursal
      ? `${almacen.nombre} (${almacen.nombre_sucursal})`
      : almacen.nombre,
  })),
)

const productoOptions = computed(() =>
  props.productos.map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  })),
)

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idAlmacen: yup.number().optional(),
      idProducto: yup.number().optional(),
      stock: yup
        .number()
        .typeError('Ingresa una cantidad válida')
        .integer('La cantidad debe ser un número entero')
        .min(0, 'La cantidad no puede ser negativa')
        .required('La cantidad es obligatoria'),
      stockMinimo: yup
        .number()
        .typeError('Ingresa un valor válido')
        .integer('El stock mínimo debe ser un número entero')
        .min(0, 'El stock mínimo no puede ser negativo')
        .required('El stock mínimo es obligatorio'),
    }),
  ),
  initialValues: {
    idAlmacen: undefined as number | undefined,
    idProducto: undefined as number | undefined,
    stock: 0,
    stockMinimo: 0,
  },
})

const [idAlmacen, idAlmacenAttrs] = defineField('idAlmacen')
const [idProducto, idProductoAttrs] = defineField('idProducto')
const [stockCantidad, stockCantidadAttrs] = defineField('stock')
const [stockMinimo, stockMinimoAttrs] = defineField('stockMinimo')

const syncFormValues = () => {
  resetForm({
    values: {
      idAlmacen: undefined,
      idProducto: undefined,
      stock: props.stock?.stock ?? 0,
      stockMinimo: props.stock?.stock_minimo ?? 0,
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    if (props.mode === 'create') {
      if (!values.idAlmacen || !values.idProducto) {
        return
      }

      await createMutation.mutateAsync({
        idAlmacen: Number(values.idAlmacen),
        idProducto: Number(values.idProducto),
        stock: Number(values.stock),
        stockMinimo: Number(values.stockMinimo),
      })
    } else if (props.stock) {
      await updateMutation.mutateAsync({
        id: props.stock.id,
        payload: {
          stock: Number(values.stock),
          stockMinimo: Number(values.stockMinimo),
        },
      })
    } else {
      return
    }

    emit('saved')
    open.value = false
  } catch {
    // toast en mutation
  }
})

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      syncFormValues()
    }
  },
)

watch(
  () => props.stock,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>

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
          help="Usa + para registrar un producto nuevo que afecte stock."
        >
          <div class="space-y-4">
            <AlmacenSelectField
              v-model="idAlmacen"
              required
              :disabled="isSubmitting"
              :error="errors.idAlmacen"
              :options="almacenOptions"
            />

            <ProductoSelectField
              v-model="idProducto"
              v-model:search="productoBuscar"
              label="Producto"
              placeholder="Selecciona un producto"
              :afecta-stock="true"
              :es-servicio="false"
              required
              :disabled="isSubmitting"
              :error="errors.idProducto"
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
            <p
              v-if="nombreUnidadMedida"
              class="mt-1 text-theme-xs text-gray-500 dark:text-gray-400"
            >
              U.M.: {{ nombreUnidadMedida }}
              <span v-if="requiereEnteros"> · solo enteros</span>
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
              :step="stepCantidad"
              placeholder="0"
              required
              v-bind="stockCantidadAttrs"
              :disabled="isSubmitting"
              :error="errors.stock"
              :hint="hintCantidad"
            />

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
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import {
  useCreateStockMutation,
  useUpdateStockMutation,
} from '@/modules/productos/stock/composables/useStockMutations'
import type { Stock, StockFormMode } from '@/modules/productos/stock/interfaces/stock.interface'
import type { Almacen } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import { AppInput, AppModal } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { NUMBER_MIN } from '@/shared/constants/number-input'
import {
  MSG_STOCK_UNID_ENTERO,
  stepInputCantidadPorUnidad,
  unidadRequiereCantidadEntera,
} from '@/shared/utils/unidadMedidaCantidad'
import { requiredSelect } from '@/shared/validation'

interface StockFormModalProps {
  mode: StockFormMode
  stock?: Stock | null
  almacenes: Almacen[]
}

const props = defineProps<StockFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateStockMutation()
const updateMutation = useUpdateStockMutation()
const productoBuscar = ref('')
const nombreUnidadMedida = ref<string | null>(null)
const esGasProducto = ref(false)

const requiereEnteros = computed(() =>
  unidadRequiereCantidadEntera(nombreUnidadMedida.value, esGasProducto.value),
)
const stepCantidad = computed(() =>
  stepInputCantidadPorUnidad(nombreUnidadMedida.value, esGasProducto.value),
)
const hintCantidad = computed(() =>
  requiereEnteros.value ? 'UNID / piezas: solo números enteros' : undefined,
)

const almacenOptions = computed(() =>
  props.almacenes.map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre_sucursal
      ? `${almacen.nombre} (${almacen.nombre_sucursal})`
      : almacen.nombre,
  })),
)

const cantidadSegunUnidad = (etiquetaCampo: string) =>
  yup
    .number()
    .transform((_value, originalValue) => {
      if (originalValue === '' || originalValue == null) return undefined
      const n = typeof originalValue === 'number' ? originalValue : Number(originalValue)
      return Number.isFinite(n) ? n : undefined
    })
    .typeError('Ingresa una cantidad válida')
    .min(0, `${etiquetaCampo} no puede ser negativa`)
    .required(`${etiquetaCampo} es obligatoria`)
    .test('unidad-entera', `${etiquetaCampo}: ${MSG_STOCK_UNID_ENTERO}`, function (value) {
      if (value == null || !Number.isFinite(value)) return true
      if (!unidadRequiereCantidadEntera(nombreUnidadMedida.value, esGasProducto.value)) {
        return true
      }
      return Math.abs(value - Math.round(value)) < 1e-9
        ? true
        : this.createError({ message: `${etiquetaCampo}: ${MSG_STOCK_UNID_ENTERO}` })
    })

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idAlmacen: requiredSelect('El almacén'),
      idProducto: requiredSelect('El producto'),
      stock: cantidadSegunUnidad('La cantidad'),
      stockMinimo: cantidadSegunUnidad('El stock mínimo'),
    }),
  ),
  initialValues: {
    idAlmacen: '' as string | number,
    idProducto: '' as string | number,
    stock: 0,
    stockMinimo: 0,
  },
})

const [idAlmacen] = defineField('idAlmacen')
const [idProducto] = defineField('idProducto')
const [stockCantidad, stockCantidadAttrs] = defineField('stock')
const [stockMinimo, stockMinimoAttrs] = defineField('stockMinimo')

const syncFormValues = () => {
  resetForm({
    values: {
      idAlmacen: props.stock?.id_almacen ?? '',
      idProducto: props.stock?.id_producto ?? '',
      stock: props.stock?.stock ?? 0,
      stockMinimo: props.stock?.stock_minimo ?? 0,
    },
  })
  productoBuscar.value = ''
  if (props.mode === 'edit' && props.stock) {
    nombreUnidadMedida.value = props.stock.nombre_unidad_medida ?? null
  } else {
    nombreUnidadMedida.value = null
    esGasProducto.value = false
  }
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    if (props.mode === 'create') {
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

watch(
  () => [open.value, props.mode, idProducto.value] as const,
  async ([isOpen, mode, productoId]) => {
    if (!isOpen || mode !== 'create') return
    const id = Number(productoId)
    if (!Number.isFinite(id) || id <= 0) {
      nombreUnidadMedida.value = null
      esGasProducto.value = false
      return
    }
    try {
      const producto = await productosService.obtenerPorId(id)
      nombreUnidadMedida.value = producto.nombre_unidad_medida ?? null
      esGasProducto.value = Boolean(producto.es_gas)
    } catch {
      nombreUnidadMedida.value = null
      esGasProducto.value = false
    }
  },
)

watch(
  () => [open.value, props.mode, props.stock?.id_producto] as const,
  async ([isOpen, mode, productoId]) => {
    if (!isOpen || mode !== 'edit' || !productoId) return
    try {
      const producto = await productosService.obtenerPorId(Number(productoId))
      nombreUnidadMedida.value =
        producto.nombre_unidad_medida ?? props.stock?.nombre_unidad_medida ?? null
      esGasProducto.value = Boolean(producto.es_gas)
    } catch {
      esGasProducto.value = false
    }
  },
)
</script>

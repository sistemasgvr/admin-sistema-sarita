<template>
  <div>
    <div
      v-if="isLoadingMovimiento"
      class="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
    >
      Cargando movimiento...
    </div>

    <form
      v-else
      id="movimiento-inventario-form"
      class="space-y-5"
      autocomplete="off"
      @submit="onSubmit"
    >
      <FormCardsLayout>
        <DetailSectionCard
          title="Datos"
          :icon="ICONS.arrowLeftRight"
          :help="cardHelp"
        >
          <div
            v-if="mode === 'edit' && movimiento"
            class="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-800 dark:bg-white/[0.03] sm:grid-cols-3"
          >
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ formatListaOpcionLabel(movimiento.nombre_tipo_movimiento) }}
              · {{ formatCantidad(movimiento.cantidad) }}
            </p>
            <p class="text-gray-600 dark:text-gray-400">
              {{ movimiento.codigo_producto }} — {{ movimiento.nombre_producto }}
            </p>
            <p class="text-gray-500 dark:text-gray-400">
              {{ movimiento.nombre_almacen }}
            </p>
          </div>

          <div class="grid grid-cols-1 !gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AppInput
              v-model="fecha"
              label="Fecha"
              type="date"
              required
              v-bind="fechaAttrs"
              :disabled="isSubmitting"
              :error="errors.fecha"
            />

            <template v-if="mode === 'create'">
              <AlmacenSelectField
                v-model="idAlmacen"
                required
                :disabled="isSubmitting"
                :error="errors.idAlmacen"
              />

              <AppSelect
                v-model="idTipoMovimiento"
                label="Tipo de movimiento"
                placeholder="Selecciona tipo"
                required
                v-bind="idTipoMovimientoAttrs"
                :disabled="isSubmitting || tiposMovimientoQuery.isFetching.value"
                :error="errors.idTipoMovimiento"
                :options="tipoMovimientoOptions"
              />

              <ProductoSelectField
                v-model="idProducto"
                v-model:search="productoBuscar"
                label="Producto"
                placeholder="Selecciona un accesorio con stock"
                :afecta-stock="true"
                :es-servicio="false"
                :es-gas="false"
                required
                class="sm:col-span-2"
                :disabled="isSubmitting"
                :error="errors.idProducto"
                help="Solo accesorios. El gas se controla en Balones / Stock de gas."
              />

              <AppInput
                v-model="cantidad"
                label="Cantidad"
                type="number"
                :min="minCantidad"
                :step="stepCantidad"
                required
                v-bind="cantidadAttrs"
                :disabled="isSubmitting"
                :error="errors.cantidad"
                :hint="hintCantidad"
              />
            </template>

            <AppSelect
              v-model="idTipoDocumentoRef"
              label="Documento origen"
              placeholder="Opcional"
              optional
              :help="helpDocumentoOrigen"
              v-bind="idTipoDocumentoRefAttrs"
              :disabled="isSubmitting || tiposDocumentoQuery.isFetching.value"
              :options="tipoDocumentoOptions"
            />

            <AppInput
              v-model="idDocumentoRef"
              label="ID documento ref."
              type="number"
              min="1"
              step="1"
              optional
              placeholder="Opcional"
              v-bind="idDocumentoRefAttrs"
              :disabled="isSubmitting"
            />

            <AppInput
              v-model="glosa"
              label="Glosa"
              placeholder="Detalle del movimiento"
              optional
              v-bind="glosaAttrs"
              :disabled="isSubmitting"
            />
          </div>
        </DetailSectionCard>
      </FormCardsLayout>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="isSubmitting"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="isSubmitting"
        >
          {{
            isSubmitting
              ? 'Guardando...'
              : mode === 'create'
                ? 'Registrar movimiento'
                : 'Guardar cambios'
          }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import {
  useCreateMovimientoInventarioMutation,
  useUpdateMovimientoInventarioMutation,
} from '@/modules/productos/movimientos/composables/useMovimientoInventarioMutations'
import { useMovimientoInventarioQuery } from '@/modules/productos/movimientos/composables/useMovimientosInventarioQuery'
import type { MovimientoInventarioFormMode } from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'
import { AppInput, AppSelect } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import {
  formatCantidadPorUnidad,
  MSG_CANTIDAD_UNID_ENTERA,
  minCantidadPorUnidad,
  stepInputCantidadPorUnidad,
  unidadRequiereCantidadEntera,
} from '@/shared/utils/unidadMedidaCantidad'
import {
  optionalNumber,
  optionalString,
  requiredSelect,
  requiredString,
} from '@/shared/validation'

interface MovimientoInventarioFormProps {
  mode: MovimientoInventarioFormMode
  movimientoId?: number | null
  active?: boolean
  /** Prefill desde query (ej. Stock / Registrar movimiento) */
  initialIdProducto?: number | null
  initialIdAlmacen?: number | null
}

const props = withDefaults(defineProps<MovimientoInventarioFormProps>(), {
  movimientoId: null,
  active: true,
  initialIdProducto: null,
  initialIdAlmacen: null,
})

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const listaTipoMovId = ref(ListaIds.TIPO_MOV_INV)
const listaTipoDocId = ref(ListaIds.TIPO_DOCUMENTO_REF)
const tiposMovimientoQuery = useListaOpcionesQuery(listaTipoMovId)
const tiposDocumentoQuery = useListaOpcionesQuery(listaTipoDocId)

const createMutation = useCreateMovimientoInventarioMutation()
const updateMutation = useUpdateMovimientoInventarioMutation()

const movimientoIdRef = computed(() => props.movimientoId)
const editEnabled = computed(() => props.active && props.mode === 'edit' && !!props.movimientoId)
const movimientoQuery = useMovimientoInventarioQuery(movimientoIdRef, editEnabled)
const movimiento = computed(() => movimientoQuery.data.value ?? null)
const isLoadingMovimiento = computed(
  () => props.mode === 'edit' && movimientoQuery.isLoading.value,
)

const productoBuscar = ref('')
const nombreUnidadMedida = ref<string | null>(null)
const esGasProducto = ref(false)

const tipoMovimientoOptions = computed(() =>
  toSelectOptions(tiposMovimientoQuery.data.value),
)

const tipoDocumentoOptions = computed(() => [
  { value: '', label: 'Sin documento' },
  ...(tiposDocumentoQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: opcion.nombre,
  })),
])

const today = () => new Date().toISOString().slice(0, 10)

const formatCantidad = (value: unknown) =>
  formatCantidadPorUnidad(value, nombreUnidadMedida.value, esGasProducto.value)

const stepCantidad = computed(() =>
  stepInputCantidadPorUnidad(nombreUnidadMedida.value, esGasProducto.value),
)
const minCantidad = computed(() =>
  minCantidadPorUnidad(nombreUnidadMedida.value, esGasProducto.value),
)
const hintCantidad = computed(() =>
  unidadRequiereCantidadEntera(nombreUnidadMedida.value, esGasProducto.value)
    ? 'UNID / piezas: solo números enteros'
    : undefined,
)

const cardHelp = computed(() =>
  props.mode === 'edit'
    ? 'Almacén, producto, tipo y cantidad no se modifican. Solo fecha, documento de referencia y glosa.'
    : 'Ingresos, salidas o ajustes de accesorios en almacén. No aplica a gases.',
)

const helpDocumentoOrigen =
  'Opcional. Vincula el movimiento a un documento de origen si aplica.'

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      fecha: requiredString('La fecha'),
      idAlmacen: requiredSelect('El almacén'),
      idProducto: requiredSelect('El producto'),
      idTipoMovimiento: requiredSelect('El tipo de movimiento'),
      cantidad: yup
        .number()
        .transform((_value, originalValue) => {
          if (originalValue === '' || originalValue == null) return undefined
          const n = typeof originalValue === 'number' ? originalValue : Number(originalValue)
          return Number.isFinite(n) ? n : undefined
        })
        .typeError('La cantidad debe ser un número')
        .required('La cantidad es obligatoria')
        .moreThan(0, 'La cantidad debe ser mayor a cero')
        .test('unidad-entera', MSG_CANTIDAD_UNID_ENTERA, function (value) {
          if (value == null || !Number.isFinite(value)) return true
          if (!unidadRequiereCantidadEntera(nombreUnidadMedida.value, esGasProducto.value)) {
            return true
          }
          return Math.abs(value - Math.round(value)) < 1e-9
            ? true
            : this.createError({ message: MSG_CANTIDAD_UNID_ENTERA })
        }),
      idTipoDocumentoRef: yup
        .mixed<string | number>()
        .transform((value) => (value === '' ? undefined : value))
        .optional(),
      idDocumentoRef: optionalNumber().min(1, 'ID inválido'),
      glosa: optionalString(),
    }),
  ),
  initialValues: {
    fecha: today(),
    idAlmacen: '' as string | number,
    idProducto: '' as string | number,
    idTipoMovimiento: '' as string | number,
    cantidad: undefined as number | undefined,
    idTipoDocumentoRef: '' as string | number,
    idDocumentoRef: undefined as number | undefined,
    glosa: '',
  },
})

const [fecha, fechaAttrs] = defineField('fecha')
const [idAlmacen] = defineField('idAlmacen')
const [idProducto] = defineField('idProducto')
const [idTipoMovimiento, idTipoMovimientoAttrs] = defineField('idTipoMovimiento')
const [cantidad, cantidadAttrs] = defineField('cantidad')
const [idTipoDocumentoRef, idTipoDocumentoRefAttrs] = defineField('idTipoDocumentoRef')
const [idDocumentoRef, idDocumentoRefAttrs] = defineField('idDocumentoRef')
const [glosa, glosaAttrs] = defineField('glosa')

watch(
  () => [props.active, props.mode, idProducto.value] as const,
  async ([active, mode, productoId]) => {
    if (!active || mode !== 'create') return
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

const syncFormValues = () => {
  const data = movimiento.value
  resetForm({
    values: {
      fecha: data?.fecha?.slice(0, 10) ?? today(),
      // Hidden in edit; keep values so requiredSelect still validates on save.
      idAlmacen: data?.id_almacen ?? '',
      idProducto: data?.id_producto ?? '',
      idTipoMovimiento: data?.id_tipo_movimiento ?? '',
      cantidad: data?.cantidad ?? 1,
      idTipoDocumentoRef: data?.id_tipo_documento_ref ?? '',
      idDocumentoRef: data?.id_documento_ref ?? undefined,
      glosa: data?.glosa ?? '',
    },
  })
}

watch(
  () => [props.active, props.mode, movimiento.value?.id] as const,
  async ([active]) => {
    if (!active) return
    if (props.mode === 'create') {
      nombreUnidadMedida.value = null
      esGasProducto.value = false
      resetForm({
        values: {
          fecha: today(),
          idAlmacen: props.initialIdAlmacen ?? '',
          idProducto: props.initialIdProducto ?? '',
          idTipoMovimiento: '',
          cantidad: undefined,
          idTipoDocumentoRef: '',
          idDocumentoRef: undefined,
          glosa: '',
        },
      })
      return
    }
    if (movimiento.value) {
      syncFormValues()
      try {
        const producto = await productosService.obtenerPorId(movimiento.value.id_producto)
        nombreUnidadMedida.value = producto.nombre_unidad_medida ?? null
        esGasProducto.value = Boolean(producto.es_gas)
      } catch {
        nombreUnidadMedida.value = null
        esGasProducto.value = false
      }
    }
  },
  { immediate: true },
)

const onSubmit = handleSubmit(async (values) => {
  try {
    const tipoDocRef = values.idTipoDocumentoRef
      ? Number(values.idTipoDocumentoRef)
      : undefined

    if (props.mode === 'create') {
      await createMutation.mutateAsync({
        fecha: values.fecha,
        idAlmacen: Number(values.idAlmacen),
        idProducto: Number(values.idProducto),
        idTipoMovimiento: Number(values.idTipoMovimiento),
        cantidad: Number(values.cantidad),
        idDocumentoRef: values.idDocumentoRef ? Number(values.idDocumentoRef) : undefined,
        idTipoDocumentoRef: tipoDocRef,
        glosa: values.glosa || undefined,
      })
    } else if (props.movimientoId) {
      await updateMutation.mutateAsync({
        id: props.movimientoId,
        payload: {
          fecha: values.fecha,
          idDocumentoRef: values.idDocumentoRef ? Number(values.idDocumentoRef) : undefined,
          idTipoDocumentoRef: tipoDocRef,
          glosa: values.glosa || undefined,
        },
      })
    } else {
      return
    }

    emit('saved')
  } catch {
    // toast en mutation
  }
})
</script>

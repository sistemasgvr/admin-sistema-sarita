<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo movimiento' : 'Editar movimiento'"
    :subtitle="
      mode === 'create'
        ? 'Registra ingresos, salidas o ajustes que actualizan el stock.'
        : 'Solo puedes modificar fecha, documento de referencia y glosa.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="movimiento-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <div
        v-if="mode === 'edit' && movimiento"
        class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ movimiento.nombre_tipo_movimiento }} — {{ formatCantidad(movimiento.cantidad) }}
        </p>
        <p class="mt-1 text-gray-600 dark:text-gray-400">
          {{ movimiento.codigo_producto }} — {{ movimiento.nombre_producto }}
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          {{ movimiento.nombre_almacen }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <AppSelect
            v-model="idAlmacen"
            label="Almacén"
            placeholder="Selecciona almacén"
            required
            v-bind="idAlmacenAttrs"
            :disabled="isSubmitting"
            :error="errors.idAlmacen"
            :options="almacenOptions"
          />

          <AppSelect
            v-model="idProducto"
            label="Producto"
            placeholder="Selecciona producto"
            required
            v-bind="idProductoAttrs"
            :disabled="isSubmitting"
            :error="errors.idProducto"
            :options="productoOptions"
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

          <AppInput
            v-model="cantidad"
            label="Cantidad"
            type="number"
            min="0.0001"
            step="0.0001"
            required
            v-bind="cantidadAttrs"
            :disabled="isSubmitting"
            :error="errors.cantidad"
          />
        </template>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppSelect
          v-model="idTipoDocumentoRef"
          label="Documento origen"
          placeholder="Opcional"
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
          placeholder="Opcional"
          v-bind="idDocumentoRefAttrs"
          :disabled="isSubmitting"
        />
      </div>

      <AppInput
        v-model="glosa"
        label="Glosa"
        placeholder="Detalle del movimiento"
        v-bind="glosaAttrs"
        :disabled="isSubmitting"
      />
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
        form="movimiento-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Registrar movimiento' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import {
  useCreateMovimientoInventarioMutation,
  useUpdateMovimientoInventarioMutation,
} from '@/modules/productos/movimientos/composables/useMovimientoInventarioMutations'
import type {
  MovimientoInventario,
  MovimientoInventarioFormMode,
} from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'
import type { Almacen } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'

interface MovimientoFormModalProps {
  mode: MovimientoInventarioFormMode
  movimiento?: MovimientoInventario | null
  almacenes: Almacen[]
  productos: Producto[]
}

const props = defineProps<MovimientoFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const listaTipoMovId = ref(ListaIds.TIPO_MOV_INV)
const listaTipoDocId = ref(ListaIds.TIPO_DOCUMENTO_REF)
const tiposMovimientoQuery = useListaOpcionesQuery(listaTipoMovId)
const tiposDocumentoQuery = useListaOpcionesQuery(listaTipoDocId)

const createMutation = useCreateMovimientoInventarioMutation()
const updateMutation = useUpdateMovimientoInventarioMutation()

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

const tipoMovimientoOptions = computed(() =>
  (tiposMovimientoQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: opcion.nombre,
  })),
)

const tipoDocumentoOptions = computed(() => [
  { value: '', label: 'Sin documento' },
  ...(tiposDocumentoQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: opcion.nombre,
  })),
])

const today = () => new Date().toISOString().slice(0, 10)

const formatCantidad = (value: unknown) => {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0))
}

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      fecha: requiredString('La fecha'),
      idAlmacen: yup.number().optional(),
      idProducto: yup.number().optional(),
      idTipoMovimiento: yup.number().optional(),
      cantidad: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .optional()
        .min(0.0001, 'La cantidad debe ser mayor a cero'),
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
    idAlmacen: undefined as number | undefined,
    idProducto: undefined as number | undefined,
    idTipoMovimiento: undefined as number | undefined,
    cantidad: undefined as number | undefined,
    idTipoDocumentoRef: '' as string | number,
    idDocumentoRef: undefined as number | undefined,
    glosa: '',
  },
})

const [fecha, fechaAttrs] = defineField('fecha')
const [idAlmacen, idAlmacenAttrs] = defineField('idAlmacen')
const [idProducto, idProductoAttrs] = defineField('idProducto')
const [idTipoMovimiento, idTipoMovimientoAttrs] = defineField('idTipoMovimiento')
const [cantidad, cantidadAttrs] = defineField('cantidad')
const [idTipoDocumentoRef, idTipoDocumentoRefAttrs] = defineField('idTipoDocumentoRef')
const [idDocumentoRef, idDocumentoRefAttrs] = defineField('idDocumentoRef')
const [glosa, glosaAttrs] = defineField('glosa')

const syncFormValues = () => {
  resetForm({
    values: {
      fecha: props.movimiento?.fecha?.slice(0, 10) ?? today(),
      idAlmacen: undefined,
      idProducto: undefined,
      idTipoMovimiento: undefined,
      cantidad: undefined,
      idTipoDocumentoRef: props.movimiento?.id_tipo_documento_ref ?? '',
      idDocumentoRef: props.movimiento?.id_documento_ref ?? undefined,
      glosa: props.movimiento?.glosa ?? '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const tipoDocRef = values.idTipoDocumentoRef
      ? Number(values.idTipoDocumentoRef)
      : undefined

    if (props.mode === 'create') {
      if (!values.idAlmacen || !values.idProducto || !values.idTipoMovimiento || !values.cantidad) {
        return
      }

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
    } else if (props.movimiento) {
      await updateMutation.mutateAsync({
        id: props.movimiento.id,
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
  () => props.movimiento,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>

<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Agregar cilindro' : 'Editar cilindro'"
    :subtitle="
      mode === 'create'
        ? 'Registra un cilindro incluido en este préstamo.'
        : 'Actualiza los datos del cilindro en el préstamo.'
    "
    size="lg"
    @close="handleClose"
  >
    <div
      v-if="isLoadingDetalle"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando detalle...
    </div>

    <form
      v-else
      id="prestamo-detalle-form"
      autocomplete="off"
      @submit="onSubmit"
    >
      <FormCardsLayout>
        <DetailSectionCard title="Datos del cilindro" :icon="ICONS.cylinder">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PosBalonSelectField
              v-model="idBalonAsModel"
              mode="alquiler"
              :id-almacen="idAlmacenPrestamo"
              :extra-filters="extraFiltersProductoGas"
              label="Cilindro"
              placeholder="Selecciona cilindro"
              hint="Al agregarlo sale del almacén (prestado). Solo cilindros del gas elegido, o todos si aún no hay gas."
              :disabled="isSubmitting || detalleYaDevuelto"
              empty-text="Sin cilindros de empresa en almacén para este filtro."
            />

            <ProductoSelectField
              v-model="idProducto"
              label="Producto (gas)"
              placeholder="Opcional"
              :es-gas="true"
              :disabled="isSubmitting || Boolean(idBalonAsModel)"
              hint="Si eliges un cilindro, el gas queda fijado al del Libro."
            />

            <AppInput
              v-model="motivoEspecifico"
              label="Motivo específico"
              placeholder="Motivo del préstamo de este cilindro"
              class="sm:col-span-2"
              v-bind="motivoEspecificoAttrs"
              :disabled="isSubmitting"
              :error="errors.motivoEspecifico"
            />

          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Fechas" :icon="ICONS.calendar">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppInput
              v-model="fechaEntregado"
              label="Fecha entregado"
              type="date"
              v-bind="fechaEntregadoAttrs"
              :disabled="isSubmitting"
            />

            <AppInput
              v-model="fechaPrestamo"
              label="Fecha préstamo"
              type="date"
              v-bind="fechaPrestamoAttrs"
              :disabled="isSubmitting"
            />

            <AppInput
              v-model="diasPrestamo"
              label="Días de préstamo"
              type="number"
              min="0"
              step="1"
              v-bind="diasPrestamoAttrs"
              :disabled="isSubmitting"
              :error="errors.diasPrestamo"
            />

            <AppInput
              v-model="fechaVencimiento"
              label="Fecha vencimiento"
              type="date"
              v-bind="fechaVencimientoAttrs"
              :disabled="isSubmitting"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Guías de remisión" :icon="ICONS.clipboardList">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppInput
              v-model="serieGuiaEntrega"
              label="Serie GRE entrega"
              placeholder="T001"
              v-bind="serieGuiaEntregaAttrs"
              :disabled="isSubmitting"
              :error="errors.serieGuiaEntrega"
            />
            <AppInput
              v-model="numeroGuiaEntrega"
              label="Número GRE entrega"
              placeholder="00000001"
              v-bind="numeroGuiaEntregaAttrs"
              :disabled="isSubmitting"
              :error="errors.numeroGuiaEntrega"
            />
            <AppInput
              v-model="serieGuiaDevolucion"
              label="Serie GRE devolución"
              placeholder="T001"
              v-bind="serieGuiaDevolucionAttrs"
              :disabled="isSubmitting"
              :error="errors.serieGuiaDevolucion"
            />
            <AppInput
              v-model="numeroGuiaDevolucion"
              label="Número GRE devolución"
              placeholder="00000002"
              v-bind="numeroGuiaDevolucionAttrs"
              :disabled="isSubmitting"
              :error="errors.numeroGuiaDevolucion"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Observación" :icon="ICONS.messageSquare" :full-width="true">
          <AppTextarea
            v-model="observacion"
            label="Observación"
            placeholder="Notas adicionales"
            :rows="3"
            v-bind="observacionAttrs"
            :disabled="isSubmitting"
            :error="errors.observacion"
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
        form="prestamo-detalle-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{
          isSubmitting
            ? 'Guardando...'
            : mode === 'create'
              ? 'Agregar cilindro'
              : 'Guardar cambios'
        }}
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
  useCreatePrestamoDetalleMutation,
  useUpdatePrestamoDetalleMutation,
} from '@/modules/balones/prestamos/composables/usePrestamoDetalleMutations'
import { usePrestamoDetalleQuery } from '@/modules/balones/prestamos/composables/usePrestamosDetalleQuery'
import { usePrestamoQuery } from '@/modules/balones/prestamos/composables/usePrestamosQuery'
import { useBalonQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import type { PrestamoDetalleFormMode } from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppTextarea } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { optionalNumber, optionalString } from '@/shared/validation'

interface PrestamoDetalleFormModalProps {
  mode: PrestamoDetalleFormMode
  prestamoId: number
  detalleId?: number | null
}

const props = defineProps<PrestamoDetalleFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreatePrestamoDetalleMutation()
const updateMutation = useUpdatePrestamoDetalleMutation()

const detalleIdRef = computed(() => (props.mode === 'edit' ? props.detalleId : null))
const detalleQuery = usePrestamoDetalleQuery(detalleIdRef)
const prestamoQuery = usePrestamoQuery(computed(() => props.prestamoId))
const idAlmacenPrestamo = computed(() => prestamoQuery.data.value?.id_almacen ?? '')
const extraFiltersProductoGas = computed(() => {
  const id = Number(idProducto.value)
  return Number.isFinite(id) && id > 0 ? { idProductoGas: id } : undefined
})
const isLoadingDetalle = computed(
  () => props.mode === 'edit' && open.value && detalleQuery.isFetching.value,
)

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')
const detalleYaDevuelto = computed(() => Boolean(detalleQuery.data.value?.fecha_devolucion))

const optionalSelectNumber = () =>
  yup
    .mixed<string | number>()
    .transform((value) => (value === '' ? undefined : value))
    .optional()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idBalon: optionalSelectNumber(),
      idProducto: optionalSelectNumber(),
      motivoEspecifico: optionalString().max(255, 'Máximo 255 caracteres'),
      fechaEntregado: optionalString(),
      fechaPrestamo: optionalString(),
      diasPrestamo: optionalNumber().min(0, 'Debe ser mayor o igual a cero'),
      fechaVencimiento: optionalString(),
      serieGuiaEntrega: optionalString().max(10, 'Máximo 10 caracteres'),
      numeroGuiaEntrega: optionalString().max(15, 'Máximo 15 caracteres'),
      serieGuiaDevolucion: optionalString().max(10, 'Máximo 10 caracteres'),
      numeroGuiaDevolucion: optionalString().max(15, 'Máximo 15 caracteres'),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
    }),
  ),
  initialValues: {
    idBalon: '' as string | number,
    idProducto: '' as string | number,
    motivoEspecifico: '',
    fechaEntregado: '',
    fechaPrestamo: '',
    diasPrestamo: undefined as number | undefined,
    fechaVencimiento: '',
    serieGuiaEntrega: '',
    numeroGuiaEntrega: '',
    serieGuiaDevolucion: '',
    numeroGuiaDevolucion: '',
    observacion: '',
  },
})

const [idBalon] = defineField('idBalon')
const [idProducto] = defineField('idProducto')

const idBalonAsModel = computed({
  get: () => (idBalon.value === '' || idBalon.value == null ? '' : Number(idBalon.value)),
  set: (value: number | '') => {
    idBalon.value = value === '' ? '' : value
  },
})
const [motivoEspecifico, motivoEspecificoAttrs] = defineField('motivoEspecifico')
const [fechaEntregado, fechaEntregadoAttrs] = defineField('fechaEntregado')
const [fechaPrestamo, fechaPrestamoAttrs] = defineField('fechaPrestamo')
const [diasPrestamo, diasPrestamoAttrs] = defineField('diasPrestamo')
const [fechaVencimiento, fechaVencimientoAttrs] = defineField('fechaVencimiento')
const [serieGuiaEntrega, serieGuiaEntregaAttrs] = defineField('serieGuiaEntrega')
const [numeroGuiaEntrega, numeroGuiaEntregaAttrs] = defineField('numeroGuiaEntrega')
const [serieGuiaDevolucion, serieGuiaDevolucionAttrs] = defineField('serieGuiaDevolucion')
const [numeroGuiaDevolucion, numeroGuiaDevolucionAttrs] = defineField('numeroGuiaDevolucion')
const [observacion, observacionAttrs] = defineField('observacion')

const balonSeleccionadoId = computed(() =>
  idBalon.value === '' || idBalon.value == null ? null : Number(idBalon.value),
)
const balonQuery = useBalonQuery(balonSeleccionadoId)

watch(
  () => balonQuery.data.value?.id_producto_gas,
  (gasId) => {
    if (gasId) idProducto.value = gasId
  },
)

const toOptionalNumber = (value: string | number | undefined) =>
  value !== '' && value != null ? Number(value) : undefined

const buildPayloadFields = (values: {
  idBalon?: string | number
  idProducto?: string | number
  motivoEspecifico?: string
  fechaEntregado?: string
  fechaPrestamo?: string
  diasPrestamo?: number
  fechaVencimiento?: string
  serieGuiaEntrega?: string
  numeroGuiaEntrega?: string
  serieGuiaDevolucion?: string
  numeroGuiaDevolucion?: string
  observacion?: string
}) => ({
  idBalon: toOptionalNumber(values.idBalon),
  idProducto: toOptionalNumber(values.idProducto),
  motivoEspecifico: values.motivoEspecifico || undefined,
  fechaEntregado: values.fechaEntregado || undefined,
  fechaPrestamo: values.fechaPrestamo || undefined,
  diasPrestamo: values.diasPrestamo,
  fechaVencimiento: values.fechaVencimiento || undefined,
  serieGuiaEntrega: values.serieGuiaEntrega || undefined,
  numeroGuiaEntrega: values.numeroGuiaEntrega || undefined,
  serieGuiaDevolucion: values.serieGuiaDevolucion || undefined,
  numeroGuiaDevolucion: values.numeroGuiaDevolucion || undefined,
  observacion: values.observacion || undefined,
})

const syncFormValues = () => {
  const data = detalleQuery.data.value
  resetForm({
    values: {
      idBalon: data?.id_balon ?? '',
      idProducto: data?.id_producto ?? '',
      motivoEspecifico: data?.motivo_especifico ?? '',
      fechaEntregado: toDateInput(data?.fecha_entregado),
      fechaPrestamo: toDateInput(data?.fecha_prestamo),
      diasPrestamo: data?.dias_prestamo ?? undefined,
      fechaVencimiento: toDateInput(data?.fecha_vencimiento),
      serieGuiaEntrega: data?.serie_guia_entrega ?? '',
      numeroGuiaEntrega: data?.numero_guia_entrega ?? '',
      serieGuiaDevolucion: data?.serie_guia_devolucion ?? '',
      numeroGuiaDevolucion: data?.numero_guia_devolucion ?? '',
      observacion: data?.observacion ?? '',
    },
  })
}

const resetCreateForm = () => {
  resetForm({
    values: {
      idBalon: '',
      idProducto: '',
      motivoEspecifico: '',
      fechaEntregado: '',
      fechaPrestamo: '',
      diasPrestamo: undefined,
      fechaVencimiento: '',
      serieGuiaEntrega: '',
      numeroGuiaEntrega: '',
      serieGuiaDevolucion: '',
      numeroGuiaDevolucion: '',
      observacion: '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  const fields = buildPayloadFields(values)

  try {
    if (props.mode === 'create') {
      await createMutation.mutateAsync({
        idUsuarioAuditoria: currentUserId,
        idPrestamo: props.prestamoId,
        ...fields,
      })
    } else if (props.detalleId) {
      await updateMutation.mutateAsync({
        id: props.detalleId,
        payload: {
          idUsuarioAuditoria: currentUserId,
          ...fields,
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
  () => [open.value, props.mode, props.detalleId] as const,
  ([isOpen, mode]) => {
    if (!isOpen) return
    if (mode === 'edit') {
      syncFormValues()
    } else {
      resetCreateForm()
    }
  },
  { immediate: true },
)

watch(
  () => detalleQuery.data.value,
  () => {
    if (open.value && props.mode === 'edit') {
      syncFormValues()
    }
  },
)
</script>

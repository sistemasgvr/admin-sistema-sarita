<template>
  <AppModal
    v-model="open"
    :title="isCreateMode ? 'Nuevo préstamo' : 'Editar préstamo'"
    :subtitle="
      isCreateMode
        ? 'Registra la cabecera del préstamo. Luego podrás agregar cilindros.'
        : 'Actualiza los datos del préstamo y gestiona los cilindros incluidos.'
    "
    size="xl"
    @close="handleClose"
  >
    <div
      v-if="isLoadingPrestamo"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando préstamo...
    </div>

    <div v-else class="space-y-4">
      <form
        id="prestamo-form"
        autocomplete="off"
        @submit="onSubmit"
      >
        <FormCardsLayout>
          <DetailSectionCard title="Datos generales" :icon="ICONS.clipboardList">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppSelect
                v-model="idTipoPrestamo"
                label="Tipo de préstamo"
                placeholder="Selecciona tipo"
                required
                v-bind="idTipoPrestamoAttrs"
                :disabled="isSubmitting || tiposPrestamoQuery.isFetching.value"
                :error="errors.idTipoPrestamo"
                :options="tipoPrestamoOptions"
              />

              <AppInput
                v-model="numeroPrestamo"
                label="Número de préstamo"
                placeholder="Opcional"
                v-bind="numeroPrestamoAttrs"
                :disabled="isSubmitting"
                :error="errors.numeroPrestamo"
              />

              <AppInput
                v-model="titulo"
                label="Título"
                placeholder="Referencia o descripción breve"
                class="sm:col-span-2"
                v-bind="tituloAttrs"
                :disabled="isSubmitting"
                :error="errors.titulo"
              />

              <AppSelect
                v-model="idEstado"
                label="Estado"
                placeholder="Opcional"
                v-bind="idEstadoAttrs"
                :disabled="isSubmitting || estadosPrestamoQuery.isFetching.value"
                :options="estadoPrestamoOptions"
              />

              <AppSelect
                v-model="idAlmacen"
                label="Almacén"
                placeholder="Opcional"
                v-bind="idAlmacenAttrs"
                :disabled="isSubmitting || almacenesQuery.isLoading.value"
                :options="almacenOptions"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Partes involucradas" :icon="ICONS.users">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppSelect
                v-model="idCliente"
                label="Cliente"
                placeholder="Opcional"
                v-bind="idClienteAttrs"
                :disabled="isSubmitting || clientesQuery.isLoading.value"
                :options="clienteOptions"
              />

              <AppSelect
                v-model="idProveedor"
                label="Proveedor / tercero"
                placeholder="Opcional"
                v-bind="idProveedorAttrs"
                :disabled="isSubmitting || clientesQuery.isLoading.value"
                :options="clienteOptions"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Fechas" :icon="ICONS.calendar">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <AppInput
                v-model="fechaSalida"
                label="Fecha salida"
                type="date"
                v-bind="fechaSalidaAttrs"
                :disabled="isSubmitting"
              />

              <AppInput
                v-model="fechaRetornoPactada"
                label="Retorno pactado"
                type="date"
                v-bind="fechaRetornoPactadaAttrs"
                :disabled="isSubmitting"
              />

              <AppInput
                v-model="fechaRetornoReal"
                label="Retorno real"
                type="date"
                v-bind="fechaRetornoRealAttrs"
                :disabled="isSubmitting"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Comprobantes" :icon="ICONS.creditCard">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppInput
                v-model="idComprobanteVenta"
                label="ID comprobante venta"
                type="number"
                min="1"
                step="1"
                placeholder="Opcional"
                v-bind="idComprobanteVentaAttrs"
                :disabled="isSubmitting"
              />

              <AppInput
                v-model="idComprobanteCompra"
                label="ID comprobante compra"
                type="number"
                min="1"
                step="1"
                placeholder="Opcional"
                v-bind="idComprobanteCompraAttrs"
                :disabled="isSubmitting"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Observación" :icon="ICONS.messageSquare" :full-width="true">
            <AppTextarea
              v-model="observacion"
              label="Observación"
              placeholder="Notas adicionales del préstamo"
              :rows="3"
              v-bind="observacionAttrs"
              :disabled="isSubmitting"
              :error="errors.observacion"
            />
          </DetailSectionCard>
        </FormCardsLayout>
      </form>

      <DetailSectionCard
        v-if="activePrestamoId"
        title="Cilindros del préstamo"
        :icon="ICONS.boxes"
        :full-width="true"
      >
        <template #actions>
          <button
            v-if="canCreateDetalle"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-brand-500 px-3 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
            @click="openCreateDetalleModal"
          >
            <AppIcon :name="ICONS.plus" :size="16" />
            Agregar cilindro
          </button>
        </template>

        <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
          {{ detalleRows.length }} cilindro(s) registrado(s)
        </p>

        <AppTable
          bare
          :columns="detalleColumns"
          :rows="detalleRows"
          row-key="id"
          :loading="isLoadingDetalles"
        >
          <template #cell-codigo_balon="{ value }">
            <span v-if="value" class="font-medium text-gray-800 dark:text-white/90">{{ value }}</span>
            <span v-else class="text-gray-400">—</span>
          </template>

          <template #cell-fecha_prestamo="{ value }">
            <span class="whitespace-nowrap">{{ formatCellDate(value as string) }}</span>
          </template>

          <template #cell-fecha_vencimiento="{ value }">
            <span class="whitespace-nowrap">{{ formatCellDate(value as string) }}</span>
          </template>

          <template #cell-fecha_devolucion="{ value }">
            <span class="whitespace-nowrap">{{ formatCellDate(value as string) }}</span>
          </template>

          <template #cell-nombre_estado="{ value }">
            <span v-if="value">{{ value }}</span>
            <span v-else class="text-gray-400">—</span>
          </template>

          <template #actions="{ row }">
            <button
              v-if="canEditDetalle"
              type="button"
              title="Editar"
              class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
              @click="openEditDetalleModal(row)"
            >
              <AppIcon :name="ICONS.pencil" :size="16" />
            </button>

            <button
              v-if="canDeleteDetalle"
              type="button"
              title="Eliminar"
              class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
              @click="openDeleteDetalleModal(row)"
            >
              <AppIcon :name="ICONS.trash" :size="16" />
            </button>
          </template>
        </AppTable>
      </DetailSectionCard>

      <DetailSectionCard
        v-else-if="isCreateMode"
        title="Cilindros del préstamo"
        :icon="ICONS.boxes"
        :full-width="true"
      >
        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          Guarda el préstamo para poder agregar cilindros.
        </p>
      </DetailSectionCard>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        {{ activePrestamoId ? 'Cerrar' : 'Cancelar' }}
      </button>
      <button
        type="submit"
        form="prestamo-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{
          isSubmitting
            ? 'Guardando...'
            : isCreateMode && !activePrestamoId
              ? 'Crear préstamo'
              : 'Guardar cambios'
        }}
      </button>
    </template>

    <PrestamoDetalleFormModal
      v-if="activePrestamoId"
      v-model="detalleFormOpen"
      :mode="detalleFormMode"
      :prestamo-id="activePrestamoId"
      :detalle-id="selectedDetalleId"
      @saved="onDetalleSaved"
    />

    <AppModal
      v-model="deleteDetalleModalOpen"
      title="Eliminar cilindro"
      subtitle="Se dará de baja este cilindro del préstamo."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ detalleToDelete?.codigo_balon || 'sin código' }}
        </span>
        del préstamo?
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="deleteDetalleMutation.isPending.value"
          @click="deleteDetalleModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="deleteDetalleMutation.isPending.value"
          @click="confirmDeleteDetalle"
        >
          {{ deleteDetalleMutation.isPending.value ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </AppModal>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import {
  useCreatePrestamoMutation,
  useUpdatePrestamoMutation,
} from '@/modules/balones/prestamos/composables/usePrestamoMutations'
import { useDeletePrestamoDetalleMutation } from '@/modules/balones/prestamos/composables/usePrestamoDetalleMutations'
import { usePrestamoQuery } from '@/modules/balones/prestamos/composables/usePrestamosQuery'
import { usePrestamosDetalleQuery } from '@/modules/balones/prestamos/composables/usePrestamosDetalleQuery'
import PrestamoDetalleFormModal from '@/modules/balones/prestamos/components/PrestamoDetalleFormModal.vue'
import type { PrestamoFormMode } from '@/modules/balones/prestamos/interfaces/prestamo.interface'
import type {
  PrestamoDetalle,
  PrestamoDetalleFormMode,
  PrestamoDetalleListFilters,
} from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppTable, AppTextarea } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { optionalNumber, optionalString, requiredSelect } from '@/shared/validation'

interface PrestamoFormModalProps {
  mode: PrestamoFormMode
  prestamoId?: number | null
}

const props = defineProps<PrestamoFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreatePrestamoMutation()
const updateMutation = useUpdatePrestamoMutation()
const deleteDetalleMutation = useDeletePrestamoDetalleMutation()

const internalMode = ref<PrestamoFormMode>(props.mode)
const activePrestamoId = ref<number | null>(null)

const isCreateMode = computed(() => internalMode.value === 'create' && !activePrestamoId.value)

const prestamoIdRef = computed(() => activePrestamoId.value)
const prestamoQuery = usePrestamoQuery(prestamoIdRef)
const isLoadingPrestamo = computed(
  () => !isCreateMode.value && open.value && prestamoQuery.isFetching.value,
)

const detalleFilters = ref<PrestamoDetalleListFilters>({
  idPrestamo: undefined,
  pagina: 1,
  limite: 100,
})
const detallesQuery = usePrestamosDetalleQuery(detalleFilters)
const isLoadingDetalles = computed(
  () => detallesQuery.isFetching.value || detallesQuery.isLoading.value,
)
const detalleRows = computed(() => detallesQuery.data.value?.data ?? [])

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const listaTipoPrestamoId = ref(ListaIds.TIPO_PRESTAMO)
const listaEstadoPrestamoId = ref(ListaIds.ESTADO_PRESTAMO)
const tiposPrestamoQuery = useListaOpcionesQuery(listaTipoPrestamoId)
const estadosPrestamoQuery = useListaOpcionesQuery(listaEstadoPrestamoId)

const tipoPrestamoOptions = computed(() => toSelectOptions(tiposPrestamoQuery.data.value))

const estadoPrestamoOptions = computed(() => [
  { value: '', label: 'Sin estado' },
  ...toSelectOptions(estadosPrestamoQuery.data.value),
])

const almacenOptions = computed(() => [
  { value: '', label: 'Sin almacén' },
  ...(almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
])

const clienteOptions = computed(() => [
  { value: '', label: 'Sin selección' },
  ...(clientesQuery.data.value?.data ?? []).map((cliente) => ({
    value: cliente.id,
    label:
      cliente.razon_social ||
      [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
      cliente.numero_documento,
  })),
])

const canCreateDetalle = computed(() =>
  authStore.hasPermission(PermisoBanderas.PRESTAMOS_DETALLE_CREAR),
)
const canEditDetalle = computed(() =>
  authStore.hasPermission(PermisoBanderas.PRESTAMOS_DETALLE_EDITAR),
)
const canDeleteDetalle = computed(() =>
  authStore.hasPermission(PermisoBanderas.PRESTAMOS_DETALLE_ELIMINAR),
)

const detalleColumns: TableColumn[] = [
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'nombre_producto', label: 'Gas' },
  { key: 'fecha_prestamo', label: 'Préstamo' },
  { key: 'fecha_vencimiento', label: 'Vencimiento' },
  { key: 'fecha_devolucion', label: 'Devolución' },
  { key: 'nombre_estado', label: 'Estado' },
]

const detalleFormOpen = ref(false)
const detalleFormMode = ref<PrestamoDetalleFormMode>('create')
const selectedDetalleId = ref<number | null>(null)

const deleteDetalleModalOpen = ref(false)
const detalleToDelete = ref<PrestamoDetalle | null>(null)

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')

const formatCellDate = (value?: string | null) => {
  if (!value) return '—'
  const date = value.slice(0, 10)
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return date
  return `${day}/${month}/${year}`
}

const optionalSelectNumber = () =>
  yup
    .mixed<string | number>()
    .transform((value) => (value === '' ? undefined : value))
    .optional()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idTipoPrestamo: requiredSelect('El tipo de préstamo'),
      numeroPrestamo: optionalString().max(30, 'Máximo 30 caracteres'),
      titulo: optionalString().max(200, 'Máximo 200 caracteres'),
      idEstado: optionalSelectNumber(),
      idAlmacen: optionalSelectNumber(),
      idCliente: optionalSelectNumber(),
      idProveedor: optionalSelectNumber(),
      fechaSalida: optionalString(),
      fechaRetornoPactada: optionalString(),
      fechaRetornoReal: optionalString(),
      idComprobanteVenta: optionalNumber().min(1, 'ID inválido'),
      idComprobanteCompra: optionalNumber().min(1, 'ID inválido'),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
    }),
  ),
  initialValues: {
    idTipoPrestamo: '' as string | number,
    numeroPrestamo: '',
    titulo: '',
    idEstado: '' as string | number,
    idAlmacen: '' as string | number,
    idCliente: '' as string | number,
    idProveedor: '' as string | number,
    fechaSalida: '',
    fechaRetornoPactada: '',
    fechaRetornoReal: '',
    idComprobanteVenta: undefined as number | undefined,
    idComprobanteCompra: undefined as number | undefined,
    observacion: '',
  },
})

const [idTipoPrestamo, idTipoPrestamoAttrs] = defineField('idTipoPrestamo')
const [numeroPrestamo, numeroPrestamoAttrs] = defineField('numeroPrestamo')
const [titulo, tituloAttrs] = defineField('titulo')
const [idEstado, idEstadoAttrs] = defineField('idEstado')
const [idAlmacen, idAlmacenAttrs] = defineField('idAlmacen')
const [idCliente, idClienteAttrs] = defineField('idCliente')
const [idProveedor, idProveedorAttrs] = defineField('idProveedor')
const [fechaSalida, fechaSalidaAttrs] = defineField('fechaSalida')
const [fechaRetornoPactada, fechaRetornoPactadaAttrs] = defineField('fechaRetornoPactada')
const [fechaRetornoReal, fechaRetornoRealAttrs] = defineField('fechaRetornoReal')
const [idComprobanteVenta, idComprobanteVentaAttrs] = defineField('idComprobanteVenta')
const [idComprobanteCompra, idComprobanteCompraAttrs] = defineField('idComprobanteCompra')
const [observacion, observacionAttrs] = defineField('observacion')

const toOptionalNumber = (value: string | number | undefined) =>
  value !== '' && value != null ? Number(value) : undefined

const buildPayloadFields = (values: {
  idTipoPrestamo?: string | number
  numeroPrestamo?: string
  titulo?: string
  idEstado?: string | number
  idAlmacen?: string | number
  idCliente?: string | number
  idProveedor?: string | number
  fechaSalida?: string
  fechaRetornoPactada?: string
  fechaRetornoReal?: string
  idComprobanteVenta?: number
  idComprobanteCompra?: number
  observacion?: string
}) => ({
  idTipoPrestamo: toOptionalNumber(values.idTipoPrestamo),
  numeroPrestamo: values.numeroPrestamo || undefined,
  titulo: values.titulo || undefined,
  idEstado: toOptionalNumber(values.idEstado),
  idAlmacen: toOptionalNumber(values.idAlmacen),
  idCliente: toOptionalNumber(values.idCliente),
  idProveedor: toOptionalNumber(values.idProveedor),
  fechaSalida: values.fechaSalida || undefined,
  fechaRetornoPactada: values.fechaRetornoPactada || undefined,
  fechaRetornoReal: values.fechaRetornoReal || undefined,
  idComprobanteVenta: values.idComprobanteVenta ? Number(values.idComprobanteVenta) : undefined,
  idComprobanteCompra: values.idComprobanteCompra ? Number(values.idComprobanteCompra) : undefined,
  observacion: values.observacion || undefined,
})

const syncFormValues = () => {
  const data = prestamoQuery.data.value
  resetForm({
    values: {
      idTipoPrestamo: data?.id_tipo_prestamo ?? '',
      numeroPrestamo: data?.numero_prestamo ?? '',
      titulo: data?.titulo ?? '',
      idEstado: data?.id_estado ?? '',
      idAlmacen: data?.id_almacen ?? '',
      idCliente: data?.id_cliente ?? '',
      idProveedor: data?.id_proveedor ?? '',
      fechaSalida: toDateInput(data?.fecha_salida),
      fechaRetornoPactada: toDateInput(data?.fecha_retorno_pactada),
      fechaRetornoReal: toDateInput(data?.fecha_retorno_real),
      idComprobanteVenta: data?.id_comprobante_venta ?? undefined,
      idComprobanteCompra: data?.id_comprobante_compra ?? undefined,
      observacion: data?.observacion ?? '',
    },
  })
}

const resetCreateForm = () => {
  resetForm({
    values: {
      idTipoPrestamo: '',
      numeroPrestamo: '',
      titulo: '',
      idEstado: '',
      idAlmacen: '',
      idCliente: '',
      idProveedor: '',
      fechaSalida: '',
      fechaRetornoPactada: '',
      fechaRetornoReal: '',
      idComprobanteVenta: undefined,
      idComprobanteCompra: undefined,
      observacion: '',
    },
  })
}

const resetModalState = () => {
  internalMode.value = props.mode
  activePrestamoId.value = props.mode === 'edit' && props.prestamoId ? props.prestamoId : null
  detalleFilters.value = {
    idPrestamo: activePrestamoId.value ?? undefined,
    pagina: 1,
    limite: 100,
  }
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  const fields = buildPayloadFields(values)

  try {
    if (isCreateMode.value) {
      const tipoPrestamo = toOptionalNumber(values.idTipoPrestamo)
      if (!tipoPrestamo) return

      const created = await createMutation.mutateAsync({
        ...fields,
        idUsuarioAuditoria: currentUserId,
        idTipoPrestamo: tipoPrestamo,
      })

      activePrestamoId.value = created.id
      internalMode.value = 'edit'
      detalleFilters.value = {
        idPrestamo: created.id,
        pagina: 1,
        limite: 100,
      }
      emit('saved')
    } else if (activePrestamoId.value) {
      await updateMutation.mutateAsync({
        id: activePrestamoId.value,
        payload: {
          idUsuarioAuditoria: currentUserId,
          ...fields,
        },
      })
      emit('saved')
    } else {
      return
    }
  } catch {
    // toast en mutation
  }
})

const openCreateDetalleModal = () => {
  detalleFormMode.value = 'create'
  selectedDetalleId.value = null
  detalleFormOpen.value = true
}

const openEditDetalleModal = (row: PrestamoDetalle) => {
  detalleFormMode.value = 'edit'
  selectedDetalleId.value = row.id
  detalleFormOpen.value = true
}

const openDeleteDetalleModal = (row: PrestamoDetalle) => {
  detalleToDelete.value = row
  deleteDetalleModalOpen.value = true
}

const onDetalleSaved = () => {
  detallesQuery.refetch()
  prestamoQuery.refetch()
  emit('saved')
}

const confirmDeleteDetalle = async () => {
  const detalle = detalleToDelete.value
  const userId = authStore.user?.id
  if (!detalle || !userId) return

  try {
    await deleteDetalleMutation.mutateAsync({
      id: detalle.id,
      idUsuarioAuditoria: userId,
    })
    deleteDetalleModalOpen.value = false
    detalleToDelete.value = null
    onDetalleSaved()
  } catch {
    // toast en mutation
  }
}

watch(
  () => [open.value, props.mode, props.prestamoId] as const,
  ([isOpen, mode, prestamoId]) => {
    if (!isOpen) return
    resetModalState()
    if (mode === 'edit' && prestamoId) {
      syncFormValues()
    } else {
      resetCreateForm()
    }
  },
  { immediate: true },
)

watch(
  () => prestamoQuery.data.value,
  () => {
    if (open.value && activePrestamoId.value) {
      syncFormValues()
    }
  },
)
</script>

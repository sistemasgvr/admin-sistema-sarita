<template>
  <AppModal
    v-model="open"
    :title="isCreateMode ? 'Nuevo alquiler' : 'Editar alquiler'"
    :subtitle="
      isCreateMode
        ? 'Registra la cabecera del alquiler. Luego podrás agregar cilindros.'
        : 'Actualiza los datos del alquiler y gestiona los cilindros incluidos.'
    "
    size="xl"
    @close="handleClose"
  >
    <div
      v-if="isLoadingAlquiler"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando alquiler...
    </div>

    <div v-else class="space-y-6">
      <form
        id="alquiler-form"
        class="space-y-6"
        autocomplete="off"
        @submit="onSubmit"
      >
        <div class="space-y-4">
          <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Datos generales</h5>
          <div class="grid gap-4 sm:grid-cols-2">
            <AppInput
              v-model="numeroAlquiler"
              label="Número de alquiler"
              placeholder="Ej. ALQ-2026-001"
              required
              v-bind="numeroAlquilerAttrs"
              :disabled="isSubmitting"
              :error="errors.numeroAlquiler"
            />

            <AppSelect
              v-model="idEstado"
              label="Estado"
              placeholder="Opcional"
              v-bind="idEstadoAttrs"
              :disabled="isSubmitting || estadosAlquilerQuery.isFetching.value"
              :options="estadoAlquilerOptions"
            />

            <AppSelect
              v-model="idCliente"
              label="Cliente"
              placeholder="Selecciona cliente"
              required
              v-bind="idClienteAttrs"
              :disabled="isSubmitting || clientesQuery.isLoading.value"
              :error="errors.idCliente"
              :options="clienteOptions"
            />

            <AppSelect
              v-model="idAlmacen"
              label="Almacén"
              placeholder="Selecciona almacén"
              required
              v-bind="idAlmacenAttrs"
              :disabled="isSubmitting || almacenesQuery.isLoading.value"
              :error="errors.idAlmacen"
              :options="almacenOptions"
            />
          </div>
        </div>

        <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
          <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Vigencia</h5>
          <div class="grid gap-4 sm:grid-cols-3">
            <AppInput
              v-model="fechaInicio"
              label="Fecha inicio"
              type="date"
              required
              v-bind="fechaInicioAttrs"
              :disabled="isSubmitting"
              :error="errors.fechaInicio"
            />

            <AppInput
              v-model="fechaFinPactada"
              label="Fin pactado"
              type="date"
              v-bind="fechaFinPactadaAttrs"
              :disabled="isSubmitting"
            />

            <AppInput
              v-model="fechaFinReal"
              label="Fin real"
              type="date"
              v-bind="fechaFinRealAttrs"
              :disabled="isSubmitting"
            />
          </div>
        </div>

        <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
          <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Cobro</h5>
          <div class="grid gap-4 sm:grid-cols-3">
            <AppInput
              v-model="tarifaDiaria"
              label="Tarifa diaria"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              v-bind="tarifaDiariaAttrs"
              :disabled="isSubmitting"
              :error="errors.tarifaDiaria"
            />

            <AppInput
              v-model="totalCobrado"
              label="Total cobrado"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              v-bind="totalCobradoAttrs"
              :disabled="isSubmitting"
              :error="errors.totalCobrado"
            />

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
          </div>
        </div>

        <AppTextarea
          v-model="observacion"
          label="Observación"
          placeholder="Notas adicionales del alquiler"
          :rows="3"
          v-bind="observacionAttrs"
          :disabled="isSubmitting"
          :error="errors.observacion"
        />
      </form>

      <div
        v-if="activeAlquilerId"
        class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">
              Cilindros en alquiler
            </h5>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ detalleRows.length }} cilindro(s) registrado(s)
            </p>
          </div>

          <button
            v-if="canCreateDetalle"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-brand-500 px-3 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
            @click="openCreateDetalleModal"
          >
            <AppIcon :name="ICONS.plus" :size="16" />
            Agregar cilindro
          </button>
        </div>

        <AppTable
          bare
          :columns="detalleColumns"
          :rows="detalleRows"
          row-key="id"
          :loading="isLoadingDetalles"
        >
          <template #cell-codigo_balon="{ value }">
            <span class="font-medium text-gray-800 dark:text-white/90">{{ value }}</span>
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
      </div>

      <div
        v-else-if="isCreateMode"
        class="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
      >
        Guarda el alquiler para poder agregar cilindros.
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        {{ activeAlquilerId ? 'Cerrar' : 'Cancelar' }}
      </button>
      <button
        type="submit"
        form="alquiler-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{
          isSubmitting
            ? 'Guardando...'
            : isCreateMode && !activeAlquilerId
              ? 'Crear alquiler'
              : 'Guardar cambios'
        }}
      </button>
    </template>

    <AlquilerDetalleFormModal
      v-if="activeAlquilerId"
      v-model="detalleFormOpen"
      :mode="detalleFormMode"
      :alquiler-id="activeAlquilerId"
      :detalle-id="selectedDetalleId"
      @saved="onDetalleSaved"
    />

    <AppModal
      v-model="deleteDetalleModalOpen"
      title="Eliminar cilindro"
      subtitle="Se dará de baja este cilindro del alquiler."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ detalleToDelete?.codigo_balon }}
        </span>
        del alquiler?
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
  useCreateAlquilerMutation,
  useUpdateAlquilerMutation,
} from '@/modules/balones/alquileres/composables/useAlquilerMutations'
import { useDeleteAlquilerDetalleMutation } from '@/modules/balones/alquileres/composables/useAlquilerDetalleMutations'
import { useAlquilerQuery } from '@/modules/balones/alquileres/composables/useAlquileresQuery'
import { useAlquileresDetalleQuery } from '@/modules/balones/alquileres/composables/useAlquileresDetalleQuery'
import AlquilerDetalleFormModal from '@/modules/balones/alquileres/components/AlquilerDetalleFormModal.vue'
import type { AlquilerFormMode } from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import type {
  AlquilerDetalle,
  AlquilerDetalleFormMode,
  AlquilerDetalleListFilters,
} from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppTable, AppTextarea } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import {
  optionalNumber,
  optionalString,
  requiredSelect,
  requiredString,
} from '@/shared/validation'

interface AlquilerFormModalProps {
  mode: AlquilerFormMode
  alquilerId?: number | null
}

const props = defineProps<AlquilerFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateAlquilerMutation()
const updateMutation = useUpdateAlquilerMutation()
const deleteDetalleMutation = useDeleteAlquilerDetalleMutation()

const internalMode = ref<AlquilerFormMode>(props.mode)
const activeAlquilerId = ref<number | null>(null)

const isCreateMode = computed(() => internalMode.value === 'create' && !activeAlquilerId.value)

const alquilerIdRef = computed(() => activeAlquilerId.value)
const alquilerQuery = useAlquilerQuery(alquilerIdRef)
const isLoadingAlquiler = computed(
  () => !isCreateMode.value && open.value && alquilerQuery.isFetching.value,
)

const detalleFilters = ref<AlquilerDetalleListFilters>({
  idAlquiler: undefined,
  pagina: 1,
  limite: 100,
})
const detallesQuery = useAlquileresDetalleQuery(detalleFilters)
const isLoadingDetalles = computed(
  () => detallesQuery.isFetching.value || detallesQuery.isLoading.value,
)
const detalleRows = computed(() => detallesQuery.data.value?.data ?? [])

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const listaEstadoAlquilerId = ref(ListaIds.ESTADO_ALQUILER)
const estadosAlquilerQuery = useListaOpcionesQuery(listaEstadoAlquilerId)

const estadoAlquilerOptions = computed(() => [
  { value: '', label: 'Sin estado' },
  ...toSelectOptions(estadosAlquilerQuery.data.value),
])

const almacenOptions = computed(() =>
  (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
)

const clienteOptions = computed(() =>
  (clientesQuery.data.value?.data ?? []).map((cliente) => ({
    value: cliente.id,
    label:
      cliente.razon_social ||
      [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
      cliente.numero_documento,
  })),
)

const canCreateDetalle = computed(() =>
  authStore.hasPermission(PermisoBanderas.ALQUILERES_DETALLE_CREAR),
)
const canEditDetalle = computed(() =>
  authStore.hasPermission(PermisoBanderas.ALQUILERES_DETALLE_EDITAR),
)
const canDeleteDetalle = computed(() =>
  authStore.hasPermission(PermisoBanderas.ALQUILERES_DETALLE_ELIMINAR),
)

const detalleColumns: TableColumn[] = [{ key: 'codigo_balon', label: 'Cilindro' }]

const detalleFormOpen = ref(false)
const detalleFormMode = ref<AlquilerDetalleFormMode>('create')
const selectedDetalleId = ref<number | null>(null)

const deleteDetalleModalOpen = ref(false)
const detalleToDelete = ref<AlquilerDetalle | null>(null)

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')

const optionalSelectNumber = () =>
  yup
    .mixed<string | number>()
    .transform((value) => (value === '' ? undefined : value))
    .optional()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      numeroAlquiler: requiredString('El número de alquiler').max(30, 'Máximo 30 caracteres'),
      idCliente: requiredSelect('El cliente'),
      idAlmacen: requiredSelect('El almacén'),
      fechaInicio: requiredString('La fecha de inicio'),
      fechaFinPactada: optionalString(),
      fechaFinReal: optionalString(),
      tarifaDiaria: optionalNumber().min(0, 'Debe ser mayor o igual a cero'),
      totalCobrado: optionalNumber().min(0, 'Debe ser mayor o igual a cero'),
      idEstado: optionalSelectNumber(),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
      idComprobanteVenta: optionalNumber().min(1, 'ID inválido'),
    }),
  ),
  initialValues: {
    numeroAlquiler: '',
    idCliente: '' as string | number,
    idAlmacen: '' as string | number,
    fechaInicio: '',
    fechaFinPactada: '',
    fechaFinReal: '',
    tarifaDiaria: undefined as number | undefined,
    totalCobrado: undefined as number | undefined,
    idEstado: '' as string | number,
    observacion: '',
    idComprobanteVenta: undefined as number | undefined,
  },
})

const [numeroAlquiler, numeroAlquilerAttrs] = defineField('numeroAlquiler')
const [idCliente, idClienteAttrs] = defineField('idCliente')
const [idAlmacen, idAlmacenAttrs] = defineField('idAlmacen')
const [fechaInicio, fechaInicioAttrs] = defineField('fechaInicio')
const [fechaFinPactada, fechaFinPactadaAttrs] = defineField('fechaFinPactada')
const [fechaFinReal, fechaFinRealAttrs] = defineField('fechaFinReal')
const [tarifaDiaria, tarifaDiariaAttrs] = defineField('tarifaDiaria')
const [totalCobrado, totalCobradoAttrs] = defineField('totalCobrado')
const [idEstado, idEstadoAttrs] = defineField('idEstado')
const [observacion, observacionAttrs] = defineField('observacion')
const [idComprobanteVenta, idComprobanteVentaAttrs] = defineField('idComprobanteVenta')

const toOptionalNumber = (value: string | number | undefined) =>
  value !== '' && value != null ? Number(value) : undefined

const buildPayloadFields = (values: {
  numeroAlquiler?: string
  idCliente?: string | number
  idAlmacen?: string | number
  fechaInicio?: string
  fechaFinPactada?: string
  fechaFinReal?: string
  tarifaDiaria?: number
  totalCobrado?: number
  idEstado?: string | number
  observacion?: string
  idComprobanteVenta?: number
}) => ({
  numeroAlquiler: values.numeroAlquiler || undefined,
  idCliente: toOptionalNumber(values.idCliente),
  idAlmacen: toOptionalNumber(values.idAlmacen),
  fechaInicio: values.fechaInicio || undefined,
  fechaFinPactada: values.fechaFinPactada || undefined,
  fechaFinReal: values.fechaFinReal || undefined,
  tarifaDiaria: values.tarifaDiaria,
  totalCobrado: values.totalCobrado,
  idEstado: toOptionalNumber(values.idEstado),
  observacion: values.observacion || undefined,
  idComprobanteVenta: values.idComprobanteVenta ? Number(values.idComprobanteVenta) : undefined,
})

const syncFormValues = () => {
  const data = alquilerQuery.data.value
  resetForm({
    values: {
      numeroAlquiler: data?.numero_alquiler ?? '',
      idCliente: data?.id_cliente ?? '',
      idAlmacen: data?.id_almacen ?? '',
      fechaInicio: toDateInput(data?.fecha_inicio),
      fechaFinPactada: toDateInput(data?.fecha_fin_pactada),
      fechaFinReal: toDateInput(data?.fecha_fin_real),
      tarifaDiaria: data?.tarifa_diaria ?? undefined,
      totalCobrado: data?.total_cobrado ?? undefined,
      idEstado: data?.id_estado ?? '',
      observacion: data?.observacion ?? '',
      idComprobanteVenta: data?.id_comprobante_venta ?? undefined,
    },
  })
}

const resetCreateForm = () => {
  resetForm({
    values: {
      numeroAlquiler: '',
      idCliente: '',
      idAlmacen: '',
      fechaInicio: new Date().toISOString().slice(0, 10),
      fechaFinPactada: '',
      fechaFinReal: '',
      tarifaDiaria: undefined,
      totalCobrado: undefined,
      idEstado: '',
      observacion: '',
      idComprobanteVenta: undefined,
    },
  })
}

const resetModalState = () => {
  internalMode.value = props.mode
  activeAlquilerId.value = props.mode === 'edit' && props.alquilerId ? props.alquilerId : null
  detalleFilters.value = {
    idAlquiler: activeAlquilerId.value ?? undefined,
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
      const cliente = toOptionalNumber(values.idCliente)
      const almacen = toOptionalNumber(values.idAlmacen)
      if (!values.numeroAlquiler || !cliente || !almacen || !values.fechaInicio) return

      const created = await createMutation.mutateAsync({
        ...fields,
        idUsuarioAuditoria: currentUserId,
        numeroAlquiler: values.numeroAlquiler,
        idCliente: cliente,
        idAlmacen: almacen,
        fechaInicio: values.fechaInicio,
      })

      activeAlquilerId.value = created.id
      internalMode.value = 'edit'
      detalleFilters.value = {
        idAlquiler: created.id,
        pagina: 1,
        limite: 100,
      }
      emit('saved')
    } else if (activeAlquilerId.value) {
      await updateMutation.mutateAsync({
        id: activeAlquilerId.value,
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

const openEditDetalleModal = (row: AlquilerDetalle) => {
  detalleFormMode.value = 'edit'
  selectedDetalleId.value = row.id
  detalleFormOpen.value = true
}

const openDeleteDetalleModal = (row: AlquilerDetalle) => {
  detalleToDelete.value = row
  deleteDetalleModalOpen.value = true
}

const onDetalleSaved = () => {
  detallesQuery.refetch()
  alquilerQuery.refetch()
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
  () => [open.value, props.mode, props.alquilerId] as const,
  ([isOpen, mode, alquilerId]) => {
    if (!isOpen) return
    resetModalState()
    if (mode === 'edit' && alquilerId) {
      syncFormValues()
    } else {
      resetCreateForm()
    }
  },
  { immediate: true },
)

watch(
  () => alquilerQuery.data.value,
  () => {
    if (open.value && activeAlquilerId.value) {
      syncFormValues()
    }
  },
)
</script>

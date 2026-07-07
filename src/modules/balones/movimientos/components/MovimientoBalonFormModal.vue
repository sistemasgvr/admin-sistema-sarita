<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo movimiento' : 'Editar movimiento'"
    :subtitle="
      mode === 'create'
        ? 'Registra traslados, entregas u otros movimientos de cilindros.'
        : 'Actualiza los datos del movimiento seleccionado.'
    "
    size="lg"
    @close="handleClose"
  >
    <div
      v-if="isLoadingMovimiento"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando movimiento...
    </div>

    <form
      v-else
      id="movimiento-balon-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <div
        v-if="mode === 'edit' && movimientoDetalle"
        class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ movimientoDetalle.codigo_balon }}
          <span v-if="movimientoDetalle.nombre_tipo_movimiento">
            — {{ movimientoDetalle.nombre_tipo_movimiento }}
          </span>
        </p>
        <p v-if="movimientoDetalle.nombre_cliente" class="mt-1 text-gray-600 dark:text-gray-400">
          Cliente: {{ movimientoDetalle.nombre_cliente }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppSelect
          v-if="mode === 'create'"
          v-model="idBalon"
          label="Cilindro"
          placeholder="Selecciona cilindro"
          required
          v-bind="idBalonAttrs"
          :disabled="isSubmitting || balonesQuery.isLoading.value"
          :error="errors.idBalon"
          :options="balonOptions"
        />

        <AppSelect
          v-model="idTipoMovimiento"
          label="Tipo de movimiento"
          placeholder="Selecciona tipo"
          v-bind="idTipoMovimientoAttrs"
          :disabled="isSubmitting || tiposMovimientoQuery.isFetching.value"
          :error="errors.idTipoMovimiento"
          :options="tipoMovimientoOptions"
        />

        <AppInput
          v-model="fechaMovimiento"
          label="Fecha"
          type="date"
          required
          v-bind="fechaMovimientoAttrs"
          :disabled="isSubmitting"
          :error="errors.fechaMovimiento"
        />

        <AppSelect
          v-model="idCliente"
          label="Cliente"
          placeholder="Opcional"
          v-bind="idClienteAttrs"
          :disabled="isSubmitting || clientesQuery.isLoading.value"
          :options="clienteOptions"
        />

        <AppSelect
          v-model="idAlmacenOrigen"
          label="Almacén origen"
          placeholder="Opcional"
          v-bind="idAlmacenOrigenAttrs"
          :disabled="isSubmitting || almacenesQuery.isLoading.value"
          :options="almacenOptions"
        />

        <AppSelect
          v-model="idAlmacenDestino"
          label="Almacén destino"
          placeholder="Opcional"
          v-bind="idAlmacenDestinoAttrs"
          :disabled="isSubmitting || almacenesQuery.isLoading.value"
          :options="almacenOptions"
        />
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

      <AppTextarea
        v-model="observacion"
        label="Observación"
        placeholder="Detalle del movimiento"
        :rows="3"
        v-bind="observacionAttrs"
        :disabled="isSubmitting"
        :error="errors.observacion"
      />
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting || isLoadingMovimiento"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="movimiento-balon-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting || isLoadingMovimiento"
      >
        {{
          isSubmitting
            ? 'Guardando...'
            : mode === 'create'
              ? 'Registrar movimiento'
              : 'Guardar cambios'
        }}
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
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import {
  useCreateMovimientoBalonMutation,
  useUpdateMovimientoBalonMutation,
} from '@/modules/balones/movimientos/composables/useMovimientoBalonMutations'
import { useMovimientoBalonQuery } from '@/modules/balones/movimientos/composables/useMovimientosBalonQuery'
import type { MovimientoBalonFormMode } from '@/modules/balones/movimientos/interfaces/movimiento-balon.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppTextarea } from '@/shared/components'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'

interface MovimientoBalonFormModalProps {
  mode: MovimientoBalonFormMode
  movimientoId?: number | null
}

const props = defineProps<MovimientoBalonFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateMovimientoBalonMutation()
const updateMutation = useUpdateMovimientoBalonMutation()

const movimientoIdRef = computed(() => (props.mode === 'edit' ? props.movimientoId : null))
const movimientoQuery = useMovimientoBalonQuery(movimientoIdRef)
const isLoadingMovimiento = computed(
  () => props.mode === 'edit' && open.value && movimientoQuery.isFetching.value,
)
const movimientoDetalle = computed(() => movimientoQuery.data.value ?? null)

const balonesFilters = ref({ pagina: 1, limite: 200 })
const balonesQuery = useBalonesQuery(balonesFilters)

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const listaTipoMovId = ref(ListaIds.TIPO_MOV_BALON)
const listaTipoDocId = ref(ListaIds.TIPO_DOCUMENTO_REF)
const tiposMovimientoQuery = useListaOpcionesQuery(listaTipoMovId)
const tiposDocumentoQuery = useListaOpcionesQuery(listaTipoDocId)

const balonOptions = computed(() =>
  (balonesQuery.data.value?.data ?? []).map((balon) => ({
    value: balon.id,
    label: balon.codigo_balon,
  })),
)

const almacenOptions = computed(() => [
  { value: '', label: 'Sin almacén' },
  ...(almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
])

const clienteOptions = computed(() => [
  { value: '', label: 'Sin cliente' },
  ...(clientesQuery.data.value?.data ?? []).map((cliente) => ({
    value: cliente.id,
    label:
      cliente.razon_social ||
      [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
      cliente.numero_documento,
  })),
])

const tipoMovimientoOptions = computed(() => toSelectOptions(tiposMovimientoQuery.data.value))

const tipoDocumentoOptions = computed(() => [
  { value: '', label: 'Sin documento' },
  ...toSelectOptions(tiposDocumentoQuery.data.value),
])

const today = () => new Date().toISOString().slice(0, 10)
const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : today())

const optionalSelectNumber = () =>
  yup
    .mixed<string | number>()
    .transform((value) => (value === '' ? undefined : value))
    .optional()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idBalon: yup.number().optional(),
      idTipoMovimiento: optionalSelectNumber(),
      fechaMovimiento: requiredString('La fecha'),
      idCliente: optionalSelectNumber(),
      idAlmacenOrigen: optionalSelectNumber(),
      idAlmacenDestino: optionalSelectNumber(),
      idTipoDocumentoRef: optionalSelectNumber(),
      idDocumentoRef: optionalNumber().min(1, 'ID inválido'),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
    }),
  ),
  initialValues: {
    idBalon: undefined as number | undefined,
    idTipoMovimiento: '' as string | number,
    fechaMovimiento: today(),
    idCliente: '' as string | number,
    idAlmacenOrigen: '' as string | number,
    idAlmacenDestino: '' as string | number,
    idTipoDocumentoRef: '' as string | number,
    idDocumentoRef: undefined as number | undefined,
    observacion: '',
  },
})

const [idBalon, idBalonAttrs] = defineField('idBalon')
const [idTipoMovimiento, idTipoMovimientoAttrs] = defineField('idTipoMovimiento')
const [fechaMovimiento, fechaMovimientoAttrs] = defineField('fechaMovimiento')
const [idCliente, idClienteAttrs] = defineField('idCliente')
const [idAlmacenOrigen, idAlmacenOrigenAttrs] = defineField('idAlmacenOrigen')
const [idAlmacenDestino, idAlmacenDestinoAttrs] = defineField('idAlmacenDestino')
const [idTipoDocumentoRef, idTipoDocumentoRefAttrs] = defineField('idTipoDocumentoRef')
const [idDocumentoRef, idDocumentoRefAttrs] = defineField('idDocumentoRef')
const [observacion, observacionAttrs] = defineField('observacion')

const toOptionalNumber = (value: string | number | undefined) =>
  value !== '' && value != null ? Number(value) : undefined

const syncFormValues = () => {
  const data = movimientoDetalle.value
  resetForm({
    values: {
      idBalon: data?.id_balon ?? undefined,
      idTipoMovimiento: data?.id_tipo_movimiento ?? '',
      fechaMovimiento: toDateInput(data?.fecha_movimiento),
      idCliente: data?.id_cliente ?? '',
      idAlmacenOrigen: data?.id_almacen_origen ?? '',
      idAlmacenDestino: data?.id_almacen_destino ?? '',
      idTipoDocumentoRef: data?.id_tipo_documento_ref ?? '',
      idDocumentoRef: data?.id_documento_ref ?? undefined,
      observacion: data?.observacion ?? '',
    },
  })
}

const resetCreateForm = () => {
  resetForm({
    values: {
      idBalon: undefined,
      idTipoMovimiento: '',
      fechaMovimiento: today(),
      idCliente: '',
      idAlmacenOrigen: '',
      idAlmacenDestino: '',
      idTipoDocumentoRef: '',
      idDocumentoRef: undefined,
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

  const tipoDocRef = toOptionalNumber(values.idTipoDocumentoRef)

  try {
    if (props.mode === 'create') {
      if (!values.idBalon) return

      await createMutation.mutateAsync({
        idUsuarioAuditoria: currentUserId,
        idBalon: Number(values.idBalon),
        idTipoMovimiento: toOptionalNumber(values.idTipoMovimiento),
        idCliente: toOptionalNumber(values.idCliente),
        idAlmacenOrigen: toOptionalNumber(values.idAlmacenOrigen),
        idAlmacenDestino: toOptionalNumber(values.idAlmacenDestino),
        fechaMovimiento: values.fechaMovimiento,
        idDocumentoRef: values.idDocumentoRef ? Number(values.idDocumentoRef) : undefined,
        idTipoDocumentoRef: tipoDocRef,
        observacion: values.observacion || undefined,
      })
    } else if (props.movimientoId) {
      await updateMutation.mutateAsync({
        id: props.movimientoId,
        payload: {
          idUsuarioAuditoria: currentUserId,
          idTipoMovimiento: toOptionalNumber(values.idTipoMovimiento),
          idCliente: toOptionalNumber(values.idCliente),
          idAlmacenOrigen: toOptionalNumber(values.idAlmacenOrigen),
          idAlmacenDestino: toOptionalNumber(values.idAlmacenDestino),
          fechaMovimiento: values.fechaMovimiento,
          idDocumentoRef: values.idDocumentoRef ? Number(values.idDocumentoRef) : undefined,
          idTipoDocumentoRef: tipoDocRef,
          observacion: values.observacion || undefined,
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
    if (isOpen && props.mode === 'create') {
      resetCreateForm()
    }
  },
)

watch(movimientoDetalle, () => {
  if (open.value && props.mode === 'edit') {
    syncFormValues()
  }
})
</script>

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
      id="movimiento-balon-form"
      class="space-y-5"
      autocomplete="off"
      @submit="onSubmit"
    >
      <FormCardsLayout>
        <DetailSectionCard title="Datos" :icon="ICONS.arrowLeftRight" :help="cardHelp">
          <BalonFichaResumen
            v-if="mode === 'edit'"
            class="mb-4"
            :balon="balonSeleccionado"
            :codigo-fallback="movimientoDetalle?.codigo_balon"
            :tipo-movimiento="movimientoDetalle?.nombre_tipo_movimiento"
            :snapshot="fichaSnapshot"
          />

          <div class="grid grid-cols-1 !gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AppSelectWithCreate
              :can-create="canCreateListaOpcion"
              create-title="Nuevo tipo de movimiento"
              :disabled="isSubmitting || tiposMovimientoQuery.isFetching.value"
              @create="tipoMovModalOpen = true"
            >
              <AppSelect
                v-model="idTipoMovimiento"
                label="Tipo de movimiento"
                placeholder="Selecciona tipo"
                required
                v-bind="idTipoMovimientoAttrs"
                :disabled="isSubmitting || tiposMovimientoQuery.isFetching.value"
                :error="errors.idTipoMovimiento"
                :options="tipoMovimientoOptions"
                :hint="mode === 'create' ? selectRule.hint : undefined"
              />
            </AppSelectWithCreate>

            <AppInput
              v-model="fechaMovimiento"
              label="Fecha"
              type="date"
              required
              v-bind="fechaMovimientoAttrs"
              :disabled="isSubmitting"
              :error="errors.fechaMovimiento"
            />

            <div v-if="mode === 'create'" class="sm:col-span-2 lg:col-span-3 space-y-2">
              <PosBalonSelectField
                v-model="idBalonAsModel"
                mode="general"
                label="Cilindro"
                :placeholder="
                  hasTipoMovimiento
                    ? 'Buscar por código, tipo o gas...'
                    : 'Primero elige el tipo de movimiento'
                "
                required
                :disabled="isSubmitting"
                :selection-locked="!hasTipoMovimiento"
                :id-cliente="clienteFilterForBalon"
                :extra-filters="balonExtraFilters"
                :client-filter="balonClientFilter"
                :error="errors.idBalon"
                :empty-text="
                  hasTipoMovimiento
                    ? 'No hay cilindros que cumplan el estado para este movimiento.'
                    : 'Primero selecciona el tipo de movimiento.'
                "
              />

              <BalonFichaResumen v-if="balonSeleccionado" :balon="balonSeleccionado" />
            </div>

            <ClienteSelectField
              v-if="selectRule.cliente !== 'hidden'"
              v-model="idCliente"
              label="Cliente"
              :placeholder="selectRule.cliente === 'required' ? 'Selecciona cliente' : 'Opcional'"
              :required="selectRule.cliente === 'required'"
              :disabled="isSubmitting"
              :error="errors.idCliente"
            />

            <AlmacenSelectField
              v-if="selectRule.almacenOrigen !== 'hidden'"
              v-model="idAlmacenOrigen"
              label="Almacén origen"
              :placeholder="
                selectRule.almacenOrigen === 'required' ? 'Selecciona almacén' : 'Opcional'
              "
              :required="selectRule.almacenOrigen === 'required'"
              :disabled="isSubmitting"
              :error="errors.idAlmacenOrigen"
            />

            <AlmacenSelectField
              v-if="selectRule.almacenDestino !== 'hidden'"
              v-model="idAlmacenDestino"
              label="Almacén destino"
              :placeholder="
                selectRule.almacenDestino === 'required' ? 'Selecciona almacén' : 'Opcional'
              "
              :required="selectRule.almacenDestino === 'required'"
              :disabled="isSubmitting"
              :error="errors.idAlmacenDestino"
            />

            <AppSelectWithCreate
              :can-create="canCreateListaOpcion"
              create-title="Nuevo documento origen"
              :disabled="isSubmitting || tiposDocumentoQuery.isFetching.value"
              @create="tipoDocModalOpen = true"
            >
              <AppSelect
                v-model="idTipoDocumentoRef"
                label="Documento origen"
                placeholder="Opcional"
                optional
                v-bind="idTipoDocumentoRefAttrs"
                :disabled="isSubmitting || tiposDocumentoQuery.isFetching.value"
                :options="tipoDocumentoOptions"
              />
            </AppSelectWithCreate>

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
              v-model="observacion"
              label="Observación"
              optional
              placeholder="Detalle del movimiento"
              v-bind="observacionAttrs"
              :disabled="isSubmitting"
              :error="errors.observacion"
            />
          </div>
        </DetailSectionCard>
      </FormCardsLayout>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="isSubmitting || isLoadingMovimiento"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="submit"
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
      </div>
    </form>

    <ListaOpcionFormModal
      v-model="tipoMovModalOpen"
      :id-lista="ListaIds.TIPO_MOV_BALON"
      title="Nuevo tipo de movimiento"
      subtitle="Quedará disponible al registrar movimientos de cilindros."
      nombre-placeholder="Ej. TRASLADO_ALMACEN"
      @saved="onTipoMovimientoCreated"
    />

    <ListaOpcionFormModal
      v-model="tipoDocModalOpen"
      :id-lista="ListaIds.TIPO_DOCUMENTO_REF"
      title="Nuevo documento origen"
      subtitle="Quedará disponible como referencia del movimiento."
      nombre-placeholder="Ej. GUIA_REMISION"
      @saved="onTipoDocumentoCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import BalonFichaResumen from '@/modules/balones/components/BalonFichaResumen.vue'
import type {
  Balon,
  BalonListFilters,
} from '@/modules/balones/cilindros/interfaces/balon.interface'
import { useBalonQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { getMovimientoBalonSelectRule } from '@/modules/balones/movimientos/constants/movimientoBalonSelectRules'
import {
  useCreateMovimientoBalonMutation,
  useUpdateMovimientoBalonMutation,
} from '@/modules/balones/movimientos/composables/useMovimientoBalonMutations'
import { useMovimientoBalonQuery } from '@/modules/balones/movimientos/composables/useMovimientosBalonQuery'
import type { MovimientoBalonFormMode } from '@/modules/balones/movimientos/interfaces/movimiento-balon.interface'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppSelect, AppSelectWithCreate } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { normalizeListaOpcionCode } from '@/shared/utils/listaOpcionBadge'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'

interface MovimientoBalonFormProps {
  mode: MovimientoBalonFormMode
  movimientoId?: number | null
  active?: boolean
}

const props = withDefaults(defineProps<MovimientoBalonFormProps>(), {
  movimientoId: null,
  active: true,
})

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateMovimientoBalonMutation()
const updateMutation = useUpdateMovimientoBalonMutation()

const tipoMovModalOpen = ref(false)
const tipoDocModalOpen = ref(false)

const canCreateListaOpcion = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_BALON_CREAR),
)

const movimientoIdRef = computed(() => (props.mode === 'edit' ? props.movimientoId : null))
const movimientoQuery = useMovimientoBalonQuery(movimientoIdRef)
const isLoadingMovimiento = computed(
  () => props.mode === 'edit' && props.active && movimientoQuery.isFetching.value,
)
const movimientoDetalle = computed(() => movimientoQuery.data.value ?? null)

const fichaSnapshot = computed(() => {
  const data = movimientoDetalle.value
  if (!data) return null
  return {
    nombre_estado_balon: data.nombre_estado_balon,
    nombre_almacen_ubicacion: data.nombre_almacen_ubicacion,
    nombre_cliente_ubicacion: data.nombre_cliente_ubicacion,
  }
})

const listaTipoMovId = ref(ListaIds.TIPO_MOV_BALON)
const listaTipoDocId = ref(ListaIds.TIPO_DOCUMENTO_REF)
const listaEstadoBalonId = ref(ListaIds.ESTADO_BALON)
const listaPropietarioId = ref(ListaIds.PROPIETARIO_BALON)

const tiposMovimientoQuery = useListaOpcionesQuery(listaTipoMovId)
const tiposDocumentoQuery = useListaOpcionesQuery(listaTipoDocId)
const estadoBalonQuery = useListaOpcionesQuery(listaEstadoBalonId)
const propietarioQuery = useListaOpcionesQuery(listaPropietarioId)

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

const { defineField, handleSubmit, resetForm, errors, isSubmitting, setFieldError } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idBalon: optionalSelectNumber(),
      idTipoMovimiento: yup
        .mixed<string | number>()
        .transform((value) => (value === '' ? undefined : value))
        .required('El tipo de movimiento es obligatorio'),
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
    idBalon: '' as string | number,
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

const [idBalon] = defineField('idBalon')
const [idTipoMovimiento, idTipoMovimientoAttrs] = defineField('idTipoMovimiento')
const [fechaMovimiento, fechaMovimientoAttrs] = defineField('fechaMovimiento')
const [idCliente] = defineField('idCliente')
const [idAlmacenOrigen] = defineField('idAlmacenOrigen')
const [idAlmacenDestino] = defineField('idAlmacenDestino')
const [idTipoDocumentoRef, idTipoDocumentoRefAttrs] = defineField('idTipoDocumentoRef')
const [idDocumentoRef, idDocumentoRefAttrs] = defineField('idDocumentoRef')
const [observacion, observacionAttrs] = defineField('observacion')

const idBalonAsModel = computed({
  get: () => (idBalon.value === '' || idBalon.value == null ? '' : Number(idBalon.value)),
  set: (value: number | '') => {
    idBalon.value = value === '' ? '' : value
  },
})

const hasTipoMovimiento = computed(
  () => idTipoMovimiento.value !== '' && idTipoMovimiento.value != null,
)

const tipoMovimientoCodigo = computed(() => {
  if (!hasTipoMovimiento.value) return null
  const opcion = tiposMovimientoQuery.data.value?.find(
    (item) => item.id === Number(idTipoMovimiento.value),
  )
  return opcion?.nombre ?? null
})

const selectRule = computed(() => getMovimientoBalonSelectRule(tipoMovimientoCodigo.value))

const cardHelp = computed(() =>
  props.mode === 'edit'
    ? 'El cilindro no se cambia. Puedes actualizar tipo, fecha, almacenes, cliente y observación.'
    : selectRule.value.hint,
)

const resolveListaId = (items: ListaOpcion[] | undefined, code: string) =>
  items?.find((item) => normalizeListaOpcionCode(item.nombre) === code)?.id

const balonExtraFilters = computed<Partial<BalonListFilters> | undefined>(() => {
  if (!hasTipoMovimiento.value) return undefined

  const rule = selectRule.value
  const filters: Partial<BalonListFilters> = { soloBajas: false }

  if (rule.estadosBalon.length === 1) {
    const id = resolveListaId(estadoBalonQuery.data.value, rule.estadosBalon[0])
    if (id) filters.idEstadoBalon = id
  }

  if (rule.soloEmpresa) {
    const id = resolveListaId(propietarioQuery.data.value, 'EMPRESA')
    if (id) filters.idPropietario = id
  }

  if (
    selectRule.value.almacenOrigen === 'required' &&
    idAlmacenOrigen.value !== '' &&
    idAlmacenOrigen.value != null
  ) {
    filters.idAlmacen = Number(idAlmacenOrigen.value)
  }

  return filters
})

const balonClientFilter = computed(() => {
  const rule = selectRule.value
  const estados =
    rule.estadosBalon.length > 1
      ? new Set(rule.estadosBalon.map((item) => item.toUpperCase()))
      : null

  if (!estados) return undefined

  return (balon: Balon) => {
    if (estados) {
      const code = normalizeListaOpcionCode(balon.nombre_estado_balon)
      if (!code || !estados.has(code)) return false
    }
    return true
  }
})

const clienteFilterForBalon = computed<number | ''>(() => {
  if (!selectRule.value.filtrarPorCliente) return ''
  if (idCliente.value === '' || idCliente.value == null) return ''
  return Number(idCliente.value)
})

const balonIdRef = computed(() => {
  const id = idBalonAsModel.value
  return typeof id === 'number' && id > 0 ? id : null
})
const balonDetalleQuery = useBalonQuery(balonIdRef)
const balonSeleccionado = computed(() => balonDetalleQuery.data.value ?? null)

const toOptionalNumber = (value: string | number | undefined) =>
  value !== '' && value != null ? Number(value) : undefined

watch(idTipoMovimiento, () => {
  if (props.mode !== 'create') return
  idBalon.value = ''
  if (selectRule.value.cliente === 'hidden') idCliente.value = ''
  if (selectRule.value.almacenOrigen === 'hidden') idAlmacenOrigen.value = ''
  if (selectRule.value.almacenDestino === 'hidden') idAlmacenDestino.value = ''
})

const syncFormValues = () => {
  const data = movimientoDetalle.value
  resetForm({
    values: {
      idBalon: data?.id_balon ?? '',
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
      idBalon: '',
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

function onTipoMovimientoCreated(opcion: ListaOpcion) {
  idTipoMovimiento.value = opcion.id
  void tiposMovimientoQuery.refetch()
}

function onTipoDocumentoCreated(opcion: ListaOpcion) {
  idTipoDocumentoRef.value = opcion.id
  void tiposDocumentoQuery.refetch()
}

const validateRuleFields = (values: {
  idBalon?: string | number
  idCliente?: string | number
  idAlmacenOrigen?: string | number
  idAlmacenDestino?: string | number
}) => {
  let ok = true
  const rule = selectRule.value

  if (props.mode === 'create' && !toOptionalNumber(values.idBalon)) {
    setFieldError('idBalon', 'El cilindro es obligatorio')
    ok = false
  }

  if (rule.cliente === 'required' && !toOptionalNumber(values.idCliente)) {
    setFieldError('idCliente', 'El cliente es obligatorio para este movimiento')
    ok = false
  }

  if (rule.almacenOrigen === 'required' && !toOptionalNumber(values.idAlmacenOrigen)) {
    setFieldError('idAlmacenOrigen', 'El almacén origen es obligatorio')
    ok = false
  }

  if (rule.almacenDestino === 'required' && !toOptionalNumber(values.idAlmacenDestino)) {
    setFieldError('idAlmacenDestino', 'El almacén destino es obligatorio')
    ok = false
  }

  return ok
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return
  if (!validateRuleFields(values)) return

  const tipoDocRef = toOptionalNumber(values.idTipoDocumentoRef)
  const rule = selectRule.value

  try {
    if (props.mode === 'create') {
      const idBalonValue = toOptionalNumber(values.idBalon)
      if (!idBalonValue) return

      await createMutation.mutateAsync({
        idUsuarioAuditoria: currentUserId,
        idBalon: idBalonValue,
        idTipoMovimiento: toOptionalNumber(values.idTipoMovimiento),
        idCliente: rule.cliente === 'hidden' ? undefined : toOptionalNumber(values.idCliente),
        idAlmacenOrigen:
          rule.almacenOrigen === 'hidden' ? undefined : toOptionalNumber(values.idAlmacenOrigen),
        idAlmacenDestino:
          rule.almacenDestino === 'hidden'
            ? undefined
            : toOptionalNumber(values.idAlmacenDestino),
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
  } catch {
    // toast en mutation
  }
})

watch(
  () => [props.active, props.mode] as const,
  ([isActive, mode]) => {
    if (!isActive) return
    if (mode === 'create') {
      resetCreateForm()
    } else {
      syncFormValues()
    }
  },
  { immediate: true },
)

watch(movimientoDetalle, () => {
  if (props.active && props.mode === 'edit') {
    syncFormValues()
  }
})
</script>

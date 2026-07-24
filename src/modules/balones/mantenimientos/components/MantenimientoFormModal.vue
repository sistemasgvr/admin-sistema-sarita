<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo mantenimiento' : 'Editar mantenimiento'"
    :subtitle="
      mode === 'create'
        ? 'Ingreso a taller: cilindro de inventario o servicio al cilindro que trae el cliente.'
        : 'Actualiza datos operativos. Para cerrar el ciclo use Finalizar en el listado.'
    "
    size="xl"
    @close="handleClose"
  >
    <div
      v-if="isLoadingMantenimiento"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando mantenimiento...
    </div>

    <form
      v-else
      id="mantenimiento-form"
      autocomplete="off"
      @submit="onSubmit"
    >
      <FormCardsLayout>
        <DetailSectionCard
          v-if="mode === 'edit' && mantenimientoDetalle"
          title="Cilindro"
          :icon="ICONS.cylinder"
          :full-width="true"
        >
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">
            {{ mantenimientoDetalle.codigo_balon }}
          </p>
          <p
            v-if="(mantenimientoDetalle.nombre_propietario ?? '').toUpperCase() === 'CLIENTE'"
            class="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            Propio de
            {{
              mantenimientoDetalle.nombre_cliente_propietario ||
              'cliente (sin nombre)'
            }}
          </p>
        </DetailSectionCard>

        <DetailSectionCard title="Datos del servicio" :icon="ICONS.construction">
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                v-if="mode === 'create'"
                class="flex w-full min-w-0 items-end gap-2"
              >
                <div class="min-w-0 flex-1 overflow-hidden">
                  <AppSelectSearch
                    v-model="idBalon"
                    v-model:search="balonBuscar"
                    remote
                    label="Cilindro"
                    placeholder="Selecciona cilindro"
                    search-placeholder="Código, serie o cliente..."
                    required
                    v-bind="idBalonAttrs"
                    :disabled="isSubmitting || balonesQuery.isLoading.value"
                    :loading="balonesQuery.isFetching.value"
                    :error="errors.idBalon"
                    :options="balonOptions"
                    empty-text="Sin cilindros. Registra uno nuevo."
                  />
                </div>
                <button
                  v-if="canCreateBalon"
                  type="button"
                  title="Registrar cilindro"
                  class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
                  :disabled="isSubmitting"
                  @click="balonModalOpen = true"
                >
                  <AppIcon :name="ICONS.plus" :size="18" />
                </button>
              </div>

              <AppSelect
                v-model="idTipoMantenimiento"
                label="Tipo de mantenimiento"
                placeholder="P.H., recertificación, etc."
                v-bind="idTipoMantenimientoAttrs"
                :disabled="isSubmitting || tiposMantenimientoQuery.isFetching.value"
                :options="tipoMantenimientoOptions"
              />

              <AppSelect
                v-model="idEstado"
                label="Estado"
                :placeholder="mode === 'create' ? 'Pendiente (por defecto)' : 'Selecciona'"
                v-bind="idEstadoAttrs"
                :disabled="isSubmitting || estadosMantenimientoQuery.isFetching.value"
                :options="estadoMantenimientoOptions"
                :hint="
                  mode === 'edit'
                    ? 'Para cerrar el ciclo use Finalizar en el listado.'
                    : 'Alta como Pendiente. El cierre se hace con Finalizar.'
                "
              />

              <AppInput
                v-model="fechaIngreso"
                label="Fecha ingreso"
                type="date"
                required
                v-bind="fechaIngresoAttrs"
                :disabled="isSubmitting"
                :error="errors.fechaIngreso"
              />

              <AppInput
                v-if="esTipoPh"
                v-model="fechaSalida"
                label="Fecha P.H. (mes/año)"
                type="date"
                v-bind="fechaSalidaAttrs"
                :disabled="isSubmitting"
              />

              <AppInput
                v-model="costo"
                label="Costo"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                v-bind="costoAttrs"
                :disabled="isSubmitting"
                :error="errors.costo"
              />
            </div>

            <AppTextarea
              v-model="descripcion"
              label="Descripción"
              placeholder="Detalle del trabajo realizado"
              :rows="3"
              v-bind="descripcionAttrs"
              :disabled="isSubmitting"
              :error="errors.descripcion"
            />

            <p
              v-if="esTipoPh"
              class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
            >
              Use cualquier día del <strong>mes y año</strong> de la prueba; el sistema guarda solo
              mes/año. Al guardar se actualizará la P.H. vigente del cilindro.
            </p>
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="esTipoPh"
          title="Datos de P.H."
          :icon="ICONS.gauge"
        >
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppSelect
              v-model="vigenciaPhAnios"
              label="Vigencia (años)"
              placeholder="Por defecto según tipo de balón"
              :options="vigenciaPhOptions"
              :disabled="isSubmitting"
              v-bind="vigenciaPhAniosAttrs"
              :error="errors.vigenciaPhAnios"
            />
            <AppInput
              v-model="numeroCertificadoPh"
              label="N° certificado"
              placeholder="Opcional"
              v-bind="numeroCertificadoPhAttrs"
              :disabled="isSubmitting"
              :error="errors.numeroCertificadoPh"
            />
            <AppSelect
              v-model="idOrganoInspector"
              label="Órgano inspector"
              :placeholder="organoInspectorQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
              :options="organoInspectorOptions"
              :disabled="isSubmitting || organoInspectorNoAplica || organoInspectorQuery.isLoading.value"
              v-bind="idOrganoInspectorAttrs"
              :error="errors.idOrganoInspector"
            />
            <div class="flex items-end pb-2">
              <AppCheckbox
                v-model="organoInspectorNoAplica"
                label="Sin órgano inspector"
                :disabled="isSubmitting"
              />
            </div>
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Proveedor externo" :icon="ICONS.building">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <AppCheckbox
                v-model="esExterno"
                label="Mantenimiento externo (taller / proveedor)"
                :disabled="isSubmitting"
              />
            </div>

            <AppSelect
              v-model="idProveedor"
              label="Proveedor / taller"
              placeholder="Opcional"
              v-bind="idProveedorAttrs"
              :disabled="isSubmitting || !esExterno || clientesQuery.isLoading.value"
              :options="proveedorOptions"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Comprobantes" :icon="ICONS.clipboardList">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppInput
              v-model="idComprobanteVenta"
              label="ID comprobante venta"
              type="number"
              min="1"
              step="1"
              placeholder="Si se cobra al cliente"
              v-bind="idComprobanteVentaAttrs"
              :disabled="isSubmitting"
            />

            <AppInput
              v-model="idComprobanteCompra"
              label="ID comprobante compra"
              type="number"
              min="1"
              step="1"
              placeholder="Si es servicio externo"
              v-bind="idComprobanteCompraAttrs"
              :disabled="isSubmitting"
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
        form="mantenimiento-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{
          isSubmitting
            ? 'Guardando...'
            : mode === 'create'
              ? 'Registrar mantenimiento'
              : 'Guardar cambios'
        }}
      </button>
    </template>
  </AppModal>

  <BalonFormModal
    v-if="canCreateBalon"
    v-model="balonModalOpen"
    mode="create"
    @created="onBalonCreated"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import BalonFormModal from '@/modules/balones/cilindros/components/BalonFormModal.vue'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import type {
  Balon,
  BalonListFilters,
} from '@/modules/balones/cilindros/interfaces/balon.interface'
import {
  useCreateMantenimientoMutation,
  useUpdateMantenimientoMutation,
} from '@/modules/balones/mantenimientos/composables/useMantenimientoMutations'
import { useMantenimientoQuery } from '@/modules/balones/mantenimientos/composables/useMantenimientosQuery'
import type { MantenimientoFormMode } from '@/modules/balones/mantenimientos/interfaces/mantenimiento.interface'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppCheckbox, AppInput, AppModal, AppSelect, AppSelectSearch, AppTextarea } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'

interface MantenimientoFormModalProps {
  mode: MantenimientoFormMode
  mantenimientoId?: number | null
}

const props = defineProps<MantenimientoFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateMantenimientoMutation()
const updateMutation = useUpdateMantenimientoMutation()

const canCreateBalon = computed(() => authStore.hasPermission(PermisoBanderas.BALONES_CREAR))
const balonModalOpen = ref(false)
const balonBuscar = ref('')

const mantenimientoIdRef = computed(() => (props.mode === 'edit' ? props.mantenimientoId : null))
const mantenimientoQuery = useMantenimientoQuery(mantenimientoIdRef)
const isLoadingMantenimiento = computed(
  () => props.mode === 'edit' && open.value && mantenimientoQuery.isFetching.value,
)
const mantenimientoDetalle = computed(() => mantenimientoQuery.data.value ?? null)

const balonesFilters = ref<BalonListFilters>({ pagina: 1, limite: 50 })
const balonesQuery = useBalonesQuery(balonesFilters)

let balonBuscarTimeout: ReturnType<typeof setTimeout> | undefined

watch(balonBuscar, (term) => {
  clearTimeout(balonBuscarTimeout)
  balonBuscarTimeout = setTimeout(() => {
    balonesFilters.value = {
      pagina: 1,
      limite: 50,
      buscar: term.trim() || undefined,
    }
  }, 350)
})

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const listaTipoMantenimientoId = ref(ListaIds.TIPO_MANTENIMIENTO)
const listaEstadoMantenimientoId = ref(ListaIds.ESTADO_MANTENIMIENTO)
const listaOrganoInspectorId = ref(ListaIds.ORGANO_INSPECTOR_CILINDRO)
const tiposMantenimientoQuery = useListaOpcionesQuery(listaTipoMantenimientoId)
const estadosMantenimientoQuery = useListaOpcionesQuery(listaEstadoMantenimientoId)
const organoInspectorQuery = useListaOpcionesQuery(listaOrganoInspectorId)

function formatBalonOptionLabel(balon: Balon): string {
  const parts = [balon.codigo_balon]
  if (balon.nombre_tipo_balon) {
    parts.push(balon.nombre_tipo_balon)
  }

  const propietario = (balon.nombre_propietario ?? '').toUpperCase()
  if (propietario === 'CLIENTE') {
    const cliente =
      balon.nombre_cliente_propietario?.trim() ||
      balon.nombre_cliente_ubicacion?.trim() ||
      'cliente'
    parts.push(`Propio de ${cliente}`)
  } else if ((balon.nombre_estado_balon ?? '').toUpperCase() === 'PRESTADO_CLIENTE') {
    const cliente = balon.nombre_cliente_ubicacion?.trim()
    parts.push(cliente ? `Prestado a ${cliente}` : 'Prestado a cliente')
  }

  return parts.join(' · ')
}

const balonOptions = computed(() =>
  (balonesQuery.data.value?.data ?? []).map((balon) => ({
    value: balon.id,
    label: formatBalonOptionLabel(balon),
  })),
)

async function onBalonCreated(balon: Balon) {
  balonBuscar.value = balon.codigo_balon
  balonesFilters.value = {
    pagina: 1,
    limite: 50,
    buscar: balon.codigo_balon,
  }
  await balonesQuery.refetch()
  idBalon.value = balon.id
  balonModalOpen.value = false
}

const tipoMantenimientoOptions = computed(() => [
  { value: '', label: 'Sin tipo' },
  ...toSelectOptions(tiposMantenimientoQuery.data.value),
])

const esTipoPh = computed(() => {
  const tipoId = idTipoMantenimiento.value
  if (!tipoId) return false
  const opcion = tiposMantenimientoQuery.data.value?.find((item) => item.id === Number(tipoId))
  const nombre = opcion?.nombre?.toUpperCase() ?? ''
  return nombre === 'PRUEBA_HIDROSTATICA' || nombre === 'RECERTIFICACION'
})

const vigenciaPhOptions = [
  { label: '5 años', value: 5 },
  { label: '10 años', value: 10 },
]

const organoInspectorOptions = computed(() =>
  toSelectOptions(
    organoInspectorQuery.data.value?.filter(
      (opcion) => opcion.nombre?.toUpperCase() !== 'NO_APLICA',
    ),
  ),
)

const estadoMantenimientoOptions = computed(() => {
  const opciones = (estadosMantenimientoQuery.data.value ?? []).filter(
    (opcion) => (opcion.nombre ?? '').toUpperCase() !== 'FINALIZADO',
  )
  return [
    {
      value: '',
      label: props.mode === 'create' ? 'Pendiente (automático)' : 'Sin cambiar',
    },
    ...toSelectOptions(opciones),
  ]
})

const proveedorOptions = computed(() => [
  { value: '', label: 'Sin proveedor' },
  ...(clientesQuery.data.value?.data ?? []).map((cliente) => ({
    value: cliente.id,
    label:
      cliente.razon_social ||
      [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
      cliente.numero_documento,
  })),
])

const today = () => new Date().toISOString().slice(0, 10)
const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')

const optionalSelectNumber = () =>
  yup
    .mixed<string | number>()
    .transform((value) => (value === '' ? undefined : value))
    .optional()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idBalon: optionalSelectNumber(),
      idTipoMantenimiento: optionalSelectNumber(),
      idEstado: optionalSelectNumber(),
      fechaIngreso: requiredString('La fecha de ingreso'),
      fechaSalida: optionalString(),
      descripcion: optionalString().max(500, 'Máximo 500 caracteres'),
      costo: optionalNumber().min(0, 'Debe ser mayor o igual a cero'),
      esExterno: yup.boolean().optional(),
      idProveedor: optionalSelectNumber(),
      idComprobanteVenta: optionalNumber().min(1, 'ID inválido'),
      idComprobanteCompra: optionalNumber().min(1, 'ID inválido'),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
      vigenciaPhAnios: optionalNumber(),
      idOrganoInspector: optionalNumber(),
      organoInspectorNoAplica: yup.boolean().optional(),
      numeroCertificadoPh: optionalString().max(50, 'Máximo 50 caracteres'),
    }),
  ),
  initialValues: {
    idBalon: '' as string | number,
    idTipoMantenimiento: '' as string | number,
    idEstado: '' as string | number,
    fechaIngreso: today(),
    fechaSalida: '',
    descripcion: '',
    costo: undefined as number | undefined,
    esExterno: false,
    idProveedor: '' as string | number,
    idComprobanteVenta: undefined as number | undefined,
    idComprobanteCompra: undefined as number | undefined,
    observacion: '',
    vigenciaPhAnios: undefined as number | undefined,
    idOrganoInspector: undefined as number | undefined,
    organoInspectorNoAplica: false,
    numeroCertificadoPh: '',
  },
})

const [idBalon, idBalonAttrs] = defineField('idBalon')
const [idTipoMantenimiento, idTipoMantenimientoAttrs] = defineField('idTipoMantenimiento')
const [idEstado, idEstadoAttrs] = defineField('idEstado')
const [fechaIngreso, fechaIngresoAttrs] = defineField('fechaIngreso')
const [fechaSalida, fechaSalidaAttrs] = defineField('fechaSalida')
const [descripcion, descripcionAttrs] = defineField('descripcion')
const [costo, costoAttrs] = defineField('costo')
const [esExterno] = defineField('esExterno')
const [idProveedor, idProveedorAttrs] = defineField('idProveedor')
const [idComprobanteVenta, idComprobanteVentaAttrs] = defineField('idComprobanteVenta')
const [idComprobanteCompra, idComprobanteCompraAttrs] = defineField('idComprobanteCompra')
const [observacion, observacionAttrs] = defineField('observacion')
const [vigenciaPhAnios, vigenciaPhAniosAttrs] = defineField('vigenciaPhAnios')
const [idOrganoInspector, idOrganoInspectorAttrs] = defineField('idOrganoInspector')
const [organoInspectorNoAplica] = defineField('organoInspectorNoAplica')
const [numeroCertificadoPh, numeroCertificadoPhAttrs] = defineField('numeroCertificadoPh')

const toOptionalNumber = (value: string | number | undefined) =>
  value !== '' && value != null ? Number(value) : undefined

const buildPayloadFields = (values: {
  idTipoMantenimiento?: string | number
  idEstado?: string | number
  fechaIngreso?: string
  fechaSalida?: string
  descripcion?: string
  costo?: number
  esExterno?: boolean
  idProveedor?: string | number
  idComprobanteVenta?: number
  idComprobanteCompra?: number
  observacion?: string
  vigenciaPhAnios?: number
  idOrganoInspector?: number
  organoInspectorNoAplica?: boolean
  numeroCertificadoPh?: string
}) => ({
  idTipoMantenimiento: toOptionalNumber(values.idTipoMantenimiento),
  idEstado: toOptionalNumber(values.idEstado),
  fechaIngreso: values.fechaIngreso || undefined,
  fechaSalida: values.fechaSalida || undefined,
  descripcion: values.descripcion || undefined,
  costo: values.costo,
  esExterno: values.esExterno ?? false,
  idProveedor: values.esExterno ? toOptionalNumber(values.idProveedor) : undefined,
  idComprobanteVenta: values.idComprobanteVenta ? Number(values.idComprobanteVenta) : undefined,
  idComprobanteCompra: values.idComprobanteCompra ? Number(values.idComprobanteCompra) : undefined,
  observacion: values.observacion || undefined,
  ...(esTipoPh.value
    ? {
        vigenciaPhAnios: values.vigenciaPhAnios,
        idOrganoInspector: values.organoInspectorNoAplica
          ? undefined
          : values.idOrganoInspector,
        organoInspectorNoAplica: values.organoInspectorNoAplica ?? false,
        numeroCertificadoPh: values.numeroCertificadoPh || undefined,
      }
    : {}),
})

const syncFormValues = () => {
  const data = mantenimientoDetalle.value
  resetForm({
    values: {
      idBalon: data?.id_balon ?? '',
      idTipoMantenimiento: data?.id_tipo_mantenimiento ?? '',
      idEstado: data?.id_estado ?? '',
      fechaIngreso: toDateInput(data?.fecha_ingreso) || today(),
      fechaSalida: toDateInput(data?.fecha_salida),
      descripcion: data?.descripcion ?? '',
      costo: data?.costo ?? undefined,
      esExterno: data?.es_externo ?? false,
      idProveedor: data?.id_proveedor ?? '',
      idComprobanteVenta: data?.id_comprobante_venta ?? undefined,
      idComprobanteCompra: data?.id_comprobante_compra ?? undefined,
      observacion: data?.observacion ?? '',
      vigenciaPhAnios: undefined,
      idOrganoInspector: undefined,
      organoInspectorNoAplica: false,
      numeroCertificadoPh: '',
    },
  })
}

const resetCreateForm = () => {
  balonBuscar.value = ''
  balonesFilters.value = { pagina: 1, limite: 50 }
  resetForm({
    values: {
      idBalon: '',
      idTipoMantenimiento: '',
      idEstado: '',
      fechaIngreso: today(),
      fechaSalida: '',
      descripcion: '',
      costo: undefined,
      esExterno: false,
      idProveedor: '',
      idComprobanteVenta: undefined,
      idComprobanteCompra: undefined,
      observacion: '',
      vigenciaPhAnios: undefined,
      idOrganoInspector: undefined,
      organoInspectorNoAplica: false,
      numeroCertificadoPh: '',
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
      const idBalonValue = toOptionalNumber(values.idBalon)
      if (!idBalonValue || !values.fechaIngreso) return

      await createMutation.mutateAsync({
        ...fields,
        idUsuarioAuditoria: currentUserId,
        idBalon: idBalonValue,
        fechaIngreso: values.fechaIngreso,
      })
    } else if (props.mantenimientoId) {
      await updateMutation.mutateAsync({
        id: props.mantenimientoId,
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
  () => [open.value, props.mode, props.mantenimientoId] as const,
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
  () => mantenimientoQuery.data.value,
  () => {
    if (open.value && props.mode === 'edit') {
      syncFormValues()
    }
  },
)

watch(esExterno, (value) => {
  if (!value) {
    idProveedor.value = ''
  }
})

watch(organoInspectorNoAplica, (noAplica) => {
  if (noAplica) {
    idOrganoInspector.value = undefined
  }
})
</script>

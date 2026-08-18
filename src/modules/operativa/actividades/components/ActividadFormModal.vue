<template>
  <AppModal
    v-model="open"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    size="lg"
    @close="handleClose"
  >
    <form id="actividad-form" class="space-y-4" autocomplete="off" @submit="onSubmit">
      <AppInput
        v-model="titulo"
        label="Título"
        placeholder="Entrega de Oxígeno Medicinal"
        required
        v-bind="tituloAttrs"
        :disabled="isSubmitting"
        :error="errors.titulo"
      />

      <AppTextarea
        v-model="descripcion"
        label="Descripción"
        placeholder="Describe brevemente la actividad..."
        :rows="3"
        v-bind="descripcionAttrs"
        :disabled="isSubmitting"
        :error="errors.descripcion"
      />

      <div class="grid gap-3 sm:grid-cols-2">
        <SearchableSelect
          v-model="idCliente"
          label="Cliente"
          placeholder="Busca por razón social, nombres o documento..."
          empty-option-label="Sin cliente asignado"
          :model-label="clienteLabelActual"
          v-bind="idClienteAttrs"
          :disabled="isSubmitting || lockCliente"
          :error="errors.idCliente"
          :search-fn="searchClientes"
          :required="esTipoReparto"
        />

        <SearchableSelect
          v-if="!esTipoReparto"
          v-model="idUsuarioResponsable"
          label="Usuario responsable"
          placeholder="Busca por nombre..."
          required
          :clearable="false"
          :model-label="usuarioLabelActual"
          v-bind="idUsuarioResponsableAttrs"
          :disabled="isSubmitting"
          :error="errors.idUsuarioResponsable"
          :search-fn="searchUsuarios"
        />

        <SearchableSelect
          v-else
          v-model="idChoferResponsable"
          label="Chofer / repartidor"
          placeholder="Busca chofer de flota propia..."
          required
          :clearable="false"
          :model-label="choferLabelActual"
          v-bind="idChoferResponsableAttrs"
          :disabled="isSubmitting"
          :error="errors.idChoferResponsable"
          :search-fn="searchChoferesFlota"
        />
      </div>

      <div v-if="esTipoReparto && !lockTipoReparto" class="grid gap-3 sm:grid-cols-1">
        <SearchableSelect
          v-model="idUsuarioResponsable"
          label="Usuario responsable (opcional)"
          placeholder="Acompañante interno, si aplica..."
          empty-option-label="Sin usuario interno"
          :model-label="usuarioLabelActual"
          v-bind="idUsuarioResponsableAttrs"
          :disabled="isSubmitting"
          :error="errors.idUsuarioResponsable"
          :search-fn="searchUsuarios"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <AppSelect
          v-model="idTipoActividad"
          label="Tipo de actividad"
          :placeholder="tipoActividadQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
          required
          v-bind="idTipoActividadAttrs"
          :disabled="isSubmitting || tipoActividadQuery.isLoading.value || lockTipoReparto"
          :error="errors.idTipoActividad"
          :options="tipoActividadOptions"
        />

        <AppSelect
          v-model="idPrioridad"
          label="Prioridad"
          :placeholder="prioridadQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
          required
          v-bind="idPrioridadAttrs"
          :disabled="isSubmitting || prioridadQuery.isLoading.value"
          :error="errors.idPrioridad"
          :options="prioridadOptions"
        />

        <AppSelect
          v-model="idEstadoActividad"
          label="Estado"
          :placeholder="estadoActividadQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
          required
          v-bind="idEstadoActividadAttrs"
          :disabled="isSubmitting || estadoActividadQuery.isLoading.value"
          :error="errors.idEstadoActividad"
          :options="estadoActividadOptions"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <AppInput
          v-model="fechaProgramada"
          type="date"
          label="Fecha programada"
          required
          v-bind="fechaProgramadaAttrs"
          :disabled="isSubmitting"
          :error="errors.fechaProgramada"
        />

        <AppTimePicker
          v-model="horaInicioEstimada"
          label="Hora de inicio"
          required
          v-bind="horaInicioEstimadaAttrs"
          :disabled="isSubmitting"
          :error="errors.horaInicioEstimada"
        />

        <AppTimePicker
          v-model="horaFinEstimada"
          label="Hora de fin"
          required
          v-bind="horaFinEstimadaAttrs"
          :disabled="isSubmitting"
          :error="errors.horaFinEstimada"
        />
      </div>

      <AppInput
        v-if="mode === 'edit'"
        v-model="fechaHoraCierre"
        type="datetime-local"
        label="Fecha y hora de cierre"
        hint="Déjalo vacío si la actividad aún no se ha cerrado."
        v-bind="fechaHoraCierreAttrs"
        :disabled="isSubmitting"
        :error="errors.fechaHoraCierre"
      />

      <div v-if="itemsPreview.length || defaultIdComprobante" class="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
        <p class="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">
          Ítems del reparto
          <span v-if="comprobanteLabel" class="ml-1 text-xs font-normal text-gray-500">
            ({{ comprobanteLabel }})
          </span>
        </p>
        <p v-if="!itemsPreview.length" class="text-xs text-gray-500 dark:text-gray-400">
          Se copiarán los ítems del comprobante al guardar.
        </p>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="text-left text-xs text-gray-500">
              <tr>
                <th class="py-1 pr-3">Producto</th>
                <th class="py-1 text-right">Cant.</th>
                <th class="py-1 pl-3">Balón</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in itemsPreview"
                :key="item.id ?? `${item.id_producto}-${idx}`"
                class="border-t border-gray-100 dark:border-gray-800"
              >
                <td class="py-1.5 pr-3 text-gray-800 dark:text-white/90">
                  {{ item.descripcion || item.nombre_producto || '—' }}
                </td>
                <td class="py-1.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                  {{ item.cantidad }}
                </td>
                <td class="py-1.5 pl-3 text-gray-500">{{ item.codigo_balon || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <AppTextarea
        v-model="observaciones"
        label="Observaciones"
        placeholder="Observaciones adicionales..."
        :rows="2"
        v-bind="observacionesAttrs"
        :disabled="isSubmitting"
        :error="errors.observaciones"
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
        form="actividad-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear actividad' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import {
  useCreateActividadMutation,
  useUpdateActividadMutation,
} from '@/modules/operativa/actividades/composables/useActividadMutations'
import { useActividadDetailQuery } from '@/modules/operativa/actividades/composables/useActividadDetailQuery'
import type {
  Actividad,
  ActividadFormMode,
  ActividadItem,
  ActividadItemPayload,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { horaFinEsPosterior } from '@/modules/operativa/actividades/utils/actividadHorario'
import {
  esTipoRepartoNombre,
  idOpcionPorNombre,
  nombreChoferCompleto,
} from '@/modules/operativa/actividades/utils/actividadTipo'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { usuariosService } from '@/modules/usuarios/services/usuarios.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppTextarea, AppTimePicker } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import { ListaIds } from '@/shared/constants/lista-ids'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalString, requiredString } from '@/shared/validation'

interface ActividadFormModalProps {
  mode: ActividadFormMode
  actividad?: Actividad | null
  /** Fecha (YYYY-MM-DD) sugerida al crear desde el calendario. */
  defaultFecha?: string | null
  lockTipoReparto?: boolean
  defaultTitulo?: string | null
  defaultClienteId?: number | null
  defaultClienteLabel?: string | null
  defaultIdComprobante?: number | null
  defaultItems?: ActividadItem[]
}

const props = withDefaults(defineProps<ActividadFormModalProps>(), {
  lockTipoReparto: false,
  defaultItems: () => [],
})

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()

const createMutation = useCreateActividadMutation()
const updateMutation = useUpdateActividadMutation()
const idReferencia = computed(() => props.actividad?.id)
const actividadDetailQuery = useActividadDetailQuery(idReferencia, open)
const actividadActual = computed<Actividad | null>(
  () => actividadDetailQuery.data.value ?? props.actividad ?? null,
)

const lockCliente = computed(() => Boolean(props.lockTipoReparto && props.defaultClienteId))

const modalTitle = computed(() => {
  if (props.mode === 'edit') return 'Editar actividad'
  return props.lockTipoReparto ? 'Nuevo reparto' : 'Nueva actividad'
})

const modalSubtitle = computed(() => {
  if (props.mode === 'edit') return 'Actualiza los datos de la actividad seleccionada.'
  if (props.lockTipoReparto) return 'Programa la entrega a partir de la venta.'
  return 'Programa una actividad de la agenda operativa.'
})

const getClienteNombre = (cliente: Cliente) => {
  const esJuridica = cliente.nombre_tipo_persona?.toLowerCase().includes('jurí')

  if (esJuridica && cliente.razon_social) {
    return cliente.razon_social
  }

  const nombreCompleto = [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || cliente.razon_social || cliente.numero_documento
}

const searchClientes = async (query: string): Promise<SelectOption[]> => {
  const response = await clientesService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
    soloActivos: 1,
  })

  return response.data.map((cliente) => ({
    value: cliente.id,
    label: getClienteNombre(cliente),
  }))
}

const searchUsuarios = async (query: string): Promise<SelectOption[]> => {
  const response = await usuariosService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
    estado: 'activos',
  })

  return response.data.map((usuario) => ({
    value: usuario.id,
    label: usuario.nombre,
  }))
}

const searchChoferesFlota = async (query: string): Promise<SelectOption[]> => {
  const response = await choferesService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
    idCliente: -1,
    isActivos: 1,
  })

  return response.data.map((chofer) => ({
    value: chofer.id,
    label: nombreChoferCompleto(chofer) || chofer.numero_documento,
  }))
}

const listaTipoActividadId = computed(() => ListaIds.TIPO_ACTIVIDAD)
const tipoActividadQuery = useListaOpcionesQuery(listaTipoActividadId)
const tipoActividadOptions = computed(() => toSelectOptions(tipoActividadQuery.data.value))

const tipoRepartoId = computed(
  () =>
    tipoActividadQuery.data.value?.find((o) => esTipoRepartoNombre(o.nombre))?.id ??
    idOpcionPorNombre(tipoActividadQuery.data.value, ['REPARTO']),
)

const defaultPrioridadId = computed(
  () =>
    idOpcionPorNombre(prioridadQuery.data.value, ['MEDIA', 'NORMAL', 'MEDIA_PRIORIDAD']) ??
    prioridadQuery.data.value?.[0]?.id,
)

const defaultEstadoId = computed(() => {
  const items = estadoActividadQuery.data.value
  return (
    idOpcionPorNombre(items, ['PENDIENTE', 'PROGRAMADA', 'PENDIENTE_REALIZAR']) ??
    items?.find((o) => !['REALIZADA', 'CANCELADA'].includes((o.nombre ?? '').trim().toUpperCase()))
      ?.id ??
    items?.[0]?.id
  )
})

const listaPrioridadId = computed(() => ListaIds.PRIORIDAD_ACTIVIDAD)
const prioridadQuery = useListaOpcionesQuery(listaPrioridadId)
const prioridadOptions = computed(() => toSelectOptions(prioridadQuery.data.value))

const listaEstadoActividadId = computed(() => ListaIds.ESTADO_ACTIVIDAD)
const estadoActividadQuery = useListaOpcionesQuery(listaEstadoActividadId)
const estadoActividadOptions = computed(() => toSelectOptions(estadoActividadQuery.data.value))

const clienteLabelActual = computed(
  () =>
    actividadActual.value?.razon_social_cliente ??
    props.defaultClienteLabel ??
    null,
)
const usuarioLabelActual = computed(
  () => actividadActual.value?.nombre_usuario_responsable ?? null,
)
const choferLabelActual = computed(
  () => actividadActual.value?.nombre_chofer_responsable ?? null,
)

const comprobanteLabel = computed(() => {
  const serie = actividadActual.value?.serie_comprobante
  const numero = actividadActual.value?.numero_comprobante
  if (serie && numero) return `${serie}-${numero}`
  return props.defaultIdComprobante ? `Comprobante #${props.defaultIdComprobante}` : null
})

const itemsPreview = computed<ActividadItem[]>(() => {
  const fromActividad = actividadActual.value?.items
  if (fromActividad?.length) return fromActividad
  return props.defaultItems ?? []
})

const defaultIdComprobante = computed(
  () => actividadActual.value?.id_comprobante ?? props.defaultIdComprobante ?? null,
)

function esRepartoSeleccionado(idTipo?: number | null) {
  if (props.lockTipoReparto) return true
  if (!idTipo) return false
  if (tipoRepartoId.value && Number(idTipo) === tipoRepartoId.value) return true
  return esTipoRepartoNombre(
    tipoActividadQuery.data.value?.find((o) => o.id === Number(idTipo))?.nombre,
  )
}

const { defineField, handleSubmit, resetForm, errors, isSubmitting, validateField, setFieldValue } =
  useForm({
    validationSchema: toTypedSchema(
      yup.object({
        titulo: requiredString('El título'),
        descripcion: optionalString(),
        idCliente: yup
          .number()
          .nullable()
          .test('cliente-si-reparto', 'El cliente es obligatorio en un reparto', function (value) {
            const idTipo = (this.parent as { idTipoActividad?: number }).idTipoActividad
            if (!esRepartoSeleccionado(idTipo)) return true
            return value != null && Number(value) > 0
          }),
        idUsuarioResponsable: yup
          .number()
          .nullable()
          .test(
            'usuario-si-no-reparto',
            'El usuario responsable es obligatorio',
            function (value) {
              const idTipo = (this.parent as { idTipoActividad?: number }).idTipoActividad
              if (esRepartoSeleccionado(idTipo)) return true
              return value != null && Number(value) > 0
            },
          ),
        idChoferResponsable: yup
          .number()
          .nullable()
          .test(
            'chofer-si-reparto',
            'El chofer / repartidor es obligatorio',
            function (value) {
              const idTipo = (this.parent as { idTipoActividad?: number }).idTipoActividad
              if (!esRepartoSeleccionado(idTipo)) return true
              return value != null && Number(value) > 0
            },
          ),
        idTipoActividad: yup
          .number()
          .required('El tipo de actividad es obligatorio')
          .test('tipo-catalogo', 'El tipo de actividad no es válido', (value) => {
            const opciones = tipoActividadOptions.value
            if (!value || !opciones.length) return true
            return opciones.some((option) => Number(option.value) === Number(value))
          }),
        idPrioridad: yup
          .number()
          .required('La prioridad es obligatoria')
          .test('prioridad-catalogo', 'La prioridad no es válida', (value) => {
            const opciones = prioridadOptions.value
            if (!value || !opciones.length) return true
            return opciones.some((option) => Number(option.value) === Number(value))
          }),
        idEstadoActividad: yup
          .number()
          .required('El estado es obligatorio')
          .test('estado-catalogo', 'El estado no es válido', (value) => {
            const opciones = estadoActividadOptions.value
            if (!value || !opciones.length) return true
            return opciones.some((option) => Number(option.value) === Number(value))
          }),
        fechaProgramada: requiredString('La fecha programada'),
        horaInicioEstimada: requiredString('La hora de inicio'),
        horaFinEstimada: requiredString('La hora de fin').test(
          'hora-fin-mayor-hora-inicio',
          'La hora de fin debe ser posterior a la hora de inicio',
          function (value) {
            const horaInicio = (this.parent as { horaInicioEstimada?: string }).horaInicioEstimada
            return horaFinEsPosterior(horaInicio, value)
          },
        ),
        fechaHoraCierre: optionalString(),
        observaciones: optionalString(),
      }),
    ),
    initialValues: {
      titulo: '',
      descripcion: '',
      idCliente: undefined as number | undefined,
      idUsuarioResponsable: undefined as number | undefined,
      idChoferResponsable: undefined as number | undefined,
      idTipoActividad: undefined as number | undefined,
      idPrioridad: undefined as number | undefined,
      idEstadoActividad: undefined as number | undefined,
      fechaProgramada: '',
      horaInicioEstimada: '',
      horaFinEstimada: '',
      fechaHoraCierre: '',
      observaciones: '',
    },
  })

const [titulo, tituloAttrs] = defineField('titulo')
const [descripcion, descripcionAttrs] = defineField('descripcion')
const [idCliente, idClienteAttrs] = defineField('idCliente')
const [idUsuarioResponsable, idUsuarioResponsableAttrs] = defineField('idUsuarioResponsable')
const [idChoferResponsable, idChoferResponsableAttrs] = defineField('idChoferResponsable')
const [idTipoActividad, idTipoActividadAttrs] = defineField('idTipoActividad')
const [idPrioridad, idPrioridadAttrs] = defineField('idPrioridad')
const [idEstadoActividad, idEstadoActividadAttrs] = defineField('idEstadoActividad')
const [fechaProgramada, fechaProgramadaAttrs] = defineField('fechaProgramada')
const [horaInicioEstimada, horaInicioEstimadaAttrs] = defineField('horaInicioEstimada')
const [horaFinEstimada, horaFinEstimadaAttrs] = defineField('horaFinEstimada')
const [fechaHoraCierre, fechaHoraCierreAttrs] = defineField('fechaHoraCierre')
const [observaciones, observacionesAttrs] = defineField('observaciones')

const esTipoReparto = computed(() => {
  const id = Number(idTipoActividad.value)
  if (!id) return Boolean(props.lockTipoReparto)
  return (
    id === tipoRepartoId.value ||
    esTipoRepartoNombre(tipoActividadQuery.data.value?.find((o) => o.id === id)?.nombre)
  )
})

watch(horaInicioEstimada, () => {
  if (horaFinEstimada.value) {
    validateField('horaFinEstimada')
  }
})

watch(idTipoActividad, () => {
  void validateField('idCliente')
  void validateField('idUsuarioResponsable')
  void validateField('idChoferResponsable')
})

const syncFormValues = () => {
  const a = actividadActual.value

  resetForm({
    values: {
      titulo: a?.titulo ?? props.defaultTitulo ?? '',
      descripcion: a?.descripcion ?? '',
      idCliente: a?.id_cliente ?? props.defaultClienteId ?? undefined,
      idUsuarioResponsable: a?.id_usuario_responsable ?? undefined,
      idChoferResponsable: a?.id_chofer_responsable ?? undefined,
      idTipoActividad:
        a?.id_tipo_actividad ??
        (props.lockTipoReparto ? tipoRepartoId.value : undefined),
      idPrioridad: a?.id_prioridad ?? (props.lockTipoReparto ? defaultPrioridadId.value : undefined),
      idEstadoActividad:
        a?.id_estado_actividad ?? (props.lockTipoReparto ? defaultEstadoId.value : undefined),
      fechaProgramada: a?.fecha_programada?.slice(0, 10) ?? props.defaultFecha ?? '',
      horaInicioEstimada: a?.hora_inicio_estimada?.slice(0, 5) ?? '',
      horaFinEstimada: a?.hora_fin_estimada?.slice(0, 5) ?? '',
      fechaHoraCierre: a?.fecha_hora_cierre?.slice(0, 16) ?? '',
      observaciones: a?.observaciones ?? '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

function toItemPayload(items: ActividadItem[]): ActividadItemPayload[] {
  return items.map((item, idx) => ({
    item: item.item ?? idx + 1,
    idProducto: item.id_producto ?? undefined,
    descripcion: item.descripcion || item.nombre_producto || undefined,
    cantidad: Number(item.cantidad) || 1,
    idBalon: item.id_balon ?? undefined,
  }))
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  try {
    const itemsFromPreview =
      props.mode === 'create' && props.defaultItems?.length
        ? toItemPayload(props.defaultItems)
        : undefined

    const payload = {
      idUsuarioAuditoria: currentUserId,
      titulo: values.titulo,
      descripcion: values.descripcion || undefined,
      idCliente: values.idCliente ? Number(values.idCliente) : undefined,
      idUsuarioResponsable: values.idUsuarioResponsable
        ? Number(values.idUsuarioResponsable)
        : undefined,
      idChoferResponsable: values.idChoferResponsable
        ? Number(values.idChoferResponsable)
        : undefined,
      idComprobante: defaultIdComprobante.value ?? undefined,
      items: itemsFromPreview,
      idTipoActividad: Number(values.idTipoActividad),
      idPrioridad: Number(values.idPrioridad),
      idEstadoActividad: Number(values.idEstadoActividad),
      fechaProgramada: values.fechaProgramada,
      horaInicioEstimada: values.horaInicioEstimada,
      horaFinEstimada: values.horaFinEstimada,
      fechaHoraCierre: values.fechaHoraCierre || undefined,
      observaciones: values.observaciones || undefined,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.actividad) {
      await updateMutation.mutateAsync({
        id: props.actividad.id,
        payload,
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
      if (props.lockTipoReparto) {
        void tipoActividadQuery.refetch()
        void prioridadQuery.refetch()
        void estadoActividadQuery.refetch()
      }
    }
  },
)

watch(
  () => actividadDetailQuery.data.value,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)

watch(
  () => props.actividad,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)

watch(
  () => [props.defaultFecha, props.defaultTitulo, props.defaultClienteId, props.lockTipoReparto],
  () => {
    if (open.value && props.mode === 'create') {
      syncFormValues()
    }
  },
)

function aplicarDefaultsReparto() {
  if (!open.value || props.mode !== 'create' || !props.lockTipoReparto) return

  if (!idTipoActividad.value && tipoRepartoId.value) {
    setFieldValue('idTipoActividad', tipoRepartoId.value)
  }
  if (!idPrioridad.value && defaultPrioridadId.value) {
    setFieldValue('idPrioridad', defaultPrioridadId.value)
  }
  if (!idEstadoActividad.value && defaultEstadoId.value) {
    setFieldValue('idEstadoActividad', defaultEstadoId.value)
  }
}

watch(
  [
    tipoRepartoId,
    defaultPrioridadId,
    defaultEstadoId,
    () => open.value,
    () => props.lockTipoReparto,
  ],
  () => aplicarDefaultsReparto(),
)
</script>

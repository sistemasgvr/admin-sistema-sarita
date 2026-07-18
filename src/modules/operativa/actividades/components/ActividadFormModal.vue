<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva actividad' : 'Editar actividad'"
    :subtitle="
      mode === 'create'
        ? 'Programa una actividad de la agenda operativa.'
        : 'Actualiza los datos de la actividad seleccionada.'
    "
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
          :disabled="isSubmitting"
          :error="errors.idCliente"
          :search-fn="searchClientes"
        />

        <SearchableSelect
          v-model="idUsuarioResponsable"
          label="Usuario responsable"
          placeholder="Busca por nombre..."
          empty-option-label="Sin responsable asignado"
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
          :disabled="isSubmitting || tipoActividadQuery.isLoading.value"
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

        <AppInput
          v-model="horaInicioEstimada"
          type="time"
          label="Hora de inicio"
          required
          v-bind="horaInicioEstimadaAttrs"
          :disabled="isSubmitting"
          :error="errors.horaInicioEstimada"
        />

        <AppInput
          v-model="horaFinEstimada"
          type="time"
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
import {
  useCreateActividadMutation,
  useUpdateActividadMutation,
} from '@/modules/operativa/actividades/composables/useActividadMutations'
import { useActividadDetailQuery } from '@/modules/operativa/actividades/composables/useActividadDetailQuery'
import type {
  Actividad,
  ActividadFormMode,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { usuariosService } from '@/modules/usuarios/services/usuarios.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppTextarea } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import { ListaIds } from '@/shared/constants/lista-ids'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalString, requiredString } from '@/shared/validation'

interface ActividadFormModalProps {
  mode: ActividadFormMode
  actividad?: Actividad | null
  /** Fecha (YYYY-MM-DD) sugerida al crear desde el calendario. */
  defaultFecha?: string | null
}

const props = defineProps<ActividadFormModalProps>()

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

const listaTipoActividadId = computed(() => ListaIds.TIPO_ACTIVIDAD)
const tipoActividadQuery = useListaOpcionesQuery(listaTipoActividadId)
const tipoActividadOptions = computed(() => toSelectOptions(tipoActividadQuery.data.value))

const listaPrioridadId = computed(() => ListaIds.PRIORIDAD_ACTIVIDAD)
const prioridadQuery = useListaOpcionesQuery(listaPrioridadId)
const prioridadOptions = computed(() => toSelectOptions(prioridadQuery.data.value))

const listaEstadoActividadId = computed(() => ListaIds.ESTADO_ACTIVIDAD)
const estadoActividadQuery = useListaOpcionesQuery(listaEstadoActividadId)
const estadoActividadOptions = computed(() => toSelectOptions(estadoActividadQuery.data.value))

// Label inicial ya embebido en el registro, evita una petición extra al abrir el modal.
const clienteLabelActual = computed(() => actividadActual.value?.razon_social_cliente ?? null)
const usuarioLabelActual = computed(
  () => actividadActual.value?.nombre_usuario_responsable ?? null,
)

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      titulo: requiredString('El título'),
      descripcion: optionalString(),
      idCliente: yup.number().optional().nullable(),
      idUsuarioResponsable: yup.number().optional().nullable(),
      idTipoActividad: yup.number().required('El tipo de actividad es obligatorio'),
      idPrioridad: yup.number().required('La prioridad es obligatoria'),
      idEstadoActividad: yup.number().required('El estado es obligatorio'),
      fechaProgramada: requiredString('La fecha programada'),
      horaInicioEstimada: requiredString('La hora de inicio'),
      horaFinEstimada: requiredString('La hora de fin'),
      fechaHoraCierre: optionalString(),
      observaciones: optionalString(),
    }),
  ),
  initialValues: {
    titulo: '',
    descripcion: '',
    idCliente: undefined as number | undefined,
    idUsuarioResponsable: undefined as number | undefined,
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
const [idTipoActividad, idTipoActividadAttrs] = defineField('idTipoActividad')
const [idPrioridad, idPrioridadAttrs] = defineField('idPrioridad')
const [idEstadoActividad, idEstadoActividadAttrs] = defineField('idEstadoActividad')
const [fechaProgramada, fechaProgramadaAttrs] = defineField('fechaProgramada')
const [horaInicioEstimada, horaInicioEstimadaAttrs] = defineField('horaInicioEstimada')
const [horaFinEstimada, horaFinEstimadaAttrs] = defineField('horaFinEstimada')
const [fechaHoraCierre, fechaHoraCierreAttrs] = defineField('fechaHoraCierre')
const [observaciones, observacionesAttrs] = defineField('observaciones')

const syncFormValues = () => {
  const a = actividadActual.value

  resetForm({
    values: {
      titulo: a?.titulo ?? '',
      descripcion: a?.descripcion ?? '',
      idCliente: a?.id_cliente ?? undefined,
      idUsuarioResponsable: a?.id_usuario_responsable ?? undefined,
      idTipoActividad: a?.id_tipo_actividad ?? undefined,
      idPrioridad: a?.id_prioridad ?? undefined,
      idEstadoActividad: a?.id_estado_actividad ?? undefined,
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

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  try {
    const payload = {
      idUsuarioAuditoria: currentUserId,
      titulo: values.titulo,
      descripcion: values.descripcion || undefined,
      idCliente: values.idCliente ? Number(values.idCliente) : undefined,
      idUsuarioResponsable: values.idUsuarioResponsable
        ? Number(values.idUsuarioResponsable)
        : undefined,
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
  () => props.defaultFecha,
  () => {
    if (open.value && props.mode === 'create') {
      syncFormValues()
    }
  },
)
</script>

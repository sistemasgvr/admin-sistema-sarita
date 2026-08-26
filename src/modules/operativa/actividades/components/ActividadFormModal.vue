<template>
  <AppModal
    v-model="open"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    size="lg"
    @close="handleClose"
  >
    <form id="actividad-form" class="space-y-4" autocomplete="off" @submit="onSubmit">
      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.clipboardList" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Datos generales</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Título y descripción de la actividad</p>
          </div>
        </header>

        <div class="space-y-3">
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
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.userCheck" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Asignación</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Cliente y responsable de la actividad</p>
          </div>
        </header>

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
            v-model="idTrabajadorResponsable"
            label="Responsable"
            :placeholder="'Busca trabajador...'"
            :clearable="esTipoReparto"
            empty-option-label="Sin responsable asignado"
            :model-label="responsableLabelActual"
            v-bind="idTrabajadorResponsableAttrs"
            :disabled="isSubmitting"
            :error="errors.idTrabajadorResponsable"
            :search-fn="searchResponsable"
          />
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.tags" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Clasificación</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tipo, prioridad y estado</p>
          </div>
        </header>

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
      </section>

      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.calendarRange" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Programación</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Fecha, horario y cierre</p>
          </div>
        </header>

        <div class="space-y-3">
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
        </div>
      </section>

      <section
        v-if="itemsPreview.length || defaultIdComprobante || defaultIdGuiaRemision"
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
      >
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.boxes" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Ítems del reparto
              <span v-if="comprobanteLabel" class="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                ({{ comprobanteLabel }})
              </span>
              <span v-if="guiaRemisionLabel" class="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                (GRE {{ guiaRemisionLabel }})
              </span>
            </h4>
          </div>
        </header>

        <p v-if="!itemsPreview.length" class="text-xs text-gray-500 dark:text-gray-400">
          Se copiarán los ítems del comprobante al guardar.
        </p>
        <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table class="min-w-full text-sm">
            <thead class="bg-white text-left text-xs text-gray-500 dark:bg-gray-900/40">
              <tr>
                <th class="px-3 py-2">Producto</th>
                <th class="px-3 py-2 text-right">Cant.</th>
                <th class="px-3 py-2">Balón</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900/20">
              <tr
                v-for="(item, idx) in itemsPreview"
                :key="item.id ?? `${item.id_producto}-${idx}`"
                class="border-t border-gray-100 dark:border-gray-800"
              >
                <td class="px-3 py-2 text-gray-800 dark:text-white/90">
                  {{ item.descripcion || item.nombre_producto || '—' }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                  {{ item.cantidad }}
                </td>
                <td class="px-3 py-2 text-gray-500">{{ item.codigo_balon || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.messageSquare" :size="16" />
          </span>
          <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Observaciones</h4>
        </header>

        <AppTextarea
          v-model="observaciones"
          placeholder="Observaciones adicionales..."
          :rows="2"
          v-bind="observacionesAttrs"
          :disabled="isSubmitting"
          :error="errors.observaciones"
        />
      </section>
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
} from '@/modules/operativa/actividades/utils/actividadTipo'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { trabajadoresService } from '@/modules/trabajadores/services/trabajadores.service'
import type { Trabajador } from '@/modules/trabajadores/interfaces/trabajador.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppTextarea, AppTimePicker } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalString, requiredString } from '@/shared/validation'

interface ActividadFormModalProps {
  mode: ActividadFormMode
  actividad?: Actividad | null
  defaultFecha?: string | null
  lockTipoReparto?: boolean
  defaultTitulo?: string | null
  defaultClienteId?: number | null
  defaultClienteLabel?: string | null
  defaultChoferId?: number | null
  defaultChoferLabel?: string | null
  defaultTrabajadorId?: number | null
  defaultIdComprobante?: number | null
  defaultIdGuiaRemision?: number | null
  defaultGuiaRemisionLabel?: string | null
  defaultDescripcion?: string | null
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



const getTrabajadorNombre = (t: Trabajador) =>
  [t.nombres, t.apellido_paterno, t.apellido_materno].filter(Boolean).join(' ').trim() || t.nombres

const searchResponsable = async (query: string): Promise<SelectOption[]> => {
  const response = await trabajadoresService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
    estado: 1,
  })
  return response.data.map((t) => ({
    value: t.id,
    label: getTrabajadorNombre(t),
    badges: [
      {
        label: t.es_chofer ? 'Chofer' : (t.nombre_cargo || 'Trabajador'),
        color: t.es_chofer ? 'warning' : 'neutral',
      },
    ],
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

const responsableLabelActual = computed(
  () =>
    actividadActual.value?.nombre_trabajador_responsable ??
    actividadActual.value?.nombre_chofer_responsable ??
    actividadActual.value?.nombre_usuario_responsable ??
    props.defaultChoferLabel ??
    null,
)

const comprobanteLabel = computed(() => {
  const serie = actividadActual.value?.serie_comprobante
  const numero = actividadActual.value?.numero_comprobante
  if (serie && numero) return `${serie}-${numero}`
  return props.defaultIdComprobante ? `Comprobante #${props.defaultIdComprobante}` : null
})

const guiaRemisionLabel = computed(() => {
  const serie = actividadActual.value?.serie_guia_remision
  const numero = actividadActual.value?.numero_guia_remision
  if (serie && numero) return `${serie}-${numero}`
  return props.defaultIdGuiaRemision ? `GRE #${props.defaultIdGuiaRemision}` : null
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
        idTrabajadorResponsable: yup.number().nullable(),
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
      idTrabajadorResponsable: undefined as number | undefined,
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
const [idTrabajadorResponsable, idTrabajadorResponsableAttrs] = defineField('idTrabajadorResponsable')
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
  void validateField('idTrabajadorResponsable')
})

const syncFormValues = () => {
  const a = actividadActual.value

  resetForm({
    values: {
      titulo: a?.titulo ?? props.defaultTitulo ?? '',
      descripcion: a?.descripcion ?? props.defaultDescripcion ?? '',
      idCliente: a?.id_cliente ?? props.defaultClienteId ?? undefined,
      idTrabajadorResponsable:
        a?.id_trabajador_responsable ??
        props.defaultTrabajadorId ??
        undefined,
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

  if (
    !a &&
    props.mode === 'create' &&
    props.defaultChoferId &&
    !props.defaultTrabajadorId
  ) {
    choferesService
      .obtenerPorId(props.defaultChoferId)
      .then((c) => {
        if (c.id_trabajador) setFieldValue('idTrabajadorResponsable', c.id_trabajador)
      })
      .catch(() => {})
  }
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
      idTrabajadorResponsable: values.idTrabajadorResponsable
        ? Number(values.idTrabajadorResponsable)
        : undefined,
      idComprobante: defaultIdComprobante.value ?? undefined,
      idGuiaRemision: props.defaultIdGuiaRemision ?? undefined,
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
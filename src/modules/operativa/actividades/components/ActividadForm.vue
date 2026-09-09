<template>
  <div class="space-y-4">
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
            :disabled="isSubmitting || tipoActividadQuery.isLoading.value || lockTipoReparto || lockTipoRecojo"
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
            :disabled="
              isSubmitting ||
              estadoActividadQuery.isLoading.value ||
              estadoActividadBloqueado
            "
            :error="errors.idEstadoActividad"
            :hint="
              estadoActividadBloqueado
                ? 'EN_RUTA, REALIZADA y CANCELADA solo cambian con las acciones de entrega.'
                : 'Solo pendiente/programada. El flujo operativo usa las acciones de entrega.'
            "
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
              :required="!esTipoRecojo"
              :hint="
                esTipoRecojo
                  ? 'Opcional en recojo; puedes definirla al culminar la actividad.'
                  : undefined
              "
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
        v-if="mode === 'create' && esTipoReparto"
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
      >
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.fileText" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Orden de salida</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              El detalle del reparto se toma de la orden (venta / préstamo / propio)
            </p>
          </div>
        </header>

        <DocumentoSalidaSelectField
          v-model="idDocSalidaSeleccionado"
          label="Orden de salida"
          placeholder="Selecciona una orden disponible..."
          search-placeholder="Número o cliente..."
          codigo-tipo-orden="ORDEN_SALIDA_VENTA"
          :sin-actividad-vigente="true"
          :required="true"
          :disabled="isSubmitting || lockDocSalida"
          :error="errorDocSalida"
        />
      </section>

      <section
        v-if="mode === 'create' && esTipoRecojo"
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
      >
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.package" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Origen del recojo</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Préstamo o alquiler vencido con cilindros pendientes de devolver
            </p>
          </div>
        </header>

        <OrigenRecojoSelectField
          v-model="origenRecojoKey"
          label="Préstamo / alquiler vencido"
          placeholder="Selecciona un origen vencido..."
          search-placeholder="Número o cliente..."
          :required="true"
          :disabled="isSubmitting || lockOrigenRecojo"
          :error="errorOrigenRecojo"
          :prefill-label="prefillOrigenRecojoLabel"
        />

        <dl
          v-if="origenRecojoSeleccionado"
          class="mt-3 grid gap-2 rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-sm dark:border-gray-800 dark:bg-white/[0.03] sm:grid-cols-3"
        >
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">Cilindros pendientes</dt>
            <dd class="font-medium text-gray-800 dark:text-white/90">
              {{ origenRecojoSeleccionado.cilindros_pendientes ?? 0 }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">Garantías activas</dt>
            <dd class="font-medium text-gray-800 dark:text-white/90">
              {{ origenRecojoSeleccionado.garantias_activas ?? 0 }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">Regulador</dt>
            <dd class="font-medium text-gray-800 dark:text-white/90">
              {{ origenRecojoSeleccionado.regulador_pendiente ? 'Pendiente' : '—' }}
            </dd>
          </div>
        </dl>
      </section>

      <section
        v-if="itemsPreview.length || defaultIdComprobante || idDocSalidaEfectivo || detalleOrigenPreview.length"
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
      >
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.boxes" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {{ esTipoRecojo ? 'Detalle a recojer' : 'Ítems del reparto' }}
              <span v-if="comprobanteLabel" class="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                ({{ comprobanteLabel }})
              </span>
              <span v-if="docSalidaLabel" class="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                ({{ docSalidaLabel }})
              </span>
              <span
                v-if="origenRecojoLabel"
                class="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400"
              >
                ({{ origenRecojoLabel }})
              </span>
            </h4>
          </div>
        </header>

        <p v-if="docSalidaQuery.isFetching.value" class="text-xs text-gray-500 dark:text-gray-400">
          Cargando detalle de la orden...
        </p>
        <p
          v-else-if="esTipoRecojo && !itemsPreview.length && !detalleOrigenPreview.length"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          El detalle se leerá del origen al guardar; los ítems se materializan al iniciar la verificación.
        </p>
        <p v-else-if="!itemsPreview.length && !detalleOrigenPreview.length" class="text-xs text-gray-500 dark:text-gray-400">
          Se copiarán los ítems de la orden de salida al guardar.
        </p>
        <div
          v-else
          class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800"
        >
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
              <tr>
                <th class="px-3 py-2 font-medium">Producto</th>
                <th class="px-3 py-2 font-medium">Tipo / gas</th>
                <th class="px-3 py-2 text-right font-medium">Cant.</th>
                <th class="px-3 py-2 font-medium">Balón</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900/20">
              <tr
                v-for="(item, idx) in itemsTablaPreview"
                :key="item.id ?? `${item.id_producto}-${item.id_balon}-${idx}`"
                class="border-t border-gray-100 dark:border-gray-800"
              >
                <td class="px-3 py-2.5 align-top">
                  <p class="font-medium text-gray-800 dark:text-white/90">
                    {{ item.nombre_producto || item.descripcion || '—' }}
                  </p>
                  <p
                    v-if="item.descripcion && item.nombre_producto && item.descripcion !== item.nombre_producto"
                    class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
                  >
                    {{ item.descripcion }}
                  </p>
                </td>
                <td class="px-3 py-2.5 align-top">
                  <div class="flex flex-col gap-1">
                    <AppBadge
                      v-if="item.nombre_tipo_balon"
                      size="sm"
                      variant="light"
                      :color="tipoBalonBadgeColor(item.nombre_tipo_balon)"
                    >
                      {{ item.nombre_tipo_balon }}
                    </AppBadge>
                    <span
                      v-if="item.nombre_producto_gas"
                      class="text-xs text-gray-600 dark:text-gray-300"
                    >
                      {{ item.nombre_producto_gas }}
                    </span>
                    <span
                      v-if="!item.nombre_tipo_balon && !item.nombre_producto_gas"
                      class="text-xs text-gray-400"
                    >
                      —
                    </span>
                  </div>
                </td>
                <td class="px-3 py-2.5 text-right align-top tabular-nums text-gray-800 dark:text-white/90">
                  <span class="font-medium">{{ formatCantidadItem(item.cantidad) }}</span>
                  <span
                    v-if="item.nombre_unidad_medida"
                    class="ml-1 text-xs font-normal uppercase text-gray-500"
                  >
                    {{ item.nombre_unidad_medida }}
                  </span>
                </td>
                <td class="px-3 py-2.5 align-top">
                  <p class="font-medium text-gray-800 dark:text-white/90">
                    {{ item.codigo_balon || '—' }}
                  </p>
                  <p
                    v-if="item.numero_serie_balon"
                    class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
                  >
                    S/N {{ item.numero_serie_balon }}
                  </p>
                </td>
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

    <div
      class="sticky bottom-0 z-10 flex flex-col-reverse gap-3 border-t border-gray-200 bg-white/95 px-1 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 sm:flex-row sm:justify-end"
    >
      <button
        type="button"
        class="inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="actividad-form"
        class="inline-flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear actividad' : 'Guardar cambios' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import {
  useCreateActividadMutation,
  useCrearRecojoMutation,
  useUpdateActividadMutation,
} from '@/modules/operativa/actividades/composables/useActividadMutations'
import { useActividadDetailQuery } from '@/modules/operativa/actividades/composables/useActividadDetailQuery'
import { useVencidosRecojoQuery } from '@/modules/operativa/actividades/composables/useVencidosRecojoQuery'
import type {
  Actividad,
  ActividadFormMode,
  ActividadItem,
  OrigenVencidoRecojo,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { horaFinEsPosterior } from '@/modules/operativa/actividades/utils/actividadHorario'
import {
  esEstadoActividadEditableEnFormulario,
  esEstadoActividadOperativo,
  esTipoRecojoNombre,
  esTipoRepartoNombre,
  idOpcionPorNombre,
} from '@/modules/operativa/actividades/utils/actividadTipo'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { trabajadoresService } from '@/modules/trabajadores/services/trabajadores.service'
import type { Trabajador } from '@/modules/trabajadores/interfaces/trabajador.interface'
import DocumentoSalidaSelectField from '@/modules/documentos-salida/components/DocumentoSalidaSelectField.vue'
import OrigenRecojoSelectField from '@/modules/operativa/actividades/components/OrigenRecojoSelectField.vue'
import {
  origenRecojoKey as buildOrigenRecojoKey,
  parseOrigenRecojoKey,
} from '@/modules/operativa/actividades/utils/origenRecojoKey'
import { useDocumentoSalidaQuery } from '@/modules/documentos-salida/composables/useDocumentosSalidaQuery'
import { tipoBalonBadgeColor } from '@/modules/balones/utils/tipoBalonBadge'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppInput, AppSelect, AppTextarea, AppTimePicker } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalString, requiredString } from '@/shared/validation'

interface ActividadFormProps {
  mode: ActividadFormMode
  /** Id de actividad en modo edit (carga detalle). */
  actividadId?: number | null
  defaultFecha?: string | null
  lockTipoReparto?: boolean
  defaultTitulo?: string | null
  defaultClienteId?: number | null
  defaultClienteLabel?: string | null
  defaultChoferId?: number | null
  defaultChoferLabel?: string | null
  defaultTrabajadorId?: number | null
  defaultIdComprobante?: number | null
  defaultIdDocSalida?: number | null
  defaultDocSalidaLabel?: string | null
  defaultDescripcion?: string | null
  defaultItems?: ActividadItem[]
  defaultTipoOrigenRecojo?: 'PRESTAMO' | 'ALQUILER' | null
  defaultIdOrigenRecojo?: number | null
  /** Label del origen cuando viene prefill y aún no está en el listado de vencidos. */
  defaultOrigenRecojoLabel?: string | null
  /** Fija tipo RECOJO y bloquea el origen (p. ej. desde listado de préstamos). */
  lockTipoRecojo?: boolean
}

const props = withDefaults(defineProps<ActividadFormProps>(), {
  lockTipoReparto: false,
  lockTipoRecojo: false,
  defaultItems: () => [],
  actividadId: null,
  defaultTipoOrigenRecojo: null,
  defaultIdOrigenRecojo: null,
  defaultOrigenRecojoLabel: null,
})

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const authStore = useAuthStore()

const createMutation = useCreateActividadMutation()
const crearRecojoMutation = useCrearRecojoMutation()
const updateMutation = useUpdateActividadMutation()
const formActive = computed(() => true)
const idReferencia = computed(() => props.actividadId ?? undefined)
const actividadDetailQuery = useActividadDetailQuery(idReferencia, formActive)
const actividadActual = computed<Actividad | null>(
  () => actividadDetailQuery.data.value ?? null,
)

const lockCliente = computed(
  () =>
    Boolean(props.lockTipoReparto && props.defaultClienteId) ||
    Boolean(props.lockTipoRecojo && props.defaultClienteId),
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

const tipoRecojoId = computed(
  () =>
    tipoActividadQuery.data.value?.find((o) => esTipoRecojoNombre(o.nombre))?.id ??
    idOpcionPorNombre(tipoActividadQuery.data.value, ['RECOJO']),
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

/** Estados operativos no se editan a mano: evitan romper custodia EN_TRANSITO. */
const estadoActividadBloqueado = computed(() =>
  props.mode === 'edit' &&
  esEstadoActividadOperativo(actividadActual.value?.nombre_estado_actividad),
)

const estadoActividadOptions = computed(() => {
  const items = estadoActividadQuery.data.value ?? []
  // En create/edit editable: solo pendiente/programada. Si ya es operativo,
  // se muestra el actual (campo bloqueado) para no perder el label.
  const filtrados = estadoActividadBloqueado.value
    ? items
    : items.filter((o) => esEstadoActividadEditableEnFormulario(o.nombre))
  return toSelectOptions(filtrados.length ? filtrados : items)
})

const clienteLabelActual = computed(
  () =>
    actividadActual.value?.razon_social_cliente ??
    props.defaultClienteLabel ??
    docSalidaSeleccionada.value?.nombre_destinatario ??
    docSalidaSeleccionada.value?.nombre_cliente ??
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

const idDocSalidaSeleccionado = ref<number | ''>('')
const errorDocSalida = ref<string | undefined>()
const origenRecojoKey = ref<string | ''>('')
const errorOrigenRecojo = ref<string | undefined>()

const lockDocSalida = computed(
  () => Boolean(props.lockTipoReparto && props.defaultIdDocSalida) || props.mode === 'edit',
)

const lockOrigenRecojo = computed(
  () =>
    props.mode === 'edit' ||
    Boolean(props.lockTipoRecojo) ||
    Boolean(props.defaultTipoOrigenRecojo && props.defaultIdOrigenRecojo),
)

const prefillOrigenRecojoLabel = computed(() => props.defaultOrigenRecojoLabel ?? null)

const vencidosFilters = ref({ buscar: '', pagina: 1, limite: 30 })
const vencidosQuery = useVencidosRecojoQuery(
  vencidosFilters,
  computed(() => props.mode === 'create'),
)

const idDocSalidaEfectivo = computed(() => {
  if (actividadActual.value?.id_doc_salida) return actividadActual.value.id_doc_salida
  if (props.defaultIdDocSalida) return props.defaultIdDocSalida
  if (idDocSalidaSeleccionado.value !== '') return Number(idDocSalidaSeleccionado.value)
  return null
})

const idDocSalidaQueryRef = computed(() =>
  props.mode === 'create' && idDocSalidaEfectivo.value ? idDocSalidaEfectivo.value : null,
)
const docSalidaQuery = useDocumentoSalidaQuery(idDocSalidaQueryRef)
const docSalidaSeleccionada = computed(() => docSalidaQuery.data.value ?? null)

const docSalidaLabel = computed(() => {
  if (props.defaultDocSalidaLabel) return props.defaultDocSalidaLabel
  const a = actividadActual.value
  if (a?.serie_doc_salida && a?.numero_sunat_doc_salida) {
    return `${a.serie_doc_salida}-${a.numero_sunat_doc_salida}`
  }
  if (a?.numero_doc_salida) return a.numero_doc_salida
  const doc = docSalidaSeleccionada.value
  if (doc) {
    if (doc.serie && doc.numero_sunat) return `${doc.serie}-${doc.numero_sunat}`
    return doc.numero
  }
  return idDocSalidaEfectivo.value ? `Orden #${idDocSalidaEfectivo.value}` : null
})

const itemsPreview = computed<ActividadItem[]>(() => {
  const fromActividad = actividadActual.value?.items
  if (fromActividad?.length) return fromActividad
  const doc = docSalidaSeleccionada.value
  if (doc?.detalle?.length) {
    return doc.detalle.map((linea, idx) => ({
      item: linea.item ?? idx + 1,
      id_producto: linea.id_producto,
      nombre_producto:
        linea.nombre_producto ||
        linea.nombre_producto_gas_balon ||
        linea.descripcion ||
        null,
      descripcion: linea.descripcion || linea.nombre_producto || undefined,
      cantidad: Number(linea.cantidad) || 1,
      nombre_unidad_medida: linea.nombre_unidad_medida ?? linea.unidad_capacidad_balon ?? null,
      id_balon: linea.id_balon,
      codigo_balon: linea.codigo_balon,
      numero_serie_balon: linea.numero_serie_balon ?? null,
      nombre_tipo_balon: linea.nombre_tipo_balon ?? null,
      nombre_producto_gas: linea.nombre_producto_gas_balon ?? null,
    }))
  }
  return props.defaultItems ?? []
})

const detalleOrigenPreview = computed<ActividadItem[]>(() => {
  const detalle = actividadActual.value?.detalle_origen
  if (!detalle?.cilindros?.length && !detalle?.regulador) return []
  const rows: ActividadItem[] = (detalle.cilindros ?? []).map((c, idx) => ({
    item: idx + 1,
    id: c.id,
    id_producto: c.id_producto,
    nombre_producto: c.nombre_producto,
    cantidad: Number(c.cantidad) || 1,
    id_balon: c.id_balon,
    codigo_balon: c.codigo_balon,
    numero_serie_balon: c.numero_serie_balon,
    nombre_tipo_balon: c.nombre_tipo_balon,
    nombre_producto_gas: c.nombre_producto_gas,
  }))
  if (detalle.regulador?.pendiente) {
    rows.push({
      item: rows.length + 1,
      id_producto: detalle.regulador.id_producto,
      nombre_producto: detalle.regulador.nombre_producto || 'Regulador / accesorio',
      descripcion: detalle.regulador.codigo_producto || undefined,
      cantidad: 1,
    })
  }
  return rows
})

const itemsTablaPreview = computed(() =>
  itemsPreview.value.length ? itemsPreview.value : detalleOrigenPreview.value,
)

const origenRecojoSeleccionado = computed<OrigenVencidoRecojo | null>(() => {
  const parsed = parseOrigenRecojoKey(origenRecojoKey.value)
  if (!parsed) return null
  return (
    (vencidosQuery.data.value?.data ?? []).find(
      (row) =>
        row.origen === parsed.tipoOrigen && row.id_origen === parsed.idOrigen,
    ) ?? null
  )
})

const origenRecojoLabel = computed(() => {
  const a = actividadActual.value
  if (a?.numero_prestamo) return `Préstamo ${a.numero_prestamo}`
  if (a?.numero_alquiler) return `Alquiler ${a.numero_alquiler}`
  const sel = origenRecojoSeleccionado.value
  if (sel) return `${sel.origen === 'ALQUILER' ? 'Alquiler' : 'Préstamo'} ${sel.numero}`
  return null
})

function formatCantidadItem(valor: number | string | null | undefined) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return '0'
  return String(Number(n.toFixed(4)))
}

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

function esRecojoSeleccionado(idTipo?: number | null) {
  if (props.lockTipoRecojo) return true
  if (!idTipo) return false
  if (tipoRecojoId.value && Number(idTipo) === tipoRecojoId.value) return true
  return esTipoRecojoNombre(
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
        horaFinEstimada: optionalString()
          .test(
            'hora-fin-si-no-recojo',
            'La hora de fin es obligatoria',
            function (value) {
              const idTipo = (this.parent as { idTipoActividad?: number }).idTipoActividad
              if (esRecojoSeleccionado(idTipo)) return true
              return Boolean(value?.trim())
            },
          )
          .test(
            'hora-fin-mayor-hora-inicio',
            'La hora de fin debe ser posterior a la hora de inicio',
            function (value) {
              if (!value?.trim()) return true
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

const esTipoRecojo = computed(() => {
  const id = Number(idTipoActividad.value)
  if (!id) return Boolean(props.lockTipoRecojo)
  return esRecojoSeleccionado(id)
})

watch(horaInicioEstimada, () => {
  if (horaFinEstimada.value) {
    validateField('horaFinEstimada')
  }
})

watch(idTipoActividad, (nuevo, anterior) => {
  void validateField('idCliente')
  void validateField('idTrabajadorResponsable')
  void validateField('horaFinEstimada')

  if (props.lockTipoReparto || props.lockTipoRecojo || props.mode === 'edit') return
  const eraReparto = esRepartoSeleccionado(anterior)
  const sigueReparto = esRepartoSeleccionado(nuevo)
  if (eraReparto && !sigueReparto) {
    limpiarVinculoOrdenSalida()
  }
  const eraRecojo = esRecojoSeleccionado(anterior)
  const sigueRecojo = esRecojoSeleccionado(nuevo)
  if (eraRecojo && !sigueRecojo) {
    limpiarVinculoOrigenRecojo()
  }
})

function limpiarVinculoOrdenSalida() {
  if (props.lockTipoReparto || props.mode === 'edit') return
  idDocSalidaSeleccionado.value = ''
  errorDocSalida.value = undefined
  if (!lockCliente.value) {
    setFieldValue('idCliente', undefined)
  }
}

function limpiarVinculoOrigenRecojo() {
  if (lockOrigenRecojo.value) return
  origenRecojoKey.value = ''
  errorOrigenRecojo.value = undefined
}

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
        (props.lockTipoReparto
          ? tipoRepartoId.value
          : props.lockTipoRecojo
            ? tipoRecojoId.value
            : undefined),
      idPrioridad:
        a?.id_prioridad ??
        (props.lockTipoReparto || props.lockTipoRecojo ? defaultPrioridadId.value : undefined),
      idEstadoActividad:
        a?.id_estado_actividad ??
        (props.lockTipoReparto || props.lockTipoRecojo ? defaultEstadoId.value : undefined),
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

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  if (props.mode === 'create' && esRepartoSeleccionado(values.idTipoActividad)) {
    if (!idDocSalidaEfectivo.value) {
      errorDocSalida.value = 'Selecciona una orden de salida'
      return
    }
    errorDocSalida.value = undefined
  }

  if (props.mode === 'create' && esRecojoSeleccionado(values.idTipoActividad)) {
    const parsed = parseOrigenRecojoKey(origenRecojoKey.value)
    if (!parsed) {
      errorOrigenRecojo.value = 'Selecciona un préstamo o alquiler vencido'
      return
    }
    errorOrigenRecojo.value = undefined

    try {
      await crearRecojoMutation.mutateAsync({
        tipoOrigen: parsed.tipoOrigen,
        idOrigen: parsed.idOrigen,
        fechaProgramada: values.fechaProgramada || undefined,
        horaInicioEstimada: values.horaInicioEstimada,
        idTrabajadorResponsable: values.idTrabajadorResponsable
          ? Number(values.idTrabajadorResponsable)
          : undefined,
        observaciones: values.observaciones || undefined,
        idUsuarioAuditoria: currentUserId,
      })
      emit('saved')
    } catch {
      // toast en mutation
    }
    return
  }

  try {
    const idDocSalida =
      props.mode === 'create' ? (idDocSalidaEfectivo.value ?? undefined) : undefined

    const payload = {
      idUsuarioAuditoria: currentUserId,
      titulo: values.titulo,
      descripcion: values.descripcion || undefined,
      idCliente: values.idCliente ? Number(values.idCliente) : undefined,
      idTrabajadorResponsable: values.idTrabajadorResponsable
        ? Number(values.idTrabajadorResponsable)
        : undefined,
      idComprobante: idDocSalida ? undefined : (defaultIdComprobante.value ?? undefined),
      idDocSalida,
      idTipoActividad: Number(values.idTipoActividad),
      idPrioridad: Number(values.idPrioridad),
      // No mandar estado operativo desde el form: el SQL lo rechaza y además
      // dejaría cilindros EN_TRANSITO si se bajara EN_RUTA a PENDIENTE.
      idEstadoActividad: estadoActividadBloqueado.value
        ? undefined
        : Number(values.idEstadoActividad),
      fechaProgramada: values.fechaProgramada,
      horaInicioEstimada: values.horaInicioEstimada,
      horaFinEstimada: values.horaFinEstimada,
      fechaHoraCierre: values.fechaHoraCierre || undefined,
      observaciones: values.observaciones || undefined,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.actividadId) {
      await updateMutation.mutateAsync({
        id: props.actividadId,
        payload,
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
  () => true,
  () => {
    idDocSalidaSeleccionado.value = props.defaultIdDocSalida ?? ''
    errorDocSalida.value = undefined
    if (props.defaultTipoOrigenRecojo && props.defaultIdOrigenRecojo) {
      origenRecojoKey.value = buildOrigenRecojoKey(
        props.defaultTipoOrigenRecojo,
        props.defaultIdOrigenRecojo,
      )
    } else {
      origenRecojoKey.value = ''
    }
    errorOrigenRecojo.value = undefined
    syncFormValues()
    if (props.lockTipoReparto || props.lockTipoRecojo) {
      void tipoActividadQuery.refetch()
      void prioridadQuery.refetch()
      void estadoActividadQuery.refetch()
    }
  },
  { immediate: true },
)

watch(docSalidaSeleccionada, (doc) => {
  if (props.mode !== 'create' || !doc || !esTipoReparto.value) return
  if (!titulo.value?.trim()) {
    setFieldValue('titulo', `Reparto ${doc.numero}`)
  }
  const clienteId = doc.id_destinatario ?? doc.id_cliente
  if (clienteId && !idCliente.value) {
    setFieldValue('idCliente', clienteId)
  }
})

watch(origenRecojoSeleccionado, (origen) => {
  if (props.mode !== 'create' || !origen || !esTipoRecojo.value) return
  const prefijo = origen.origen === 'ALQUILER' ? 'Recojo alquiler' : 'Recojo préstamo'
  if (!titulo.value?.trim() || titulo.value.startsWith('Recojo ')) {
    setFieldValue('titulo', `${prefijo} ${origen.numero}`)
  }
  if (origen.id_cliente && !idCliente.value) {
    setFieldValue('idCliente', origen.id_cliente)
  }
  if (origen.fecha_pactada && !fechaProgramada.value) {
    setFieldValue('fechaProgramada', String(origen.fecha_pactada).slice(0, 10))
  }
})

watch(idDocSalidaSeleccionado, () => {
  errorDocSalida.value = undefined
})

watch(origenRecojoKey, () => {
  errorOrigenRecojo.value = undefined
})

watch(
  () => actividadDetailQuery.data.value,
  () => {
    syncFormValues()
  },
)

watch(
  () =>
    [
      props.defaultFecha,
      props.defaultTitulo,
      props.defaultClienteId,
      props.lockTipoReparto,
      props.lockTipoRecojo,
      props.defaultIdDocSalida,
      props.defaultTipoOrigenRecojo,
      props.defaultIdOrigenRecojo,
    ] as const,
  () => {
    if (props.mode === 'create') {
      idDocSalidaSeleccionado.value = props.defaultIdDocSalida ?? ''
      if (props.defaultTipoOrigenRecojo && props.defaultIdOrigenRecojo) {
        origenRecojoKey.value = buildOrigenRecojoKey(
          props.defaultTipoOrigenRecojo,
          props.defaultIdOrigenRecojo,
        )
      }
      syncFormValues()
    }
  },
)

function aplicarDefaultsReparto() {
  if (props.mode !== 'create' || !props.lockTipoReparto) return

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

function aplicarDefaultsRecojo() {
  if (props.mode !== 'create' || !props.lockTipoRecojo) return

  if (!idTipoActividad.value && tipoRecojoId.value) {
    setFieldValue('idTipoActividad', tipoRecojoId.value)
  }
  if (!idPrioridad.value && defaultPrioridadId.value) {
    // Recojos suelen ir en ALTA; fallback al default del form.
    const alta =
      idOpcionPorNombre(prioridadQuery.data.value, ['ALTA']) ?? defaultPrioridadId.value
    if (alta) setFieldValue('idPrioridad', alta)
  }
  if (!idEstadoActividad.value && defaultEstadoId.value) {
    setFieldValue('idEstadoActividad', defaultEstadoId.value)
  }
}

watch(
  [tipoRepartoId, defaultPrioridadId, defaultEstadoId, () => props.lockTipoReparto],
  () => aplicarDefaultsReparto(),
)

watch(
  [tipoRecojoId, defaultPrioridadId, defaultEstadoId, () => props.lockTipoRecojo],
  () => aplicarDefaultsRecojo(),
)
</script>

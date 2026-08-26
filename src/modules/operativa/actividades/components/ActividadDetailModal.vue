<template>
  <AppModal
    v-model="open"
    title="Detalle de la actividad"
    :subtitle="actividad?.titulo"
    size="lg"
    :z-index="100000"
  >
    <div v-if="isLoading && !actividad" class="flex items-center justify-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
      <AppIcon :name="ICONS.loader" :size="16" class="animate-spin" />
      Cargando detalle...
    </div>

    <div v-if="actividad" class="space-y-4">
      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <div class="flex items-start gap-2.5">
          <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.clipboardList" :size="16" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ actividad.titulo }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ actividad.razon_social_cliente ?? 'Sin cliente asignado' }}
            </p>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <ListaOpcionBadge
            v-if="actividad.nombre_estado_actividad"
            :value="actividad.nombre_estado_actividad"
          />
          <ListaOpcionBadge v-if="esSinAsignarAct" value="Sin asignar" />
          <ListaOpcionBadge v-else-if="esEnCursoAct" value="En curso" />
          <ListaOpcionBadge v-if="actividad.nombre_prioridad" :value="actividad.nombre_prioridad" />
          <ListaOpcionBadge v-if="actividad.nombre_tipo_actividad" :value="actividad.nombre_tipo_actividad" />
        </div>
      </div>

      <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
        <div class="mb-3 flex items-center gap-2.5">
          <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.userCheck" :size="16" />
          </span>
          <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Datos generales</h5>
        </div>
        <dl class="grid gap-x-5 gap-y-4 sm:grid-cols-3">
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Usuario responsable</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ actividad.nombre_usuario_responsable ?? 'Sin asignar' }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Chofer / repartidor</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ actividad.nombre_chofer_responsable ?? 'Sin asignar' }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Comprobante</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ comprobanteLabel(actividad) ?? '—' }}
            </dd>
          </div>
        </dl>
      </section>

      <section
        v-if="descripcionTexto || actividad.observaciones"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <div class="mb-2 flex items-center gap-2.5">
          <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.fileText" :size="16" />
          </span>
          <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Descripción</h5>
        </div>

        <p v-if="descripcionTexto" class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
          {{ descripcionTexto }}
        </p>
        <a
          v-if="mapsUrl"
          :href="mapsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          <AppIcon :name="ICONS.mapPin" :size="14" />
          Ver ubicación en el mapa
        </a>

        <div v-if="actividad.observaciones" :class="descripcionTexto ? 'mt-4 border-t border-gray-100 pt-3 dark:border-gray-800' : ''">
          <dt class="mb-1 flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
            <AppIcon :name="ICONS.messageSquare" :size="12" class="shrink-0" />
            Observaciones
          </dt>
          <dd class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {{ actividad.observaciones }}
          </dd>
        </div>
      </section>

      <div class="grid gap-4 sm:grid-cols-2">
        <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
          <div class="mb-3 flex items-center gap-2.5">
            <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              <AppIcon :name="ICONS.calendar" :size="16" />
            </span>
            <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Programación</h5>
          </div>
          <dl class="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <div>
              <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Fecha programada</dt>
              <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ formatListDate(actividad.fecha_programada) }}
              </dd>
            </div>
            <div>
              <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Hora de inicio</dt>
              <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ formatHora(actividad.hora_inicio_estimada) ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Hora de fin</dt>
              <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ formatHora(actividad.hora_fin_estimada) ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Fecha y hora de cierre</dt>
              <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ formatDetailDateTime(actividad.fecha_hora_cierre) ?? '—' }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
          <div class="mb-3 flex items-center gap-2.5">
            <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              <AppIcon :name="ICONS.history" :size="16" />
            </span>
            <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Auditoría</h5>
          </div>
          <dl class="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <div>
              <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Creado por</dt>
              <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ actividad.nombre_usuario_creacion ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Fecha de creación</dt>
              <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ formatDetailDateTime(actividad.fecha_creacion) ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Modificado por</dt>
              <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ actividad.nombre_usuario_modificacion ?? '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Última modificación</dt>
              <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ formatDetailDateTime(actividad.fecha_modificacion) ?? '—' }}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section
        v-if="items.length"
        class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <div class="flex items-center gap-2.5 border-b border-gray-100 p-4 pb-3 dark:border-gray-800">
          <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.boxes" :size="16" />
          </span>
          <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Ítems</h5>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs text-gray-500 dark:bg-white/5">
              <tr>
                <th class="px-3 py-2">Ítem</th>
                <th class="px-3 py-2">Producto</th>
                <th class="px-3 py-2 text-right">Cant.</th>
                <th class="px-3 py-2">Balón</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in items"
                :key="item.id ?? `${item.id_producto}-${idx}`"
                class="border-t border-gray-100 dark:border-gray-800"
              >
                <td class="px-3 py-2 text-gray-500">{{ item.item ?? idx + 1 }}</td>
                <td class="px-3 py-2 text-gray-800 dark:text-white/90">
                  {{ item.descripcion || item.nombre_producto || '—' }}
                </td>
                <td class="px-3 py-2 text-right tabular-nums">{{ item.cantidad }}</td>
                <td class="px-3 py-2 text-gray-500">{{ item.codigo_balon || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="open = false"
      >
        Cerrar
      </button>
      <button
        v-if="puedeTomarAct"
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="asignarMutation.isPending.value"
        @click="tomarActividad"
      >
        {{ asignarMutation.isPending.value ? 'Asignando...' : 'Tomar actividad' }}
      </button>
      <button
        v-if="puedeLiberarAct"
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="asignarMutation.isPending.value"
        @click="liberarActividad"
      >
        {{ asignarMutation.isPending.value ? 'Liberando...' : 'Liberar' }}
      </button>
      <button
        v-if="canCancelar"
        type="button"
        class="flex w-full justify-center rounded-lg border border-error-300 bg-white px-4 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-70 dark:border-error-500/40 dark:bg-gray-800 dark:text-error-400 sm:w-auto"
        :disabled="cancelarMutation.isPending.value"
        @click="cancelarActividad"
      >
        {{ cancelarMutation.isPending.value ? 'Cancelando...' : 'Cancelar' }}
      </button>
      <button
        v-if="canFinalizar"
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="marcarMutation.isPending.value"
        @click="marcarRealizada"
      >
        {{ marcarMutation.isPending.value ? 'Guardando...' : 'Marcar realizada' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Actividad } from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { useActividadDetailQuery } from '@/modules/operativa/actividades/composables/useActividadDetailQuery'
import {
  useAsignarResponsableActividadMutation,
  useCancelarActividadMutation,
  useMarcarActividadRealizadaMutation,
} from '@/modules/operativa/actividades/composables/useActividadMutations'
import {
  esActividadCancelada,
  esActividadRealizada,
} from '@/modules/operativa/actividades/utils/actividadTipo'
import {
  esEnCurso,
  esSinAsignar,
  estaAsignada,
  puedeLiberarOFinalizar,
  puedeTomar,
} from '@/modules/operativa/actividades/utils/actividadEstado'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppModal, ListaOpcionBadge } from '@/shared/components'
import {
  formatDetailDateTime,
} from '@/shared/components/detail/detailFormatters'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatListDate } from '@/shared/utils/date'

interface ActividadDetailModalProps {
  actividad?: Actividad | null
}

const props = defineProps<ActividadDetailModalProps>()

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const marcarMutation = useMarcarActividadRealizadaMutation()
const cancelarMutation = useCancelarActividadMutation()
const asignarMutation = useAsignarResponsableActividadMutation()

const idReferencia = computed(() => props.actividad?.id)
const actividadDetailQuery = useActividadDetailQuery(idReferencia, open)
const isLoading = computed(() => actividadDetailQuery.isFetching.value)
const actividad = computed<Actividad | null>(
  () => actividadDetailQuery.data.value ?? props.actividad ?? null,
)

const ahora = ref(new Date())
const isAdmin = computed(() => authStore.hasPermission(PermisoBanderas.AUTH_TODO))
const canEdit = computed(() =>
  authStore.hasPermission(PermisoBanderas.ACTIVIDADES_EDITAR),
)

const esSinAsignarAct = computed(() => esSinAsignar(actividad.value))
const esEnCursoAct = computed(() => esEnCurso(actividad.value))
const puedeTomarAct = computed(() => puedeTomar(actividad.value, canEdit.value))
const puedeLiberarAct = computed(
  () =>
    estaAsignada(actividad.value) &&
    puedeLiberarOFinalizar(actividad.value, {
      userId: authStore.user?.id,
      isAdmin: isAdmin.value,
      now: ahora.value,
    }) &&
    (canEdit.value || isAdmin.value),
)
const canFinalizar = computed(
  () =>
    estaAsignada(actividad.value) &&
    puedeLiberarOFinalizar(actividad.value, {
      userId: authStore.user?.id,
      isAdmin: isAdmin.value,
      now: ahora.value,
    }) &&
    (canEdit.value || isAdmin.value),
)

const items = computed(() => actividad.value?.items ?? [])

const mapsUrl = computed(() => {
  const match = actividad.value?.descripcion?.match(/ver en mapa:\s*(\S+)/i)
  return match ? match[1] : null
})

const descripcionTexto = computed(() => {
  const raw = actividad.value?.descripcion ?? ''
  return raw.replace(/ver en mapa:\s*\S+/i, '').trim() || null
})

const canCancelar = computed(
  () =>
    Boolean(actividad.value) &&
    authStore.hasPermission(PermisoBanderas.ACTIVIDADES_EDITAR) &&
    !esActividadRealizada(actividad.value?.nombre_estado_actividad) &&
    !esActividadCancelada(actividad.value?.nombre_estado_actividad),
)

watch(open, (value) => {
  if (value) ahora.value = new Date()
})

const formatHora = (value?: string | null) => (value ? value.slice(0, 5) : undefined)

const comprobanteLabel = (a: Actividad) => {
  if (a.serie_comprobante && a.numero_comprobante) {
    return `${a.serie_comprobante}-${a.numero_comprobante}`
  }
  return null
}

async function marcarRealizada() {
  const id = actividad.value?.id
  const userId = authStore.user?.id
  if (!id || !userId) return
  try {
    await marcarMutation.mutateAsync({ id, idUsuarioAuditoria: userId })
  } catch {
    // toast en mutation
  }
}

async function cancelarActividad() {
  const id = actividad.value?.id
  const userId = authStore.user?.id
  if (!id || !userId) return
  try {
    await cancelarMutation.mutateAsync({ id, idUsuarioAuditoria: userId })
  } catch {
    // toast en mutation
  }
}

async function tomarActividad() {
  const id = actividad.value?.id
  const userId = authStore.user?.id
  const idTrabajador = authStore.userTrabajadorId
  if (!id || !userId) return
  try {
    await asignarMutation.mutateAsync({
      id,
      idUsuarioAuditoria: userId,
      idTrabajadorResponsable: idTrabajador,
    })
  } catch {
    // toast en mutation
  }
}

async function liberarActividad() {
  const id = actividad.value?.id
  const userId = authStore.user?.id
  if (!id || !userId) return
  try {
    await asignarMutation.mutateAsync({
      id,
      idUsuarioAuditoria: userId,
      idTrabajadorResponsable: null,
    })
  } catch {
    // toast en mutation
  }
}
</script>
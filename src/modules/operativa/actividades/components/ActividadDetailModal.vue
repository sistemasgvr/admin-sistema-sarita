<template>
  <AppModal
    v-model="open"
    title="Detalle de la actividad"
    :subtitle="actividad?.titulo"
    size="lg"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <ListaOpcionBadge
          v-if="actividad?.nombre_estado_actividad"
          :value="actividad.nombre_estado_actividad"
        />
        <ListaOpcionBadge
          v-if="actividad?.nombre_prioridad"
          :value="actividad.nombre_prioridad"
        />
        <ListaOpcionBadge
          v-if="actividad?.nombre_tipo_actividad"
          :value="actividad.nombre_tipo_actividad"
        />
      </template>
    </DetailCardsLayout>

    <div
      v-if="items.length"
      class="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800"
    >
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

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="open = false"
      >
        Cerrar
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
        v-if="canMarcarRealizada"
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
import { computed } from 'vue'
import type { Actividad } from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { useActividadDetailQuery } from '@/modules/operativa/actividades/composables/useActividadDetailQuery'
import {
  useCancelarActividadMutation,
  useMarcarActividadRealizadaMutation,
} from '@/modules/operativa/actividades/composables/useActividadMutations'
import {
  esActividadCancelada,
  esActividadRealizada,
} from '@/modules/operativa/actividades/utils/actividadTipo'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppModal, ListaOpcionBadge } from '@/shared/components'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import {
  formatDetailDateTime,
  formatDetailListaOpcion,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
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

const idReferencia = computed(() => props.actividad?.id)
const actividadDetailQuery = useActividadDetailQuery(idReferencia, open)
const isLoading = computed(() => actividadDetailQuery.isFetching.value)
const actividad = computed<Actividad | null>(
  () => actividadDetailQuery.data.value ?? props.actividad ?? null,
)

const items = computed(() => actividad.value?.items ?? [])

const canMarcarRealizada = computed(
  () =>
    Boolean(actividad.value) &&
    authStore.hasPermission(PermisoBanderas.ACTIVIDADES_EDITAR) &&
    !esActividadRealizada(actividad.value?.nombre_estado_actividad) &&
    !esActividadCancelada(actividad.value?.nombre_estado_actividad),
)

const canCancelar = computed(
  () =>
    Boolean(actividad.value) &&
    authStore.hasPermission(PermisoBanderas.ACTIVIDADES_EDITAR) &&
    !esActividadRealizada(actividad.value?.nombre_estado_actividad) &&
    !esActividadCancelada(actividad.value?.nombre_estado_actividad),
)

const formatHora = (value?: string | null) => (value ? value.slice(0, 5) : undefined)

const comprobanteLabel = (a: Actividad) => {
  if (a.serie_comprobante && a.numero_comprobante) {
    return `${a.serie_comprobante}-${a.numero_comprobante}`
  }
  return null
}

const sections = computed<DetailSection[]>(() => {
  const a = actividad.value
  if (!a) return []

  return [
    {
      title: 'Datos generales',
      icon: ICONS.clipboardList,
      items: [
        { label: 'Título', value: a.titulo, fullWidth: true },
        { label: 'Descripción', value: a.descripcion, fullWidth: true },
        { label: 'Cliente', value: a.razon_social_cliente ?? 'Sin cliente asignado' },
        {
          label: 'Usuario responsable',
          value: a.nombre_usuario_responsable ?? 'Sin usuario interno',
        },
        {
          label: 'Chofer / repartidor',
          value: a.nombre_chofer_responsable ?? '—',
        },
        { label: 'Comprobante', value: comprobanteLabel(a) },
      ],
    },
    {
      title: 'Programación',
      icon: ICONS.calendar,
      items: [
        { label: 'Fecha programada', value: formatListDate(a.fecha_programada) },
        { label: 'Hora de inicio', value: formatHora(a.hora_inicio_estimada) },
        { label: 'Hora de fin', value: formatHora(a.hora_fin_estimada) },
        { label: 'Fecha y hora de cierre', value: formatDetailDateTime(a.fecha_hora_cierre) },
      ],
    },
    {
      title: 'Clasificación',
      icon: ICONS.tags,
      items: [
        {
          label: 'Tipo de actividad',
          value: formatDetailListaOpcion(a.nombre_tipo_actividad),
        },
        { label: 'Prioridad', value: formatDetailListaOpcion(a.nombre_prioridad) },
        { label: 'Estado', value: formatDetailListaOpcion(a.nombre_estado_actividad) },
        { label: 'Observaciones', value: a.observaciones, fullWidth: true },
      ],
    },
    {
      title: 'Auditoría',
      icon: ICONS.userCircle,
      items: [
        { label: 'Creado por', value: a.nombre_usuario_creacion },
        { label: 'Fecha de creación', value: formatDetailDateTime(a.fecha_creacion) },
        { label: 'Modificado por', value: a.nombre_usuario_modificacion },
        { label: 'Última modificación', value: formatDetailDateTime(a.fecha_modificacion) },
      ],
    },
  ]
})

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
  if (!window.confirm('¿Cancelar esta actividad? Si viene de una venta, el comprobante quedará disponible para otro reparto.')) {
    return
  }
  try {
    await cancelarMutation.mutateAsync({ id, idUsuarioAuditoria: userId })
  } catch {
    // toast en mutation
  }
}
</script>

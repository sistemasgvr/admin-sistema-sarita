<template>
  <AppModal
    v-model="open"
    title="Detalle del resumen"
    :subtitle="subtitulo"
    size="xl"
  >
    <div
      v-if="resumenQuery.isLoading.value || consultando"
      class="flex flex-col items-center justify-center gap-3 py-12 text-sm text-gray-500 dark:text-gray-400"
    >
      <AppIcon :name="ICONS.refreshCw" :size="20" class="animate-spin text-brand-500" />
      {{ consultando ? 'Consultando estado en SUNAT...' : 'Cargando resumen...' }}
    </div>

    <div v-else-if="resumen" class="space-y-4">
      <DetailSectionCard title="Resultado" :icon="resultadoIcon" :full-width="true">
        <div class="rounded-xl border px-4 py-3" :class="resumenTone.box">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-base font-semibold" :class="resumenTone.title">
                {{ resumenTitulo }}
              </p>
              <p class="mt-1 text-sm" :class="resumenTone.body">
                {{ resumenDetalle }}
              </p>
            </div>
            <ListaOpcionBadge :value="estadoNormalizado" raw />
          </div>
        </div>
      </DetailSectionCard>

      <DetailCardsLayout :loading="false" :sections="sections" />

      <DetailSectionCard title="Comprobantes incluidos" :icon="ICONS.clipboardList" :full-width="true">
        <div class="overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 dark:bg-white/5">
              <tr>
                <th class="px-3 py-2 text-left">Comprobante</th>
                <th class="px-3 py-2 text-left">Cliente</th>
                <th class="px-3 py-2 text-left">SUNAT</th>
                <th class="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="detalle in resumen.detalles"
                :key="detalle.id"
                class="border-t border-gray-100 dark:border-gray-800"
              >
                <td class="px-3 py-2 font-medium text-gray-800 dark:text-white/90">
                  {{ detalle.serie }}-{{ detalle.numero }}
                </td>
                <td class="px-3 py-2">{{ detalle.nombre_cliente ?? '—' }}</td>
                <td class="px-3 py-2">
                  <ListaOpcionBadge :value="detalle.nombre_estado_sunat ?? 'PENDIENTE'" raw />
                </td>
                <td class="px-3 py-2 text-right tabular-nums">
                  {{ formatMoney(Number(detalle.total_importe ?? 0)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </DetailSectionCard>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        @click="open = false"
      >
        Cerrar
      </button>
      <button
        v-if="resumen?.ticket_sunat"
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        :disabled="consultarMutation.isPending.value"
        @click="consultar"
      >
        <AppIcon :name="ICONS.refreshCw" :size="16" />
        Consultar estado
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useConsultarEstadoResumenMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import { useResumenDiarioQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import type { ResumenDiarioListItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { AppModal, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  modelValue: boolean
  resumen: ResumenDiarioListItem | null
  autoConsultar?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const consultarMutation = useConsultarEstadoResumenMutation()
const consultando = ref(false)
const autoConsultadoId = ref<number | null>(null)

const resumenId = computed(() => (props.modelValue ? props.resumen?.id ?? null : null))
const resumenQuery = useResumenDiarioQuery(resumenId)

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const resumen = computed(() => resumenQuery.data.value ?? null)
const subtitulo = computed(() => resumen.value?.identificador ?? props.resumen?.identificador ?? undefined)

const sunatInfo = computed(() => {
  let payload: unknown = null
  try {
    payload = resumen.value?.cdr_respuesta
      ? JSON.parse(resumen.value.cdr_respuesta)
      : null
  } catch {
    payload = null
  }

  const root = asRecord(payload) ?? {}
  const nested = asRecord(root.sunatResponse) ?? root
  const cdr = asRecord(nested.cdrResponse)
  const errorObj = asRecord(nested.error) ?? asRecord(root.error)

  return {
    codigo: pickText(cdr?.code, nested.code, root.code, errorObj?.code),
    mensaje: pickText(
      cdr?.description,
      nested.message,
      root.message,
      errorObj?.message,
    ),
  }
})

const estadoNormalizado = computed(() =>
  String(resumen.value?.nombre_estado_sunat ?? 'PENDIENTE').trim().toUpperCase(),
)

const resultadoIcon = computed(() => {
  switch (estadoNormalizado.value) {
    case 'ACEPTADO':
      return ICONS.check
    case 'RECHAZADO':
      return ICONS.alertCircle
    case 'PENDIENTE':
      return ICONS.refreshCw
    default:
      return ICONS.clipboardCheck
  }
})

const resumenTitulo = computed(() => {
  switch (estadoNormalizado.value) {
    case 'ACEPTADO':
      return 'Resumen aceptado'
    case 'RECHAZADO':
      return 'Resumen rechazado'
    case 'PENDIENTE':
      return 'Resumen en proceso'
    default:
      return `Estado: ${estadoNormalizado.value}`
  }
})

const resumenDetalle = computed(() => {
  if (sunatInfo.value.mensaje) return sunatInfo.value.mensaje
  switch (estadoNormalizado.value) {
    case 'ACEPTADO':
      return 'SUNAT aceptó el resumen diario de boletas correctamente.'
    case 'RECHAZADO':
      return 'SUNAT rechazó el resumen. Revisa el mensaje e intenta nuevamente.'
    case 'PENDIENTE':
      return 'SUNAT aún está procesando el resumen. Consulta el estado en unos minutos.'
    default:
      return 'Consulta el estado del resumen para obtener la respuesta de SUNAT.'
  }
})

const resumenTone = computed(() => {
  switch (estadoNormalizado.value) {
    case 'ACEPTADO':
      return {
        box: 'border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10',
        title: 'text-success-800 dark:text-success-300',
        body: 'text-success-700 dark:text-success-400',
      }
    case 'RECHAZADO':
      return {
        box: 'border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10',
        title: 'text-error-800 dark:text-error-300',
        body: 'text-error-700 dark:text-error-400',
      }
    case 'PENDIENTE':
      return {
        box: 'border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10',
        title: 'text-warning-800 dark:text-warning-300',
        body: 'text-warning-700 dark:text-warning-400',
      }
    default:
      return {
        box: 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/5',
        title: 'text-gray-800 dark:text-white/90',
        body: 'text-gray-600 dark:text-gray-300',
      }
  }
})

const sections = computed<DetailSection[]>(() => {
  if (!resumen.value) return []
  return [
    {
      title: 'Resumen',
      icon: ICONS.calendar,
      items: [
        { label: 'Identificador', value: resumen.value.identificador ?? '—' },
        { label: 'Fecha', value: formatFechaUi(resumen.value.fecha) },
        { label: 'Correlativo', value: resumen.value.correlativo },
        { label: 'Documentos', value: String(resumen.value.cantidad_docs) },
        {
          label: 'Total',
          value: formatMoney(Number(resumen.value.total_importe ?? 0)),
        },
      ],
    },
    {
      title: 'Respuesta SUNAT',
      icon: ICONS.shield,
      items: [
        { label: 'Estado', value: resumen.value.nombre_estado_sunat ?? 'PENDIENTE' },
        { label: 'Código', value: sunatInfo.value.codigo ?? '—' },
        {
          label: 'Mensaje',
          value: sunatInfo.value.mensaje ?? 'Sin mensaje adicional',
          fullWidth: true,
        },
        {
          label: 'Nº de seguimiento',
          value: resumen.value.ticket_sunat ?? '—',
          fullWidth: true,
        },
      ],
    },
  ]
})

watch(
  () => [props.modelValue, props.resumen?.id, props.autoConsultar] as const,
  async ([isOpen, id, auto]) => {
    if (!isOpen) {
      autoConsultadoId.value = null
      return
    }
    if (auto && id && autoConsultadoId.value !== id) {
      autoConsultadoId.value = id
      await consultar()
    }
  },
)

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function pickText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  }
  return null
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function formatFechaUi(value: string) {
  const base = String(value ?? '').slice(0, 10)
  const [y, m, d] = base.split('-')
  if (!y || !m || !d) return value
  return `${d}/${m}/${y}`
}

async function consultar() {
  const id = resumenId.value
  const userId = authStore.user?.id
  if (!id || !userId) return

  consultando.value = true
  try {
    await consultarMutation.mutateAsync({ id, idUsuarioAuditoria: userId })
    await resumenQuery.refetch()
  } catch {
    // toast en mutación
  } finally {
    consultando.value = false
  }
}
</script>

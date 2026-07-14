<template>
  <AppModal
    v-model="open"
    title="Consulta CDR / SUNAT"
    :subtitle="subtitulo"
    size="lg"
  >
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center gap-3 py-12 text-sm text-gray-500 dark:text-gray-400"
    >
      <span
        class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
      >
        <AppIcon :name="ICONS.refreshCw" :size="20" class="animate-spin" />
      </span>
      Consultando estado en SUNAT...
    </div>

    <div v-else-if="errorMessage" class="space-y-4">
      <DetailSectionCard title="No se pudo consultar" :icon="ICONS.alertCircle" :full-width="true">
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ errorMessage }}</p>
      </DetailSectionCard>
    </div>

    <DetailCardsLayout v-else-if="resultado" :loading="false" :sections="sections">
      <template #badges>
        <ListaOpcionBadge :value="resultado.sunat.estado" raw />
      </template>

      <template #extra>
        <DetailSectionCard title="Resultado" :icon="resultadoIcon" :full-width="true">
          <div
            class="rounded-xl border px-4 py-3"
            :class="resumenTone.box"
          >
            <p class="text-base font-semibold" :class="resumenTone.title">
              {{ resumenTitulo }}
            </p>
            <p class="mt-1 text-sm" :class="resumenTone.body">
              {{ resumenDetalle }}
            </p>
          </div>

          <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Si el estado queda pendiente, espere unos minutos y vuelva a consultar.
          </p>
        </DetailSectionCard>
      </template>
    </DetailCardsLayout>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="open = false"
      >
        Cerrar
      </button>
      <button
        v-if="comprobanteId && !loading"
        type="button"
        class="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
        :disabled="consultarMutation.isPending.value"
        @click="consultar"
      >
        <AppIcon :name="ICONS.refreshCw" :size="16" />
        {{ resultado || errorMessage ? 'Consultar de nuevo' : 'Consultar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useConsultarCdrComprobanteMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import type {
  ComprobanteListItem,
  EmitirComprobanteResponse,
} from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { AppModal, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  modelValue: boolean
  comprobante: ComprobanteListItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const consultarMutation = useConsultarCdrComprobanteMutation()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const resultado = ref<EmitirComprobanteResponse | null>(null)
const errorMessage = ref<string | null>(null)
const autoConsultadoId = ref<number | null>(null)

const comprobanteId = computed(() => props.comprobante?.id ?? null)
const comprobanteLabel = computed(() => {
  if (!props.comprobante) return '—'
  return `${props.comprobante.serie}-${props.comprobante.numero}`
})
const subtitulo = computed(() =>
  props.comprobante
    ? `${props.comprobante.serie}-${props.comprobante.numero}`
    : undefined,
)
const loading = computed(() => consultarMutation.isPending.value)

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

const sunatInfo = computed(() => {
  const root = asRecord(resultado.value?.sunat?.respuesta) ?? {}
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
  String(resultado.value?.sunat.estado ?? '').trim().toUpperCase(),
)

const resultadoIcon = computed(() => {
  switch (estadoNormalizado.value) {
    case 'ACEPTADO':
      return ICONS.check
    case 'RECHAZADO':
      return ICONS.alertCircle
    case 'PENDIENTE':
      return ICONS.refreshCw
    case 'BAJA':
      return ICONS.ban
    default:
      return ICONS.plug
  }
})

const resumenTitulo = computed(() => {
  switch (estadoNormalizado.value) {
    case 'ACEPTADO':
      return 'Comprobante aceptado'
    case 'RECHAZADO':
      return 'Comprobante rechazado o no encontrado'
    case 'PENDIENTE':
      return 'Consulta en proceso'
    case 'BAJA':
      return 'Comprobante dado de baja'
    default:
      return `Estado: ${resultado.value?.sunat.estado ?? '—'}`
  }
})

const resumenDetalle = computed(() => {
  if (sunatInfo.value.mensaje) return sunatInfo.value.mensaje

  switch (estadoNormalizado.value) {
    case 'ACEPTADO':
      return 'SUNAT aceptó el comprobante correctamente.'
    case 'RECHAZADO':
      return 'SUNAT rechazó la consulta o el documento. Revise el mensaje e intente nuevamente.'
    case 'PENDIENTE':
      return 'SUNAT aún no responde con un CDR definitivo.'
    case 'BAJA':
      return 'El comprobante figura como anulado / dado de baja.'
    default:
      return 'Revise el estado del comprobante en el listado.'
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
  if (!resultado.value) return []

  return [
    {
      title: 'Comprobante',
      icon: ICONS.receipt,
      items: [
        { label: 'Número', value: comprobanteLabel.value },
        {
          label: 'Tipo',
          value:
            props.comprobante?.nombre_tipo_comprobante ??
            props.comprobante?.codigo_tipo_comprobante ??
            '—',
        },
      ],
    },
    {
      title: 'Respuesta SUNAT',
      icon: ICONS.shield,
      items: [
        { label: 'Estado', value: resultado.value.sunat.estado },
        { label: 'Código', value: sunatInfo.value.codigo ?? '—' },
        {
          label: 'Mensaje',
          value: sunatInfo.value.mensaje ?? 'Sin mensaje adicional',
          fullWidth: true,
        },
        {
          label: 'Ticket',
          value: resultado.value.sunat.ticket ?? '—',
          fullWidth: true,
        },
      ],
    },
  ]
})

watch(
  () => [props.modelValue, props.comprobante?.id] as const,
  ([isOpen, id]) => {
    if (!isOpen) {
      resultado.value = null
      errorMessage.value = null
      autoConsultadoId.value = null
      return
    }

    if (id && autoConsultadoId.value !== id) {
      autoConsultadoId.value = id
      void consultar()
    }
  },
)

async function consultar() {
  const id = comprobanteId.value
  const userId = authStore.user?.id
  if (!id || !userId) return

  errorMessage.value = null

  try {
    resultado.value = await consultarMutation.mutateAsync({
      id,
      idUsuarioAuditoria: userId,
    })
  } catch (error) {
    resultado.value = null
    errorMessage.value =
      error instanceof Error && error.message
        ? error.message
        : 'No se pudo consultar el CDR'
  }
}
</script>

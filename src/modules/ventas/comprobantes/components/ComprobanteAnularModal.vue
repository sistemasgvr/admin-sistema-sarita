<template>
  <AppModal
    v-model="open"
    title="Anular comprobante"
    :subtitle="comprobanteLabel"
    size="lg"
  >
    <div class="space-y-4">
      <DetailSectionCard title="Advertencia" :icon="ICONS.alertCircle" :full-width="true">
        <div
          class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          Se enviará una
          <strong>comunicación de baja</strong>
          a SUNAT. Aplica a facturas y notas asociadas.
          <span class="mt-1 block">Las boletas no se anulan por este medio: use una nota de crédito.</span>
        </div>
      </DetailSectionCard>

      <DetailCardsLayout :loading="false" :sections="sections">
        <template #badges>
          <ListaOpcionBadge
            v-if="comprobante?.nombre_tipo_comprobante || comprobante?.codigo_tipo_comprobante"
            :value="comprobante.nombre_tipo_comprobante ?? comprobante.codigo_tipo_comprobante"
          />
          <ListaOpcionBadge
            v-if="comprobante?.nombre_estado_sunat"
            :value="comprobante.nombre_estado_sunat"
            raw
          />
        </template>
      </DetailCardsLayout>

      <DetailSectionCard title="Motivo de baja" :icon="ICONS.messageSquare" :full-width="true">
        <AppTextarea
          v-model="motivo"
          label="Describe el motivo"
          placeholder="Ej. ERROR EN CÁLCULOS / CLIENTE INCORRECTO"
          :rows="3"
          :disabled="anularMutation.isPending.value"
          required
        />
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Este texto se envía a SUNAT como motivo de la baja (máx. 250 caracteres).
          <span v-if="motivo.length" class="tabular-nums"> {{ motivo.length }}/250</span>
        </p>
      </DetailSectionCard>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        :disabled="anularMutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="anularMutation.isPending.value || !motivo.trim()"
        @click="confirm"
      >
        <AppIcon
          v-if="!anularMutation.isPending.value"
          :name="ICONS.ban"
          :size="16"
        />
        <AppIcon
          v-else
          :name="ICONS.refreshCw"
          :size="16"
          class="animate-spin"
        />
        {{ anularMutation.isPending.value ? 'Anulando...' : 'Anular en SUNAT' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAnularComprobanteMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import type { ComprobanteListItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { AppModal, AppTextarea, ListaOpcionBadge } from '@/shared/components'
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
const anularMutation = useAnularComprobanteMutation()
const motivo = ref('')

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const comprobanteLabel = computed(() => {
  if (!props.comprobante) return undefined
  return `${props.comprobante.serie}-${props.comprobante.numero}`
})

const sections = computed<DetailSection[]>(() => {
  const row = props.comprobante
  if (!row) return []

  return [
    {
      title: 'Comprobante',
      icon: ICONS.receipt,
      fullWidth: true,
      items: [
        { label: 'Número', value: `${row.serie}-${row.numero}` },
        {
          label: 'Tipo',
          value: row.nombre_tipo_comprobante ?? row.codigo_tipo_comprobante ?? '—',
        },
        { label: 'Cliente', value: row.nombre_cliente ?? '—' },
        { label: 'Fecha', value: row.fecha ?? '—' },
      ],
    },
  ]
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) motivo.value = ''
  },
)

async function confirm() {
  const row = props.comprobante
  const userId = authStore.user?.id
  const texto = motivo.value.trim().slice(0, 250)
  if (!row || !userId || !texto) return

  try {
    await anularMutation.mutateAsync({
      id: row.id,
      idUsuarioAuditoria: userId,
      motivo: texto,
    })
    open.value = false
    motivo.value = ''
  } catch {
    // toast en la mutación
  }
}
</script>

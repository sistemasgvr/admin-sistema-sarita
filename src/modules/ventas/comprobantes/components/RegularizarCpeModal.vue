<template>
  <AppModal v-model="open" title="Regularizar comprobante" :subtitle="referencia" size="md">
    <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
      <p>Se comprobará la validez en SUNAT antes de asignar una nueva referencia de la serie <strong>{{ serieNueva }}</strong>.</p>
      <p>La venta, los cobros y el stock se conservan. La referencia, el XML y el CDR anteriores quedan en el historial. El nuevo comprobante tendrá fecha de emisión {{ hoyIsoLima() }}.</p>
      <p v-if="resultado" class="rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-500/15 dark:text-green-300">
        Preparado: {{ resultado.serie }}-{{ Number(resultado.numero) }}. Puedes emitirlo desde el menú de esta venta.
      </p>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg border border-gray-300 px-4 py-2" :disabled="loading" @click="open = false">Cerrar</button>
      <button v-if="!resultado" type="button" class="rounded-lg bg-brand-500 px-4 py-2 text-white disabled:opacity-50" :disabled="loading || !comprobante" @click="preparar">{{ loading ? 'Verificando...' : 'Preparar nueva referencia' }}</button>
    </template>
  </AppModal>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { AppModal } from '@/shared/components'
import { toastApiError } from '@/shared/composables/useToast'
import { hoyIsoLima } from '@/shared/utils/date'
import { comprobantesService } from '../services/comprobantes.service'
import { comprobantesQueryKeys } from '../constants/comprobantesQueryKeys'
import type { ComprobanteListItem } from '../interfaces/comprobante.interface'
const open = defineModel<boolean>({ default: false })
const props = defineProps<{ comprobante: ComprobanteListItem | null }>()
const queryClient = useQueryClient()
const loading = ref(false)
const resultado = ref<{ serie: string; numero: string } | null>(null)
const referencia = computed(() => props.comprobante ? `${props.comprobante.serie}-${Number(props.comprobante.numero)}` : '')
const serieNueva = computed(() => props.comprobante?.codigo_tipo_comprobante === '01' ? 'F002' : 'B002')
watch(open, () => { resultado.value = null })
async function preparar() {
  if (!props.comprobante || loading.value) return
  loading.value = true
  try {
    resultado.value = await comprobantesService.regularizarCpe(props.comprobante.id)
    await queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.all })
  } catch (error) { toastApiError(error, 'No se pudo regularizar el comprobante') }
  finally { loading.value = false }
}
</script>

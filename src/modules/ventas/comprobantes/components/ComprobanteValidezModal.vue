<template>
  <AppModal v-model="open" title="Validez del comprobante en SUNAT" :subtitle="referencia" size="lg">
    <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
      <p>Consulta con RUC, tipo, serie, número, fecha e importe exactos. Si SUNAT confirma la aceptación, actualiza el estado de la lista. No realiza un nuevo envío.</p>
      <p v-if="loading">Consultando SUNAT...</p>
      <p v-else-if="errorMessage" class="text-error-600 dark:text-error-400">{{ errorMessage }}</p>
      <div v-else-if="resultado" class="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <p class="text-lg font-semibold">{{ resultado.estado }}</p>
        <dl class="grid grid-cols-2 gap-3">
          <div><dt class="text-gray-500">Fecha consultada</dt><dd>{{ resultado.consulta.fechaEmision }}</dd></div>
          <div><dt class="text-gray-500">Importe consultado</dt><dd>{{ resultado.consulta.monto.toFixed(2) }}</dd></div>
          <div><dt class="text-gray-500">RUC emisor</dt><dd>{{ resultado.consulta.numRuc }}</dd></div>
          <div><dt class="text-gray-500">Código SUNAT</dt><dd>{{ resultado.codigo }}</dd></div>
        </dl>
        <p v-if="resultado.codigo === '0'">SUNAT no encuentra el comprobante con estos datos. Esto no confirma por sí solo un rechazo del envío.</p>
        <p v-if="resultado.codigo === '1'">SUNAT confirma la aceptación para la fecha e importe consultados.</p>
        <ul v-if="resultado.observaciones.length"><li v-for="(nota, i) in resultado.observaciones" :key="i">{{ nota }}</li></ul>
      </div>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700" @click="open = false">Cerrar</button>
      <button type="button" class="rounded-lg bg-brand-500 px-4 py-2 text-white disabled:opacity-50" :disabled="loading" @click="consultar">Consultar de nuevo</button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { comprobantesQueryKeys } from '../constants/comprobantesQueryKeys'
import { AppModal } from '@/shared/components'
import { comprobantesService } from '../services/comprobantes.service'
import type { ComprobanteListItem, ComprobanteValidez } from '../interfaces/comprobante.interface'
import { toastApiError } from '@/shared/composables/useToast'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ comprobante: ComprobanteListItem | null }>()
const referencia = computed(() => props.comprobante ? `${props.comprobante.serie}-${props.comprobante.numero.replace(/^0+/, '')}` : '')
const resultado = ref<ComprobanteValidez | null>(null)
const errorMessage = ref('')
const loading = ref(false)
const queryClient = useQueryClient()
let revision = 0
async function consultar() {
  if (!props.comprobante || loading.value) return
  const current = ++revision
  loading.value = true
  errorMessage.value = ''
  resultado.value = null
  try {
    const value = await comprobantesService.sincronizarValidez(props.comprobante.id)
    if (value.estadoActualizado) await queryClient.invalidateQueries({ queryKey: comprobantesQueryKeys.all })
    if (current === revision) resultado.value = value
  } catch (error) {
    if (current === revision) {
      errorMessage.value = 'No se pudo confirmar la validez. Revisa el mensaje de la consulta y vuelve a intentarlo.'
      toastApiError(error, errorMessage.value)
    }
  } finally {
    if (current === revision) loading.value = false
  }
}
watch(() => [open.value, props.comprobante?.id], () => {
  revision++
  loading.value = false
  resultado.value = null
  errorMessage.value = ''
  if (open.value) void consultar()
})
</script>

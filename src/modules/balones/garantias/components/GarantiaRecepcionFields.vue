<template>
  <div class="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
    <p class="text-xs font-medium text-amber-800 dark:text-amber-200">
      Recepción de la garantía
    </p>
    <AppSelect
      v-model="idMedioPago"
      label="Medio de recepción"
      placeholder="¿Cómo se recibe el depósito?"
      required
      :options="medioPagoOptions"
      :disabled="disabled"
      hint="Efectivo, Yape, transferencia, etc."
    />
    <AppInput
      v-model="observacion"
      label="Comentario / nro. operación"
      placeholder="Ej.: Yape op. 123456, voucher, referencia..."
      :disabled="disabled"
      hint="Opcional, pero útil para conciliar el depósito."
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMediosPagoQuery } from '@/modules/finanzas/composables/useMediosPagoQuery'
import { AppInput, AppSelect } from '@/shared/components'
import type { SelectOption } from '@/shared/interfaces/form.interface'

defineProps<{ disabled?: boolean }>()

const idMedioPago = defineModel<string | number>('idMedioPago', { default: '' })
const observacion = defineModel<string>('observacion', { default: '' })

const mediosQuery = useMediosPagoQuery()
const medioPagoOptions = computed<SelectOption[]>(() =>
  (mediosQuery.data.value ?? []).map((m) => ({ label: m.nombre, value: m.id })),
)
</script>

<template>
  <AppModal
    v-model="open"
    title="Finalizar mantenimiento"
    :subtitle="mantenimiento?.codigo_balon || undefined"
    size="sm"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Se marcará como
        <span class="font-medium text-gray-800 dark:text-white/90">FINALIZADO</span>.
        <template v-if="esServicioCliente">
          El cilindro
          <span class="font-medium text-gray-800 dark:text-white/90">
            {{ codigoCilindro }}
          </span>
          se
          <span class="font-medium text-gray-800 dark:text-white/90">entrega al cliente</span>
          (no entra como stock de almacén).
        </template>
        <template v-else>
          El cilindro
          <span class="font-medium text-gray-800 dark:text-white/90">
            {{ codigoCilindro }}
          </span>
          reingresa a
          <span class="font-medium text-gray-800 dark:text-white/90">EN_ALMACEN</span>.
        </template>
      </p>

      <AppInput
        v-model="fechaSalida"
        :label="esServicioCliente ? 'Fecha de entrega al cliente' : 'Fecha de salida / reingreso'"
        type="date"
        required
      />

      <AppTextarea
        v-model="observacion"
        label="Observación"
        placeholder="Opcional"
        :rows="2"
      />
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="finalizarMutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="finalizarMutation.isPending.value || !fechaSalida"
        @click="confirmFinalizar"
      >
        {{
          finalizarMutation.isPending.value
            ? 'Finalizando...'
            : esServicioCliente
              ? 'Finalizar y entregar'
              : 'Finalizar'
        }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFinalizarMantenimientoMutation } from '@/modules/balones/mantenimientos/composables/useMantenimientoMutations'
import type { Mantenimiento } from '@/modules/balones/mantenimientos/interfaces/mantenimiento.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppTextarea } from '@/shared/components'
import { toastWarning } from '@/shared/composables/useToast'

const props = defineProps<{
  mantenimiento?: Mantenimiento | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const finalizarMutation = useFinalizarMantenimientoMutation()
const fechaSalida = ref(new Date().toISOString().slice(0, 10))
const observacion = ref('')

const codigoCilindro = computed(
  () =>
    props.mantenimiento?.codigo_balon ||
    (props.mantenimiento?.id_balon ? `#${props.mantenimiento.id_balon}` : 'sin código'),
)

/** Cilindro del cliente o envase con ubicación en cliente → se entrega, no a stock */
const esServicioCliente = computed(() => {
  const propietario = (props.mantenimiento?.nombre_propietario ?? '').toUpperCase()
  return propietario === 'CLIENTE' || props.mantenimiento?.id_cliente_ubicacion != null
})

watch(
  () => [open.value, props.mantenimiento?.id] as const,
  ([isOpen]) => {
    if (isOpen) {
      fechaSalida.value =
        props.mantenimiento?.fecha_salida?.slice(0, 10) ||
        new Date().toISOString().slice(0, 10)
      observacion.value = ''
    }
  },
)

async function confirmFinalizar() {
  const mantenimiento = props.mantenimiento
  const userId = authStore.user?.id
  if (!mantenimiento || !userId) return
  if (!fechaSalida.value) {
    toastWarning('Indica la fecha de salida')
    return
  }

  try {
    await finalizarMutation.mutateAsync({
      id: mantenimiento.id,
      payload: {
        idUsuarioAuditoria: userId,
        fechaSalida: fechaSalida.value,
        observacion: observacion.value || undefined,
      },
    })
    open.value = false
    emit('saved')
  } catch {
    // toast en mutation
  }
}
</script>

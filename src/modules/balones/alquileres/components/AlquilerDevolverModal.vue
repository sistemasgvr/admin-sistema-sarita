<template>
  <AppModal
    v-model="open"
    title="Registrar devolución"
    :subtitle="detalle?.codigo_balon || detalle?.numero_alquiler || undefined"
    size="sm"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Se registrará el retorno del cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ detalle?.codigo_balon || `#${detalle?.id_balon}` }}
        </span>
        al almacén, con movimiento de entrada por devolución.
      </p>

      <AppInput
        v-model="fechaDevolucion"
        label="Fecha de devolución"
        type="date"
        required
      />
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="devolverMutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="devolverMutation.isPending.value || !fechaDevolucion"
        @click="confirmDevolver"
      >
        {{ devolverMutation.isPending.value ? 'Registrando...' : 'Devolver' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDevolverAlquilerDetalleMutation } from '@/modules/balones/alquileres/composables/useAlquilerDetalleMutations'
import type { AlquilerDetalle } from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal } from '@/shared/components'
import { toastWarning } from '@/shared/composables/useToast'

const props = defineProps<{
  detalle?: AlquilerDetalle | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const devolverMutation = useDevolverAlquilerDetalleMutation()
const fechaDevolucion = ref(new Date().toISOString().slice(0, 10))

watch(
  () => [open.value, props.detalle?.id] as const,
  ([isOpen]) => {
    if (isOpen) {
      fechaDevolucion.value = new Date().toISOString().slice(0, 10)
    }
  },
)

async function confirmDevolver() {
  const detalle = props.detalle
  const userId = authStore.user?.id
  if (!detalle || !userId) return
  if (!fechaDevolucion.value) {
    toastWarning('Indica la fecha de devolución')
    return
  }

  try {
    await devolverMutation.mutateAsync({
      id: detalle.id,
      payload: {
        idUsuarioAuditoria: userId,
        fechaDevolucion: fechaDevolucion.value,
      },
    })
    open.value = false
    emit('saved')
  } catch {
    // toast en mutation
  }
}
</script>

<template>
  <AppModal
    v-model="open"
    title="Devolver / reingresar cilindro"
    :subtitle="detalle?.codigo_balon || detalle?.numero_prestamo || undefined"
    size="sm"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Se registrará el reingreso del cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ detalle?.codigo_balon || (detalle?.id_balon ? `#${detalle.id_balon}` : 'sin código') }}
        </span>
        al almacén (movimiento de entrada por devolución) y saldrá del pendiente de antigüedad.
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
import { useDevolverPrestamoDetalleMutation } from '@/modules/balones/prestamos/composables/usePrestamoDetalleMutations'
import type { PrestamoDetalle } from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal } from '@/shared/components'
import { toastWarning } from '@/shared/composables/useToast'

const props = defineProps<{
  detalle?: PrestamoDetalle | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const devolverMutation = useDevolverPrestamoDetalleMutation()
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

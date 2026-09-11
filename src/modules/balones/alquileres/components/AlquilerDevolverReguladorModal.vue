<template>
  <AppModal
    v-model="open"
    title="Devolver regulador / accesorio"
    :subtitle="alquiler?.numero_alquiler || undefined"
    size="sm"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Se registra la devolución de
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ nombreAccesorio }}
        </span>
        y el alquiler queda finalizado. En buen estado reingresa al stock del almacén del
        contrato; si necesita reparación se abre un mantenimiento del accesorio.
      </p>

      <AppInput v-model="fecha" label="Fecha de devolución" type="date" required />

      <AppSelect
        v-model="condicion"
        label="Condición del accesorio"
        :options="condicionOptions"
        required
      />

      <AppTextarea
        v-model="observacion"
        label="Observación"
        :rows="2"
        placeholder="Opcional"
        optional
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
        :disabled="devolverMutation.isPending.value || !fecha"
        @click="confirmDevolver"
      >
        {{ devolverMutation.isPending.value ? 'Registrando...' : 'Devolver' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDevolverReguladorAlquilerMutation } from '@/modules/balones/alquileres/composables/useAlquilerMutations'
import type {
  Alquiler,
  CondicionReguladorDevolucion,
} from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppTextarea } from '@/shared/components'
import { toastWarning } from '@/shared/composables/useToast'

const props = defineProps<{
  alquiler?: Alquiler | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const devolverMutation = useDevolverReguladorAlquilerMutation()

const hoy = () => new Date().toISOString().slice(0, 10)
const fecha = ref(hoy())
const condicion = ref<CondicionReguladorDevolucion>('BUENO')
const observacion = ref('')

const condicionOptions = [
  { value: 'BUENO', label: 'Buen estado (reingresa a stock)' },
  { value: 'PARA_REPARAR', label: 'Para reparar (abre mantenimiento)' },
]

const nombreAccesorio = computed(
  () =>
    props.alquiler?.nombre_producto_stock ||
    props.alquiler?.nombre_producto_regulador ||
    'el regulador / accesorio alquilado',
)

watch(
  () => [open.value, props.alquiler?.id] as const,
  ([isOpen]) => {
    if (!isOpen) return
    fecha.value = hoy()
    condicion.value = 'BUENO'
    observacion.value = ''
  },
)

async function confirmDevolver() {
  const alquiler = props.alquiler
  const userId = authStore.user?.id
  if (!alquiler || !userId) return
  if (!fecha.value) {
    toastWarning('Indica la fecha de devolución')
    return
  }

  try {
    await devolverMutation.mutateAsync({
      id: alquiler.id,
      payload: {
        idUsuarioAuditoria: userId,
        fecha: fecha.value,
        condicion: condicion.value,
        observacion: observacion.value.trim() || undefined,
      },
    })
    open.value = false
    emit('saved')
  } catch {
    // toast en mutation
  }
}
</script>

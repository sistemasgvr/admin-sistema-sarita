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

      <AlmacenSelectField
        v-model="idAlmacenDestino"
        label="Almacén de destino"
        hint="Donde reingresa el cilindro"
        searchable
        required
        :disabled="almacenesQuery.isLoading.value"
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
        :disabled="devolverMutation.isPending.value || !fechaDevolucion || !idAlmacenDestino"
        @click="confirmDevolver"
      >
        {{ devolverMutation.isPending.value ? 'Registrando...' : 'Devolver' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useDevolverAlquilerDetalleMutation } from '@/modules/balones/alquileres/composables/useAlquilerDetalleMutations'
import type { AlquilerDetalle } from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { usePosAlmacenDefault } from '@/modules/ventas/comprobantes/composables/usePosAlmacenDefault'
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
const idAlmacenDestino = ref<number | ''>('')

const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)
const almacenesData = computed(() => almacenesQuery.data.value?.data)
const { aplicarAlmacenPorDefecto } = usePosAlmacenDefault(almacenesData, idAlmacenDestino)

watch(
  () => [open.value, props.detalle?.id] as const,
  ([isOpen]) => {
    if (!isOpen) return
    fechaDevolucion.value = new Date().toISOString().slice(0, 10)
    idAlmacenDestino.value = props.detalle?.id_almacen ? Number(props.detalle.id_almacen) : ''
    if (!idAlmacenDestino.value) {
      aplicarAlmacenPorDefecto()
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
  if (!idAlmacenDestino.value) {
    toastWarning('Selecciona el almacén de destino')
    return
  }

  try {
    await devolverMutation.mutateAsync({
      id: detalle.id,
      payload: {
        idUsuarioAuditoria: userId,
        fechaDevolucion: fechaDevolucion.value,
        idAlmacenDestino: Number(idAlmacenDestino.value),
      },
    })
    open.value = false
    emit('saved')
  } catch {
    // toast en mutation
  }
}
</script>

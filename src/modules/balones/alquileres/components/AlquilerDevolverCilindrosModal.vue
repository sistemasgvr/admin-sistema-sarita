<template>
  <AppModal
    v-model="open"
    title="Devolver cilindros"
    :subtitle="subtitle"
    size="md"
    @close="handleClose"
  >
    <div v-if="isLoading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando cilindros...
    </div>

    <div v-else-if="pendientes.length === 0" class="space-y-2 py-4 text-sm text-gray-600 dark:text-gray-400">
      <p>No hay cilindros pendientes de devolución en este alquiler.</p>
      <p v-if="devueltos.length > 0" class="text-theme-xs text-gray-500">
        {{ devueltos.length }} cilindro(s) ya devuelto(s).
      </p>
    </div>

    <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <li
        v-for="detalle in pendientes"
        :key="detalle.id"
        class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div class="min-w-0">
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ detalle.codigo_balon || `Cilindro #${detalle.id_balon}` }}
          </p>
          <p class="text-theme-xs text-gray-500 dark:text-gray-400">Pendiente de devolución</p>
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
          @click="abrirDevolver(detalle)"
        >
          <AppIcon :name="ICONS.clipboardCheck" :size="15" />
          Devolver
        </button>
      </li>
    </ul>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        @click="handleClose"
      >
        Cerrar
      </button>
    </template>
  </AppModal>

  <AlquilerDevolverModal
    v-model="devolverModalOpen"
    :detalle="detalleToDevolver"
    @saved="onDetalleDevuelto"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AlquilerDevolverModal from '@/modules/balones/alquileres/components/AlquilerDevolverModal.vue'
import { useAlquileresDetalleQuery } from '@/modules/balones/alquileres/composables/useAlquileresDetalleQuery'
import type { Alquiler } from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import type {
  AlquilerDetalle,
  AlquilerDetalleListFilters,
} from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'
import { AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { toastInfo } from '@/shared/composables/useToast'

const props = defineProps<{
  alquiler?: Alquiler | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const detalleFilters = ref<AlquilerDetalleListFilters>({
  idAlquiler: undefined,
  pagina: 1,
  limite: 100,
})
const detallesQuery = useAlquileresDetalleQuery(detalleFilters)

const devolverModalOpen = ref(false)
const detalleToDevolver = ref<AlquilerDetalle | null>(null)

const subtitle = computed(() => {
  const a = props.alquiler
  if (!a) return undefined
  const cliente = a.nombre_cliente ? ` · ${a.nombre_cliente}` : ''
  return `${a.numero_alquiler}${cliente}`
})

const isLoading = computed(
  () => open.value && (detallesQuery.isLoading.value || detallesQuery.isFetching.value),
)

const todos = computed(() => detallesQuery.data.value?.data ?? [])

const pendientes = computed(() => todos.value.filter((item) => !item.fecha_devolucion))

const devueltos = computed(() => todos.value.filter((item) => Boolean(item.fecha_devolucion)))

watch(
  () => [open.value, props.alquiler?.id] as const,
  ([isOpen, id]) => {
    if (!isOpen || !id) {
      detalleFilters.value = { ...detalleFilters.value, idAlquiler: undefined }
      return
    }
    detalleFilters.value = {
      idAlquiler: id,
      pagina: 1,
      limite: 100,
    }
  },
  { immediate: true },
)

function abrirDevolver(detalle: AlquilerDetalle) {
  detalleToDevolver.value = detalle
  devolverModalOpen.value = true
}

async function onDetalleDevuelto() {
  emit('saved')
  await detallesQuery.refetch()
  if (pendientes.value.length === 0) {
    toastInfo('Todos los cilindros de este alquiler ya fueron devueltos.')
    open.value = false
  }
}

function handleClose() {
  open.value = false
  detalleToDevolver.value = null
}
</script>

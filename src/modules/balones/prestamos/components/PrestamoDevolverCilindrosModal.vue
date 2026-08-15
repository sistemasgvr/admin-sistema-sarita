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

    <div
      v-else-if="pendientes.length === 0"
      class="space-y-2 py-4 text-sm text-gray-600 dark:text-gray-400"
    >
      <p>No hay cilindros pendientes de devolución en este préstamo.</p>
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
            {{ labelDetalle(detalle) }}
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

  <PrestamoDevolverModal
    v-model="devolverModalOpen"
    :detalle="detalleToDevolver"
    @saved="onDetalleDevuelto"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PrestamoDevolverModal from '@/modules/balones/prestamos/components/PrestamoDevolverModal.vue'
import { usePrestamosDetalleQuery } from '@/modules/balones/prestamos/composables/usePrestamosDetalleQuery'
import type { Prestamo } from '@/modules/balones/prestamos/interfaces/prestamo.interface'
import type {
  PrestamoDetalle,
  PrestamoDetalleListFilters,
} from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'
import { AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { toastInfo } from '@/shared/composables/useToast'

const props = defineProps<{
  prestamo?: Prestamo | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const detalleFilters = ref<PrestamoDetalleListFilters>({
  idPrestamo: undefined,
  pagina: 1,
  limite: 100,
})
const detallesQuery = usePrestamosDetalleQuery(detalleFilters)

const devolverModalOpen = ref(false)
const detalleToDevolver = ref<PrestamoDetalle | null>(null)

const subtitle = computed(() => {
  const p = props.prestamo
  if (!p) return undefined
  const numero = p.numero_prestamo || p.titulo || `Préstamo #${p.id}`
  const cliente = p.nombre_cliente ? ` · ${p.nombre_cliente}` : ''
  return `${numero}${cliente}`
})

const isLoading = computed(
  () => open.value && (detallesQuery.isLoading.value || detallesQuery.isFetching.value),
)

const todos = computed(() => detallesQuery.data.value?.data ?? [])

const pendientes = computed(() => todos.value.filter((item) => !item.fecha_devolucion))

const devueltos = computed(() => todos.value.filter((item) => Boolean(item.fecha_devolucion)))

watch(
  () => [open.value, props.prestamo?.id] as const,
  ([isOpen, id]) => {
    if (!isOpen || !id) {
      detalleFilters.value = { ...detalleFilters.value, idPrestamo: undefined }
      return
    }
    detalleFilters.value = {
      idPrestamo: id,
      pagina: 1,
      limite: 100,
    }
  },
  { immediate: true },
)

function labelDetalle(detalle: PrestamoDetalle) {
  const gas = detalle.nombre_producto_gas || detalle.nombre_producto
  if (detalle.codigo_balon) return gas ? `${detalle.codigo_balon} · ${gas}` : detalle.codigo_balon
  if (detalle.id_balon) return gas ? `Cilindro #${detalle.id_balon} · ${gas}` : `Cilindro #${detalle.id_balon}`
  if (gas) return gas
  return `Detalle #${detalle.id}`
}

function abrirDevolver(detalle: PrestamoDetalle) {
  detalleToDevolver.value = detalle
  devolverModalOpen.value = true
}

async function onDetalleDevuelto() {
  emit('saved')
  await detallesQuery.refetch()
  if (pendientes.value.length === 0) {
    toastInfo('Todos los cilindros de este préstamo ya fueron devueltos.')
    open.value = false
  }
}

function handleClose() {
  open.value = false
  detalleToDevolver.value = null
}
</script>

<template>
  <div>
    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <div class="flex flex-col gap-3">
          <div
            class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            Solicitudes de baja de clientes pendientes de aprobación. Solo un administrador
            distinto al solicitante puede aprobar o rechazar.
          </div>

          <AppListToolbar v-model:search="buscar" search-placeholder="Cliente, motivo o solicitante..." />
        </div>
      </template>

      <template #cell-cliente="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.cliente_razon_social ?? row.nombre_cliente ?? '—' }}

        </p>
        <p v-if="row.numero_documento" class="text-xs text-gray-500 dark:text-gray-400">
          {{ row.numero_documento }}
        </p>
      </template>

      <template #cell-fecha_creacion="{ value }">
        <span>{{ formatListDate(value as string) }}</span>
      </template>

      <template #cell-nombre_estado_aprobacion="{ value }">
        <AppBadge :color="getEstadoColor(value as string)" variant="light" size="sm">
          {{ value }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <button type="button" title="Ver detalle"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetailModal(row)">
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>

        <button v-if="canAprobar" type="button" title="Aprobar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10"
          @click="openAprobarModal(row)">
          <AppIcon :name="ICONS.check" :size="16" />
        </button>

        <button v-if="canAprobar" type="button" title="Rechazar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openRechazarModal(row)">
          <AppIcon :name="ICONS.x" :size="16" />
        </button>
      </template>

      <template #footer>
        <AppPagination v-model:pagina="pagina" v-model:limite="limite" :meta="bajasQuery.data.value?.meta"
          :disabled="isLoading" />
      </template>
    </AppTable>

    <AppModal v-model="detailModalOpen" title="Detalle de solicitud de baja"
      :subtitle="solicitudSeleccionada?.nombre_cliente ?? ''" size="lg">
      <div v-if="detailQuery.data.value" class="grid gap-4 sm:grid-cols-2">
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Motivo</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ detailQuery.data.value.nombre_motivo_baja ?? solicitudSeleccionada?.nombre_motivo_baja }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Solicitante</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ detailQuery.data.value.nombre_usuario_solicita ?? solicitudSeleccionada?.nombre_usuario_solicita }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Solicitado el</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ formatListDate(detailQuery.data.value.fecha_creacion ?? solicitudSeleccionada?.fecha_creacion) }}
          </p>
        </div>
        <div v-if="detailQuery.data.value.cliente_direccion">
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Dirección</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ detailQuery.data.value.cliente_direccion }}
          </p>
        </div>
        <div v-if="detailQuery.data.value.cliente_telefono">
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Teléfono</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ detailQuery.data.value.cliente_telefono }}
          </p>
        </div>
        <div v-if="detailQuery.data.value.cliente_email">
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Email</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ detailQuery.data.value.cliente_email }}
          </p>
        </div>
        <div v-if="detailQuery.data.value.motivo_detalle" class="sm:col-span-2">
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Detalle</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ detailQuery.data.value.motivo_detalle }}
          </p>
        </div>
      </div>
      <div v-else-if="detailQuery.isLoading.value" class="py-8 text-center text-sm text-gray-500">
        Cargando detalles...
      </div>

      <template #footer>
        <button type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          @click="detailModalOpen = false">
          Cerrar
        </button>
      </template>
    </AppModal>

    <AppModal v-model="aprobarModalOpen" title="Aprobar baja de cliente"
      :subtitle="solicitudSeleccionada?.nombre_cliente ?? ''" size="sm">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas la baja del cliente
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ solicitudSeleccionada?.nombre_cliente }}
        </span>
        por motivo
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ solicitudSeleccionada?.nombre_motivo_baja }}
        </span>
        ?
      </p>

      <template #footer>
        <button type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="aprobarMutation.isPending.value" @click="aprobarModalOpen = false">
          Cancelar
        </button>
        <button type="button"
          class="flex w-full justify-center rounded-lg bg-success-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-success-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="aprobarMutation.isPending.value" @click="confirmarAprobacion">
          {{ aprobarMutation.isPending.value ? 'Procesando...' : 'Aprobar baja' }}
        </button>
      </template>
    </AppModal>

    <AppModal v-model="rechazarModalOpen" title="Rechazar solicitud de baja"
      :subtitle="solicitudSeleccionada?.nombre_cliente ?? ''" size="md">
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          La solicitud quedará rechazada y el cliente seguirá activo en el sistema.
        </p>
        <AppTextarea v-model="motivoRechazo" label="Motivo del rechazo (opcional)"
          placeholder="Indica por qué se rechaza la solicitud..." :disabled="rechazarMutation.isPending.value" />
      </div>

      <template #footer>
        <button type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="rechazarMutation.isPending.value" @click="rechazarModalOpen = false">
          Cancelar
        </button>
        <button type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="rechazarMutation.isPending.value" @click="confirmarRechazo">
          {{ rechazarMutation.isPending.value ? 'Procesando...' : 'Rechazar solicitud' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useAprobarBajaClienteMutation,
  useRechazarBajaClienteMutation,
} from '@/modules/clientes/bajas-cliente/composables/useBajaClienteMutations'
import { useBajaClienteDetailQuery } from '@/modules/clientes/bajas-cliente/composables/useBajaClienteDetailQuery'
import { useBajasClienteQuery } from '@/modules/clientes/bajas-cliente/composables/useBajasClienteQuery'
import type { BajaCliente } from '@/modules/clientes/bajas-cliente/interfaces/baja-cliente.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppListToolbar, AppModal, AppPagination, AppTable, AppTextarea } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatListDate } from '@/shared/utils/date'
import type { TableColumn } from '@/shared/interfaces/table.interface'

withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false,
  },
)

const authStore = useAuthStore()

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const bajasQuery = useBajasClienteQuery(filters)
const aprobarMutation = useAprobarBajaClienteMutation()
const rechazarMutation = useRechazarBajaClienteMutation()

const detailModalOpen = ref(false)
const aprobarModalOpen = ref(false)
const rechazarModalOpen = ref(false)
const solicitudSeleccionada = ref<BajaCliente | null>(null)
const motivoRechazo = ref('')

const detailId = ref<number | undefined>(undefined)
const detailEnabled = ref(false)
const detailQuery = useBajaClienteDetailQuery(detailId, detailEnabled)

const esAdministrador = computed(() =>
  authStore.user?.roles?.some((rol) => rol.nombre?.toUpperCase() === 'ADMINISTRADOR'),
)

const canAprobar = computed(
  () =>
    esAdministrador.value && authStore.hasPermission(PermisoBanderas.CLIENTES_EDITAR),
)

const isLoading = computed(
  () => bajasQuery.isFetching.value || bajasQuery.isLoading.value,
)

const rows = computed(() => bajasQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'nombre_motivo_baja', label: 'Motivo' },
  { key: 'nombre_usuario_solicita', label: 'Solicitante' },
  { key: 'fecha_creacion', label: 'Solicitado' },
  { key: 'nombre_estado_aprobacion', label: 'Estado' }
]

const getEstadoColor = (
  estado: string,
): 'warning' | 'success' | 'error' | 'neutral' => {
  switch (estado?.toUpperCase()) {
    case 'PENDIENTE':
      return 'warning'

    case 'APROBADA':
      return 'success'

    case 'RECHAZADA':
      return 'error'

    default:
      return 'neutral'
  }
}

const openDetailModal = (row: BajaCliente) => {
  solicitudSeleccionada.value = row
  detailId.value = row.id
  detailEnabled.value = true
  detailModalOpen.value = true
}

const openAprobarModal = (row: BajaCliente) => {
  solicitudSeleccionada.value = row
  aprobarModalOpen.value = true
}

const openRechazarModal = (row: BajaCliente) => {
  solicitudSeleccionada.value = row
  motivoRechazo.value = ''
  rechazarModalOpen.value = true
}

const confirmarAprobacion = async () => {
  const userId = authStore.user?.id
  const solicitud = solicitudSeleccionada.value
  if (!userId || !solicitud) return

  try {
    await aprobarMutation.mutateAsync({
      id: solicitud.id,
      payload: {
        idUsuarioAuditoria: userId,
      },
    })
    aprobarModalOpen.value = false
    detailModalOpen.value = false
  } catch {
    // toast en mutation
  }
}

const confirmarRechazo = async () => {
  const userId = authStore.user?.id
  const solicitud = solicitudSeleccionada.value
  if (!userId || !solicitud) return

  try {
    await rechazarMutation.mutateAsync({
      id: solicitud.id,
      payload: {
        idUsuarioAuditoria: userId,
        motivoRechazo: motivoRechazo.value || undefined,
      },
    })
    rechazarModalOpen.value = false
    detailModalOpen.value = false
  } catch {
    // toast en mutation
  }
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
  }
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncFilters()
  }, 350)
})

watch([pagina, limite], () => {
  syncFilters()
})

watch(detailModalOpen, (open) => {
  if (!open) {
    detailEnabled.value = false
  }
})
</script>

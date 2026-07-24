<template>
  <div>
    <PageBreadcrumb
      v-if="!embedded"
      page-title="Aprobar bajas"
      :items="breadcrumbItems"
    />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          search-placeholder="Cilindro, motivo o solicitante..."
        >
          <template #actions>
            <AppHelpTip
              text="Solicitudes de baja de cilindros pendientes de aprobación. Solo un administrador distinto al solicitante puede aprobar o rechazar."
            />
          </template>
        </AppListToolbar>
      </template>

      <template #cell-codigo_balon="{ row }">
        <div>
          <p class="font-medium text-gray-800 dark:text-white/90">{{ row.codigo_balon }}</p>
          <p v-if="row.numero_serie" class="text-xs text-gray-500 dark:text-gray-400">
            {{ row.numero_serie }}
          </p>
        </div>
      </template>

      <template #cell-fecha_baja="{ value }">
        <span>{{ formatListDate(value as string) }}</span>
      </template>

      <template #cell-fecha_creacion="{ value }">
        <span>{{ formatListDate(value as string) }}</span>
      </template>

      <template #cell-monto_venta="{ value }">
        <span v-if="value != null">{{ formatMoney(value as number) }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            type="button"
            title="Ver detalle"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openDetailModal(row)"
          >
            <AppIcon :name="ICONS.eye" :size="15" />
          </button>
          <AppActionMenu
            :items="actionItemsForRow(row)"
            :execute="(key) => onActionSelect(key, row)"
          />
        </div>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="bajasQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <AppModal
      v-model="detailModalOpen"
      title="Detalle de solicitud"
      :subtitle="solicitudSeleccionada?.codigo_balon ?? ''"
      size="lg"
    >
      <div v-if="solicitudSeleccionada" class="grid gap-4 sm:grid-cols-2">
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Motivo</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ solicitudSeleccionada.nombre_motivo_baja }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Fecha baja</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ formatListDate(solicitudSeleccionada.fecha_baja) }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Solicitante</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ solicitudSeleccionada.nombre_usuario_solicita }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Solicitado el</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ formatListDate(solicitudSeleccionada.fecha_creacion) }}
          </p>
        </div>
        <div v-if="solicitudSeleccionada.nombre_cliente_comprador" class="sm:col-span-2">
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Comprador</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ solicitudSeleccionada.nombre_cliente_comprador }}
          </p>
        </div>
        <div
          v-if="solicitudSeleccionada.serie_comprobante || solicitudSeleccionada.numero_comprobante"
        >
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Comprobante</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{
              [solicitudSeleccionada.serie_comprobante, solicitudSeleccionada.numero_comprobante]
                .filter(Boolean)
                .join('-')
            }}
          </p>
        </div>
        <div v-if="solicitudSeleccionada.monto_venta != null">
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Monto venta</p>
          <p class="text-sm text-gray-800 dark:text-white/90">
            {{ formatMoney(solicitudSeleccionada.monto_venta) }}
          </p>
        </div>
        <div v-if="solicitudSeleccionada.motivo_detalle" class="sm:col-span-2">
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Detalle</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ solicitudSeleccionada.motivo_detalle }}
          </p>
        </div>
        <div v-if="solicitudSeleccionada.observacion" class="sm:col-span-2">
          <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Observación</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ solicitudSeleccionada.observacion }}
          </p>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          @click="detailModalOpen = false"
        >
          Cerrar
        </button>
      </template>
    </AppModal>

    <AppModal
      v-model="aprobarModalOpen"
      title="Aprobar baja de cilindro"
      :subtitle="solicitudSeleccionada?.codigo_balon ?? ''"
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas la baja definitiva del cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ solicitudSeleccionada?.codigo_balon }}
        </span>
        por motivo
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ solicitudSeleccionada?.nombre_motivo_baja }}
        </span>
        ?
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="aprobarMutation.isPending.value"
          @click="aprobarModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-success-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-success-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="aprobarMutation.isPending.value"
          @click="confirmarAprobacion"
        >
          {{ aprobarMutation.isPending.value ? 'Procesando...' : 'Aprobar baja' }}
        </button>
      </template>
    </AppModal>

    <AppModal
      v-model="rechazarModalOpen"
      title="Rechazar solicitud de baja"
      :subtitle="solicitudSeleccionada?.codigo_balon ?? ''"
      size="md"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          La solicitud quedará rechazada y el cilindro seguirá activo en el parque.
        </p>
        <AppTextarea
          v-model="motivoRechazo"
          label="Motivo del rechazo (opcional)"
          placeholder="Indica por qué se rechaza la solicitud..."
          :disabled="rechazarMutation.isPending.value"
        />
      </div>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="rechazarMutation.isPending.value"
          @click="rechazarModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="rechazarMutation.isPending.value"
          @click="confirmarRechazo"
        >
          {{ rechazarMutation.isPending.value ? 'Procesando...' : 'Rechazar solicitud' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import {
  useAprobarBajaMutation,
  useRechazarBajaMutation,
} from '@/modules/balones/bajas-pendientes/composables/useBajaSolicitudMutations'
import { useBajasPendientesQuery } from '@/modules/balones/bajas-pendientes/composables/useBajasPendientesQuery'
import type { BajaSolicitud } from '@/modules/balones/bajas-pendientes/interfaces/baja-solicitud.interface'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppHelpTip,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
  AppTextarea,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatListDate } from '@/shared/utils/date'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
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

const bajasQuery = useBajasPendientesQuery(filters)
const aprobarMutation = useAprobarBajaMutation()
const rechazarMutation = useRechazarBajaMutation()

const detailModalOpen = ref(false)
const aprobarModalOpen = ref(false)
const rechazarModalOpen = ref(false)
const solicitudSeleccionada = ref<BajaSolicitud | null>(null)
const motivoRechazo = ref('')

const breadcrumbItems = balonesBreadcrumbItems('Aprobar bajas')

const esAdministrador = computed(() =>
  authStore.user?.roles?.some((rol) => rol.nombre?.toUpperCase() === 'ADMINISTRADOR'),
)

const canAprobar = computed(
  () =>
    esAdministrador.value && authStore.hasPermission(PermisoBanderas.BALONES_EDITAR),
)

const isLoading = computed(
  () => bajasQuery.isFetching.value || bajasQuery.isLoading.value,
)

const rows = computed(() => bajasQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'nombre_motivo_baja', label: 'Motivo' },
  { key: 'nombre_usuario_solicita', label: 'Solicitante' },
  { key: 'fecha_baja', label: 'Fecha baja' },
  { key: 'fecha_creacion', label: 'Solicitado' },
  { key: 'monto_venta', label: 'Monto' },
]

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

const openDetailModal = (row: BajaSolicitud) => {
  solicitudSeleccionada.value = row
  detailModalOpen.value = true
}

const openAprobarModal = (row: BajaSolicitud) => {
  solicitudSeleccionada.value = row
  aprobarModalOpen.value = true
}

const openRechazarModal = (row: BajaSolicitud) => {
  solicitudSeleccionada.value = row
  motivoRechazo.value = ''
  rechazarModalOpen.value = true
}

function actionItemsForRow(_row: BajaSolicitud): ActionMenuItem[] {
  return [
    {
      key: 'aprobar',
      label: 'Aprobar',
      icon: ICONS.check,
      hidden: !canAprobar.value,
    },
    {
      key: 'rechazar',
      label: 'Rechazar',
      icon: ICONS.x,
      danger: true,
      hidden: !canAprobar.value,
    },
  ]
}

function onActionSelect(key: string, row: BajaSolicitud) {
  if (key === 'aprobar') openAprobarModal(row)
  if (key === 'rechazar') openRechazarModal(row)
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
        idUsuarioAutoriza: userId,
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
        idUsuarioAutoriza: userId,
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
</script>

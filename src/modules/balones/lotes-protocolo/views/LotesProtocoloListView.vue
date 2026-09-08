<template>
  <div>
    <PageBreadcrumb page-title="Lote y protocolo" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          search-placeholder="N° de lote, protocolo, proveedor o serie..."
        >
          <template #tools>
            <AppSelect
              v-model="vencidosFiltro"
              :options="vencidosOptions"
              placeholder="Vigencia"
              class="w-full sm:w-48"
            />
          </template>
          <template #actions>
            <button
              v-if="canCreate"
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="openCreateModal"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nueva ficha
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-numero_lote="{ row }">
        <div class="flex flex-col">
          <span class="font-medium text-gray-800 dark:text-white/90">{{ row.numero_lote }}</span>
          <span v-if="row.numero_protocolo" class="text-xs text-gray-400">
            Protocolo {{ row.numero_protocolo }}
          </span>
        </div>
      </template>

      <template #cell-nombre_proveedor="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-fecha_vencimiento="{ row }">
        <AppBadge
          v-if="row.fecha_vencimiento"
          size="sm"
          variant="light"
          :color="row.vencido ? 'error' : 'success'"
          :title="row.vencido ? 'Lote vencido' : 'Lote vigente'"
        >
          {{ fechaAMesAnio(row.fecha_vencimiento) }}
        </AppBadge>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-valoracion_o2_pct="{ value }">
        <span v-if="value != null">{{ Number(value) }}%</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-total_envases="{ row }">
        <AppBadge
          size="sm"
          variant="light"
          :color="Number(row.total_envases ?? 0) > 0 ? 'primary' : 'neutral'"
          :title="`${row.total_envases_vinculados ?? 0} de ${row.total_envases ?? 0} envases existen como cilindro en el sistema`"
        >
          {{ row.total_envases_vinculados ?? 0 }} / {{ row.total_envases ?? 0 }}
        </AppBadge>
      </template>

      <template #cell-total_balones_vigentes="{ value }">
        <AppBadge
          size="sm"
          variant="light"
          :color="Number(value ?? 0) > 0 ? 'success' : 'neutral'"
          title="Cilindros que hoy tienen esta ficha como vigente"
        >
          {{ value ?? 0 }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            v-if="canView"
            type="button"
            title="Ver ficha"
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
          :meta="lotesQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <LoteProtocoloFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :lote-id="loteToEditId"
    />

    <LoteProtocoloDetailModal v-model="detailModalOpen" :lote-id="loteToViewId" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar ficha de lote y protocolo"
      subtitle="No se puede eliminar si alguna recarga ya la referencia."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar la ficha del lote
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ loteToDelete?.numero_lote }}
        </span>
        ?
      </p>
      <p
        v-if="Number(loteToDelete?.total_balones_vigentes ?? 0) > 0"
        class="mt-3 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2.5 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"
      >
        {{ loteToDelete?.total_balones_vigentes }} cilindro(s) tienen esta ficha como vigente;
        quedarán sin ficha vigente.
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="deleteMutation.isPending.value"
          @click="deleteModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="deleteMutation.isPending.value"
          @click="confirmDelete"
        >
          {{ deleteMutation.isPending.value ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import LoteProtocoloDetailModal from '@/modules/balones/lotes-protocolo/components/LoteProtocoloDetailModal.vue'
import LoteProtocoloFormModal from '@/modules/balones/lotes-protocolo/components/LoteProtocoloFormModal.vue'
import { fechaAMesAnio } from '@/modules/balones/lotes-protocolo/constants/icpFicha'
import { useDeleteLoteProtocoloMutation } from '@/modules/balones/lotes-protocolo/composables/useLoteProtocoloMutations'
import { useLotesProtocoloQuery } from '@/modules/balones/lotes-protocolo/composables/useLotesProtocoloQuery'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import type {
  LoteProtocolo,
  LoteProtocoloFormMode,
  LoteProtocoloListFilters,
} from '@/modules/balones/lotes-protocolo/interfaces/lote-protocolo.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppBadge,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppSelect,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)
const vencidosFiltro = ref<'' | 'vigentes' | 'vencidos'>('')

const vencidosOptions = [
  { label: 'Todas', value: '' },
  { label: 'Vigentes', value: 'vigentes' },
  { label: 'Vencidas', value: 'vencidos' },
]

const filters = ref<LoteProtocoloListFilters>({ buscar: '', pagina: 1, limite: 10 })

const lotesQuery = useLotesProtocoloQuery(filters)
const deleteMutation = useDeleteLoteProtocoloMutation()

const formModalOpen = ref(false)
const formMode = ref<LoteProtocoloFormMode>('create')
const loteToEditId = ref<number | null>(null)

const detailModalOpen = ref(false)
const loteToViewId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const loteToDelete = ref<LoteProtocolo | null>(null)

const breadcrumbItems = computed(() => balonesBreadcrumbItems('Lote y protocolo'))

const canCreate = computed(() =>
  authStore.hasPermission(PermisoBanderas.LOTES_PROTOCOLO_CREAR),
)
const canView = computed(() => authStore.hasPermission(PermisoBanderas.LOTES_PROTOCOLO_VER))
const canEdit = computed(() =>
  authStore.hasPermission(PermisoBanderas.LOTES_PROTOCOLO_EDITAR),
)
const canDelete = computed(() =>
  authStore.hasPermission(PermisoBanderas.LOTES_PROTOCOLO_ELIMINAR),
)

const isLoading = computed(() => lotesQuery.isFetching.value)
const rows = computed(() => lotesQuery.data.value?.data ?? [])

const columns = computed<TableColumn<LoteProtocolo>[]>(() => [
  { key: 'numero_lote', label: 'Lote' },
  { key: 'nombre_proveedor', label: 'Proveedor / planta' },
  { key: 'nombre_producto_gas', label: 'Gas' },
  { key: 'fecha_emision', label: 'Emisión' },
  { key: 'fecha_vencimiento', label: 'Vence' },
  { key: 'valoracion_o2_pct', label: 'Valoración O₂' },
  { key: 'total_envases', label: 'Envases' },
  { key: 'total_balones_vigentes', label: 'Vigente en' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    vencidos:
      vencidosFiltro.value === '' ? undefined : vencidosFiltro.value === 'vencidos',
  }
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncFilters()
  }, 350)
})

watch(vencidosFiltro, () => {
  pagina.value = 1
  syncFilters()
})

watch([pagina, limite], () => {
  syncFilters()
})

const openCreateModal = () => {
  formMode.value = 'create'
  loteToEditId.value = null
  formModalOpen.value = true
}

const openEditModal = (lote: LoteProtocolo) => {
  formMode.value = 'edit'
  loteToEditId.value = lote.id
  formModalOpen.value = true
}

const openDetailModal = (lote: LoteProtocolo) => {
  loteToViewId.value = lote.id
  detailModalOpen.value = true
}

const openDeleteModal = (lote: LoteProtocolo) => {
  loteToDelete.value = lote
  deleteModalOpen.value = true
}

function actionItemsForRow(_row: LoteProtocolo): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value

  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !canEdit.value,
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: ICONS.trash,
      danger: true,
      disabled: busy,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: LoteProtocolo) {
  if (key === 'edit') openEditModal(row)
  if (key === 'delete') openDeleteModal(row)
}

const confirmDelete = async () => {
  const currentUserId = authStore.user?.id
  if (!loteToDelete.value || !currentUserId) return

  try {
    await deleteMutation.mutateAsync({
      id: loteToDelete.value.id,
      idUsuarioAuditoria: currentUserId,
    })
    deleteModalOpen.value = false
    loteToDelete.value = null
  } catch {
    // toast en mutation
  }
}
</script>

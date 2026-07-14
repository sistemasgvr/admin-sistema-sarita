<template>
  <div>
    <PageBreadcrumb page-title="Préstamos" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Número o título..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <button
              v-if="canCreate"
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="openCreateModal"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nuevo
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-prestamo="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.numero_prestamo || '—' }}
        </p>
        <p v-if="row.titulo" class="text-xs text-gray-500 dark:text-gray-400">
          {{ row.titulo }}
        </p>
      </template>

      <template #cell-nombre_tipo_prestamo="{ value }">
        <ListaOpcionBadge :value="value as string" />
      </template>

      <template #cell-nombre_cliente="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-vigencia="{ row }">
        <DateRangeBadges
          :from="row.fecha_salida"
          :to="row.fecha_retorno_pactada"
        />
      </template>

      <template #cell-nombre_estado="{ value }">
        <ListaOpcionBadge :value="value as string" />
      </template>

      <template #cell-total_detalles="{ value }">
        <span class="inline-flex min-w-8 items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300">
          {{ value ?? 0 }}
        </span>
      </template>

      <template #actions="{ row }">
        <button
          v-if="canView"
          type="button"
          title="Ver"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetailModal(row)"
        >
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>

        <button
          v-if="canEdit"
          type="button"
          title="Editar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click="openEditModal(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
        </button>

        <button
          v-if="canDelete"
          type="button"
          title="Eliminar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openDeleteModal(row)"
        >
          <AppIcon :name="ICONS.trash" :size="16" />
        </button>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="prestamosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <PrestamoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :prestamo-id="selectedPrestamoId"
      @saved="onPrestamoSaved"
    />

    <PrestamoDetailModal v-model="detailModalOpen" :prestamo-id="prestamoToViewId" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar préstamo"
      subtitle="Esta acción dará de baja el préstamo y sus referencias."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el préstamo
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ prestamoToDelete?.numero_prestamo || prestamoToDelete?.titulo || `#${prestamoToDelete?.id}` }}
        </span>
        ?
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
import PrestamoFormModal from '@/modules/balones/prestamos/components/PrestamoFormModal.vue'
import PrestamoDetailModal from '@/modules/balones/prestamos/components/PrestamoDetailModal.vue'
import DateRangeBadges from '@/modules/balones/components/DateRangeBadges.vue'
import { useDeletePrestamoMutation } from '@/modules/balones/prestamos/composables/usePrestamoMutations'
import { usePrestamosQuery } from '@/modules/balones/prestamos/composables/usePrestamosQuery'
import type {
  Prestamo,
  PrestamoFormMode,
  PrestamoListFilters,
} from '@/modules/balones/prestamos/interfaces/prestamo.interface'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppListToolbar, AppModal, AppPagination, AppTable, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filters = ref<PrestamoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const prestamosQuery = usePrestamosQuery(filters)

const listaTipoPrestamoId = ref(ListaIds.TIPO_PRESTAMO)
const listaEstadoPrestamoId = ref(ListaIds.ESTADO_PRESTAMO)
const tiposPrestamoQuery = useListaOpcionesQuery(listaTipoPrestamoId)
const estadosPrestamoQuery = useListaOpcionesQuery(listaEstadoPrestamoId)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const formModalOpen = ref(false)
const formMode = ref<PrestamoFormMode>('create')
const selectedPrestamoId = ref<number | null>(null)

const detailModalOpen = ref(false)
const prestamoToViewId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const prestamoToDelete = ref<Prestamo | null>(null)
const deleteMutation = useDeletePrestamoMutation()

const breadcrumbItems = balonesBreadcrumbItems('Préstamos')

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_ELIMINAR))

const isLoading = computed(
  () => prestamosQuery.isFetching.value || prestamosQuery.isLoading.value,
)

const rows = computed(() => prestamosQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'prestamo', label: 'Préstamo' },
  { key: 'nombre_tipo_prestamo', label: 'Tipo' },
  { key: 'nombre_cliente', label: 'Cliente' },
  { key: 'vigencia', label: 'Salida / Retorno' },
  { key: 'nombre_estado', label: 'Estado' },
  { key: 'total_detalles', label: 'Cilindros' },
]

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idTipoPrestamo',
    label: 'Tipo',
    type: 'select',
    placeholder: 'Seleccionar tipo',
    disabled: tiposPrestamoQuery.isFetching.value,
    options: toSelectOptions(tiposPrestamoQuery.data.value),
  },
  {
    key: 'idCliente',
    label: 'Cliente',
    type: 'select',
    placeholder: 'Seleccionar cliente',
    disabled: clientesQuery.isLoading.value,
    options: (clientesQuery.data.value?.data ?? []).map((cliente) => ({
      value: cliente.id,
      label:
        cliente.razon_social ||
        [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
        cliente.numero_documento,
    })),
  },
  {
    key: 'idEstado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    disabled: estadosPrestamoQuery.isFetching.value,
    options: toSelectOptions(estadosPrestamoQuery.data.value),
  },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idTipoPrestamo: active.idTipoPrestamo != null ? Number(active.idTipoPrestamo) : undefined,
    idCliente: active.idCliente != null ? Number(active.idCliente) : undefined,
    idEstado: active.idEstado != null ? Number(active.idEstado) : undefined,
  }
}

const onFiltersChange = () => {
  pagina.value = 1
  syncFilters()
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

const openCreateModal = () => {
  formMode.value = 'create'
  selectedPrestamoId.value = null
  formModalOpen.value = true
}

const openEditModal = (row: Prestamo) => {
  formMode.value = 'edit'
  selectedPrestamoId.value = row.id
  formModalOpen.value = true
}

const openDetailModal = (row: Prestamo) => {
  prestamoToViewId.value = row.id
  detailModalOpen.value = true
}

const openDeleteModal = (row: Prestamo) => {
  prestamoToDelete.value = row
  deleteModalOpen.value = true
}

const onPrestamoSaved = () => {
  prestamosQuery.refetch()
}

const confirmDelete = async () => {
  const prestamo = prestamoToDelete.value
  const userId = authStore.user?.id
  if (!prestamo || !userId) return

  try {
    await deleteMutation.mutateAsync({
      id: prestamo.id,
      idUsuarioAuditoria: userId,
    })
    deleteModalOpen.value = false
    prestamoToDelete.value = null
  } catch {
    // toast en mutation
  }
}
</script>

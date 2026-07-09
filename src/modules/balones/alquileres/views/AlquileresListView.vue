<template>
  <div>
    <PageBreadcrumb page-title="Alquileres" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Número o observación..."
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

      <template #cell-numero_alquiler="{ value }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ value }}</p>
      </template>

      <template #cell-nombre_cliente="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-nombre_almacen="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-vigencia="{ row }">
        <DateRangeBadges :from="row.fecha_inicio" :to="row.fecha_fin_pactada" />
      </template>

      <template #cell-tarifa_diaria="{ value }">
        <span v-if="value != null">{{ formatMoney(value as number) }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-nombre_estado="{ value }">
        <span v-if="value">{{ formatListaOpcionLabel(value) }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-total_detalles="{ value }">
        <span
          class="inline-flex min-w-8 items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300"
        >
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
          :meta="alquileresQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <AlquilerFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :alquiler-id="selectedAlquilerId"
      @saved="onAlquilerSaved"
    />

    <AlquilerDetailModal v-model="detailModalOpen" :alquiler-id="alquilerToViewId" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar alquiler"
      subtitle="Esta acción dará de baja el alquiler y sus referencias."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el alquiler
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ alquilerToDelete?.numero_alquiler }}
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
import AlquilerFormModal from '@/modules/balones/alquileres/components/AlquilerFormModal.vue'
import AlquilerDetailModal from '@/modules/balones/alquileres/components/AlquilerDetailModal.vue'
import DateRangeBadges from '@/modules/balones/components/DateRangeBadges.vue'
import { useDeleteAlquilerMutation } from '@/modules/balones/alquileres/composables/useAlquilerMutations'
import { useAlquileresQuery } from '@/modules/balones/alquileres/composables/useAlquileresQuery'
import type {
  Alquiler,
  AlquilerFormMode,
  AlquilerListFilters,
} from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppListToolbar, AppModal, AppPagination, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const authStore = useAuthStore()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filters = ref<AlquilerListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const alquileresQuery = useAlquileresQuery(filters)

const listaEstadoAlquilerId = ref(ListaIds.ESTADO_ALQUILER)
const estadosAlquilerQuery = useListaOpcionesQuery(listaEstadoAlquilerId)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const formModalOpen = ref(false)
const formMode = ref<AlquilerFormMode>('create')
const selectedAlquilerId = ref<number | null>(null)

const detailModalOpen = ref(false)
const alquilerToViewId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const alquilerToDelete = ref<Alquiler | null>(null)
const deleteMutation = useDeleteAlquilerMutation()

const breadcrumbItems = balonesBreadcrumbItems('Alquileres')

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_ELIMINAR))

const isLoading = computed(
  () => alquileresQuery.isFetching.value || alquileresQuery.isLoading.value,
)

const rows = computed(() => alquileresQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'numero_alquiler', label: 'Número' },
  { key: 'nombre_cliente', label: 'Cliente' },
  { key: 'nombre_almacen', label: 'Almacén' },
  { key: 'vigencia', label: 'Inicio / Fin' },
  { key: 'tarifa_diaria', label: 'Tarifa/día' },
  { key: 'nombre_estado', label: 'Estado' },
  { key: 'total_detalles', label: 'Cilindros' },
]

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
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
    key: 'idAlmacen',
    label: 'Almacén',
    type: 'select',
    placeholder: 'Seleccionar almacén',
    disabled: almacenesQuery.isLoading.value,
    options: (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
      value: almacen.id,
      label: almacen.nombre,
    })),
  },
  {
    key: 'idEstado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    disabled: estadosAlquilerQuery.isFetching.value,
    options: toSelectOptions(estadosAlquilerQuery.data.value),
  },
])

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idCliente: active.idCliente != null ? Number(active.idCliente) : undefined,
    idAlmacen: active.idAlmacen != null ? Number(active.idAlmacen) : undefined,
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
  selectedAlquilerId.value = null
  formModalOpen.value = true
}

const openEditModal = (row: Alquiler) => {
  formMode.value = 'edit'
  selectedAlquilerId.value = row.id
  formModalOpen.value = true
}

const openDetailModal = (row: Alquiler) => {
  alquilerToViewId.value = row.id
  detailModalOpen.value = true
}

const openDeleteModal = (row: Alquiler) => {
  alquilerToDelete.value = row
  deleteModalOpen.value = true
}

const onAlquilerSaved = () => {
  alquileresQuery.refetch()
}

const confirmDelete = async () => {
  const alquiler = alquilerToDelete.value
  const userId = authStore.user?.id
  if (!alquiler || !userId) return

  try {
    await deleteMutation.mutateAsync({
      id: alquiler.id,
      idUsuarioAuditoria: userId,
    })
    deleteModalOpen.value = false
    alquilerToDelete.value = null
  } catch {
    // toast en mutation
  }
}
</script>

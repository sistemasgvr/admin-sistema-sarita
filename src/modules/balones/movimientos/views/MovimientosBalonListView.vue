<template>
  <div>
    <PageBreadcrumb page-title="Movimientos" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <div class="flex flex-col gap-4">
          <div v-if="canCreate" class="flex justify-end">
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="openCreateModal"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nuevo movimiento
            </button>
          </div>

          <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div class="sm:col-span-2 lg:col-span-1">
              <AppInput
                v-model="buscar"
                label="Buscar"
                type="search"
                placeholder="Código, tipo, observación..."
              />
            </div>

            <AppInput v-model="fechaDesde" label="Desde" type="date" />

            <AppInput v-model="fechaHasta" label="Hasta" type="date" />

            <AppSelect
              v-model="idBalonFiltro"
              label="Cilindro"
              placeholder="Todos"
              :options="balonFilterOptions"
              :disabled="balonesQuery.isLoading.value"
            />

            <AppSelect
              v-model="idTipoMovimientoFiltro"
              label="Tipo"
              placeholder="Todos"
              :options="tipoMovimientoFilterOptions"
              :disabled="tiposMovimientoQuery.isFetching.value"
            />

            <AppSelect
              v-model="idClienteFiltro"
              label="Cliente"
              placeholder="Todos"
              :options="clienteFilterOptions"
              :disabled="clientesQuery.isLoading.value"
            />
          </div>
        </div>
      </template>

      <template #cell-fecha_movimiento="{ value }">
        <span class="whitespace-nowrap">{{ formatDateTime(value as string) }}</span>
      </template>

      <template #cell-codigo_balon="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.codigo_balon }}
        </p>
      </template>

      <template #cell-nombre_tipo_movimiento="{ value }">
        <AppBadge v-if="value" size="sm" color="primary">{{ value }}</AppBadge>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-almacenes="{ row }">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          <template v-if="row.nombre_almacen_origen || row.nombre_almacen_destino">
            {{ row.nombre_almacen_origen || '—' }}
            <span class="text-gray-400">/</span>
            {{ row.nombre_almacen_destino || '—' }}
          </template>
          <span v-else class="text-gray-400">—</span>
        </span>
      </template>

      <template #cell-nombre_cliente="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <!--
      <template #cell-observacion="{ value }">
        <span class="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
          {{ value || '—' }}
        </span>
      </template>
      -->

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
          <!-- Editar -->
        </button>

        <button
          v-if="canDelete"
          type="button"
          title="Eliminar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openDeleteModal(row)"
        >
          <AppIcon :name="ICONS.trash" :size="16" />
          <!-- Eliminar -->
        </button>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="movimientosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <MovimientoBalonFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :movimiento-id="selectedMovimientoId"
      @saved="onMovimientoSaved"
    />

    <MovimientoBalonDetailModal
      v-model="detailModalOpen"
      :movimiento-id="movimientoToViewId"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar movimiento"
      subtitle="Esta acción dará de baja el registro del movimiento."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el movimiento del cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ movimientoToDelete?.codigo_balon }}
        </span>
        del
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ formatDateTime(movimientoToDelete?.fecha_movimiento) }}
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
import MovimientoBalonFormModal from '@/modules/balones/movimientos/components/MovimientoBalonFormModal.vue'
import MovimientoBalonDetailModal from '@/modules/balones/movimientos/components/MovimientoBalonDetailModal.vue'
import { useDeleteMovimientoBalonMutation } from '@/modules/balones/movimientos/composables/useMovimientoBalonMutations'
import { useMovimientosBalonQuery } from '@/modules/balones/movimientos/composables/useMovimientosBalonQuery'
import type {
  MovimientoBalon,
  MovimientoBalonFormMode,
  MovimientoBalonListFilters,
} from '@/modules/balones/movimientos/interfaces/movimiento-balon.interface'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppBadge,
  AppInput,
  AppModal,
  AppPagination,
  AppSelect,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { formatDateTime } from '@/shared/utils/date'

const authStore = useAuthStore()

const buscar = ref('')
const fechaDesde = ref('')
const fechaHasta = ref('')
const idBalonFiltro = ref<number | ''>('')
const idTipoMovimientoFiltro = ref<number | ''>('')
const idClienteFiltro = ref<number | ''>('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<MovimientoBalonListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const movimientosQuery = useMovimientosBalonQuery(filters)

const balonesFilters = ref({ pagina: 1, limite: 200 })
const balonesQuery = useBalonesQuery(balonesFilters)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const listaTipoMovId = ref(ListaIds.TIPO_MOV_BALON)
const tiposMovimientoQuery = useListaOpcionesQuery(listaTipoMovId)

const formModalOpen = ref(false)
const formMode = ref<MovimientoBalonFormMode>('create')
const selectedMovimientoId = ref<number | null>(null)

const detailModalOpen = ref(false)
const movimientoToViewId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const movimientoToDelete = ref<MovimientoBalon | null>(null)
const deleteMutation = useDeleteMovimientoBalonMutation()

const breadcrumbItems = balonesBreadcrumbItems('Movimientos')

const canCreate = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_BALON_CREAR),
)
const canView = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_BALON_VER),
)
const canEdit = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_BALON_EDITAR),
)
const canDelete = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_BALON_ELIMINAR),
)

const isLoading = computed(
  () => movimientosQuery.isFetching.value || movimientosQuery.isLoading.value,
)

const rows = computed(() => movimientosQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'fecha_movimiento', label: 'Fecha' },
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'nombre_tipo_movimiento', label: 'Tipo' },
  { key: 'almacenes', label: 'Origen / Destino' },
  { key: 'nombre_cliente', label: 'Cliente' },
  // { key: 'observacion', label: 'Observación' },
]

const allOption = (): SelectOption => ({ value: '', label: 'Todos' })

const balonFilterOptions = computed(() => [
  allOption(),
  ...(balonesQuery.data.value?.data ?? []).map((balon) => ({
    value: balon.id,
    label: balon.codigo_balon,
  })),
])

const tipoMovimientoFilterOptions = computed(() => [
  allOption(),
  ...toSelectOptions(tiposMovimientoQuery.data.value),
])

const clienteFilterOptions = computed(() => [
  allOption(),
  ...(clientesQuery.data.value?.data ?? []).map((cliente) => ({
    value: cliente.id,
    label:
      cliente.razon_social ||
      [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
      cliente.numero_documento,
  })),
])

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    fechaDesde: fechaDesde.value || undefined,
    fechaHasta: fechaHasta.value || undefined,
    idBalon: idBalonFiltro.value === '' ? undefined : Number(idBalonFiltro.value),
    idTipoMovimiento:
      idTipoMovimientoFiltro.value === '' ? undefined : Number(idTipoMovimientoFiltro.value),
    idCliente: idClienteFiltro.value === '' ? undefined : Number(idClienteFiltro.value),
  }
}

watch([buscar, fechaDesde, fechaHasta, idBalonFiltro, idTipoMovimientoFiltro, idClienteFiltro], () => {
  pagina.value = 1
  syncFilters()
})

watch([pagina, limite], () => {
  syncFilters()
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedMovimientoId.value = null
  formModalOpen.value = true
}

const openEditModal = (row: MovimientoBalon) => {
  formMode.value = 'edit'
  selectedMovimientoId.value = row.id
  formModalOpen.value = true
}

const openDetailModal = (row: MovimientoBalon) => {
  movimientoToViewId.value = row.id
  detailModalOpen.value = true
}

const openDeleteModal = (row: MovimientoBalon) => {
  movimientoToDelete.value = row
  deleteModalOpen.value = true
}

const onMovimientoSaved = () => {
  movimientosQuery.refetch()
}

const confirmDelete = async () => {
  const movimiento = movimientoToDelete.value
  const userId = authStore.user?.id
  if (!movimiento || !userId) return

  try {
    await deleteMutation.mutateAsync({
      id: movimiento.id,
      idUsuarioAuditoria: userId,
    })
    deleteModalOpen.value = false
    movimientoToDelete.value = null
  } catch {
    // toast en mutation
  }
}
</script>

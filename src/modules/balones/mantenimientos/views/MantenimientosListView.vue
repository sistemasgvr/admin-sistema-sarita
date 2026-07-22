<template>
  <div>
    <PageBreadcrumb page-title="Mantenimientos" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Cilindro o descripción..."
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

      <template #cell-codigo_balon="{ value }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ value }}</p>
      </template>

      <template #cell-nombre_tipo_mantenimiento="{ value }">
        <ListaOpcionBadge :value="value as string" />
      </template>

      <template #cell-vigencia="{ row }">
        <DateRangeBadges :from="row.fecha_ingreso" :to="row.fecha_salida" />
      </template>

      <template #cell-costo="{ value }">
        <span v-if="value != null">{{ formatMoney(value as number) }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-es_externo="{ value }">
        <span
          class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
          :class="
            value
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
              : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
          "
        >
          {{ value ? 'Externo' : 'Interno' }}
        </span>
      </template>

      <template #cell-nombre_estado="{ value }">
        <ListaOpcionBadge :value="value as string" />
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            v-if="canView"
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
          :meta="mantenimientosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <MantenimientoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :mantenimiento-id="selectedMantenimientoId"
      @saved="onMantenimientoSaved"
    />

    <MantenimientoDetailModal
      v-model="detailModalOpen"
      :mantenimiento-id="mantenimientoToViewId"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar mantenimiento"
      subtitle="Esta acción dará de baja el registro de mantenimiento."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el mantenimiento del cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ mantenimientoToDelete?.codigo_balon }}
        </span>
        con ingreso el
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ formatListDate(mantenimientoToDelete?.fecha_ingreso) }}
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
import MantenimientoFormModal from '@/modules/balones/mantenimientos/components/MantenimientoFormModal.vue'
import MantenimientoDetailModal from '@/modules/balones/mantenimientos/components/MantenimientoDetailModal.vue'
import DateRangeBadges from '@/modules/balones/components/DateRangeBadges.vue'
import { useDeleteMantenimientoMutation } from '@/modules/balones/mantenimientos/composables/useMantenimientoMutations'
import { useMantenimientosQuery } from '@/modules/balones/mantenimientos/composables/useMantenimientosQuery'
import type {
  Mantenimiento,
  MantenimientoFormMode,
  MantenimientoListFilters,
} from '@/modules/balones/mantenimientos/interfaces/mantenimiento.interface'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
  ListaOpcionBadge,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatListDate } from '@/shared/utils/date'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filters = ref<MantenimientoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const mantenimientosQuery = useMantenimientosQuery(filters)

const balonesFilters = ref({ pagina: 1, limite: 200 })
const balonesQuery = useBalonesQuery(balonesFilters)

const listaTipoMantenimientoId = ref(ListaIds.TIPO_MANTENIMIENTO)
const listaEstadoMantenimientoId = ref(ListaIds.ESTADO_MANTENIMIENTO)
const tiposMantenimientoQuery = useListaOpcionesQuery(listaTipoMantenimientoId)
const estadosMantenimientoQuery = useListaOpcionesQuery(listaEstadoMantenimientoId)

const formModalOpen = ref(false)
const formMode = ref<MantenimientoFormMode>('create')
const selectedMantenimientoId = ref<number | null>(null)

const detailModalOpen = ref(false)
const mantenimientoToViewId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const mantenimientoToDelete = ref<Mantenimiento | null>(null)
const deleteMutation = useDeleteMantenimientoMutation()

const breadcrumbItems = balonesBreadcrumbItems('Mantenimientos')

const canCreate = computed(() =>
  authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_CREAR),
)
const canView = computed(() =>
  authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_VER),
)
const canEdit = computed(() =>
  authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_EDITAR),
)
const canDelete = computed(() =>
  authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_ELIMINAR),
)

const isLoading = computed(
  () => mantenimientosQuery.isFetching.value || mantenimientosQuery.isLoading.value,
)

const rows = computed(() => mantenimientosQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'nombre_tipo_mantenimiento', label: 'Tipo' },
  { key: 'vigencia', label: 'Ingreso / Salida' },
  { key: 'costo', label: 'Costo' },
  { key: 'es_externo', label: 'Origen' },
  { key: 'nombre_estado', label: 'Estado' },
]

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idBalon',
    label: 'Cilindro',
    type: 'select',
    placeholder: 'Seleccionar cilindro',
    disabled: balonesQuery.isLoading.value,
    options: (balonesQuery.data.value?.data ?? []).map((balon) => ({
      value: balon.id,
      label: balon.codigo_balon,
    })),
  },
  {
    key: 'idTipoMantenimiento',
    label: 'Tipo',
    type: 'select',
    placeholder: 'Seleccionar tipo',
    disabled: tiposMantenimientoQuery.isFetching.value,
    options: toSelectOptions(tiposMantenimientoQuery.data.value),
  },
  {
    key: 'idEstado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    disabled: estadosMantenimientoQuery.isFetching.value,
    options: toSelectOptions(estadosMantenimientoQuery.data.value),
  },
  {
    key: 'esExterno',
    label: 'Externo',
    type: 'select',
    placeholder: 'Seleccionar origen',
    options: [
      { value: 'true', label: 'Externo' },
      { value: 'false', label: 'Interno' },
    ],
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
    idBalon: active.idBalon != null ? Number(active.idBalon) : undefined,
    idTipoMantenimiento:
      active.idTipoMantenimiento != null ? Number(active.idTipoMantenimiento) : undefined,
    idEstado: active.idEstado != null ? Number(active.idEstado) : undefined,
    esExterno:
      active.esExterno === 'true' ? true : active.esExterno === 'false' ? false : undefined,
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
  selectedMantenimientoId.value = null
  formModalOpen.value = true
}

const openEditModal = (row: Mantenimiento) => {
  formMode.value = 'edit'
  selectedMantenimientoId.value = row.id
  formModalOpen.value = true
}

const openDetailModal = (row: Mantenimiento) => {
  mantenimientoToViewId.value = row.id
  detailModalOpen.value = true
}

const openDeleteModal = (row: Mantenimiento) => {
  mantenimientoToDelete.value = row
  deleteModalOpen.value = true
}

function deleteLabelForRow(row: Mantenimiento): string {
  if (row.puede_eliminar !== false) return 'Eliminar'
  if (row.id_comprobante_venta != null || row.id_comprobante_compra != null) {
    return 'Eliminar (tiene comprobante)'
  }
  return 'Eliminar (tiene P.H.)'
}

function actionItemsForRow(row: Mantenimiento): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value
  const blockedDelete = row.puede_eliminar === false

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
      label: deleteLabelForRow(row),
      icon: ICONS.trash,
      danger: !blockedDelete,
      disabled: busy || blockedDelete,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: Mantenimiento) {
  if (key === 'edit') openEditModal(row)
  if (key === 'delete') openDeleteModal(row)
}

const onMantenimientoSaved = () => {
  mantenimientosQuery.refetch()
}

const confirmDelete = async () => {
  const mantenimiento = mantenimientoToDelete.value
  const userId = authStore.user?.id
  if (!mantenimiento || !userId) return

  try {
    await deleteMutation.mutateAsync({
      id: mantenimiento.id,
      idUsuarioAuditoria: userId,
    })
    deleteModalOpen.value = false
    mantenimientoToDelete.value = null
  } catch {
    // toast en mutation
  }
}
</script>

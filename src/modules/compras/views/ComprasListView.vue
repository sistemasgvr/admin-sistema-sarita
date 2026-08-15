<template>
  <div>
    <PageBreadcrumb page-title="Compras" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Serie, número, glosa o proveedor..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <AppExportExcelButton :on-export="exportarExcel" />
            <button
              v-if="canCreate"
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="openCreate"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nueva compra
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-comprobante="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.serie ?? '—' }}-{{ row.numero ?? '—' }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ row.fecha }}</p>
      </template>

      <template #cell-proveedor="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.nombre_proveedor ?? row.proveedor ?? '—' }}
        </p>
      </template>

      <template #cell-total_importe="{ value }">
        <span class="tabular-nums">{{ formatMoney(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-estado="{ row }">
        <AppBadge :color="row.estado === 1 ? 'success' : 'error'">
          {{ row.estado === 1 ? 'Activo' : 'Anulado' }}
        </AppBadge>
      </template>

      <template #cell-tiene_movimientos_inventario="{ value }">
        <AppBadge v-if="value" color="warning">Con mov.</AppBadge>
        <span v-else class="text-xs text-gray-400">—</span>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            v-if="canView"
            type="button"
            title="Ver detalle"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openDetail(row)"
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
          :meta="comprasQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <AppModal v-model="anularModalOpen" title="Anular comprobante de compra" size="sm">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas anular
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ compraToAnular?.serie ?? '—' }}-{{ compraToAnular?.numero ?? '—' }}
        </span>
        ?
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Se revertirán los movimientos de inventario. Esta acción no se puede deshacer.
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
          :disabled="anularMutation.isPending.value"
          @click="anularModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="anularMutation.isPending.value"
          @click="confirmAnular"
        >
          {{ anularMutation.isPending.value ? 'Anulando...' : 'Anular compra' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useComprasQuery } from '@/modules/compras/composables/useComprasQuery'
import { useAnularCompraMutation } from '@/modules/compras/composables/useCompraMutations'
import type { CompraListFilters, CompraListItem } from '@/modules/compras/interfaces/compra.interface'
import { comprasBreadcrumbItems } from '@/modules/compras/config/compras-breadcrumb'
import { exportarComprasExcel } from '@/modules/compras/utils/exportarComprasExcel'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import {
  AppActionMenu,
  AppBadge,
  AppExportExcelButton,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'

const breadcrumbItems = comprasBreadcrumbItems('Compras')

const router = useRouter()
const authStore = useAuthStore()

const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<CompraListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const comprasQuery = useComprasQuery(filters)
const anularMutation = useAnularCompraMutation()

const exportarExcel = () => exportarComprasExcel(filters.value)

const anularModalOpen = ref(false)
const compraToAnular = ref<CompraListItem | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.COMPRAS_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.COMPRAS_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.COMPRAS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.COMPRAS_ELIMINAR))

const isLoading = computed(() => comprasQuery.isFetching.value)
const rows = computed(() => comprasQuery.data.value?.data ?? [])

// Catálogos para filtros
const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)
const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'fechaDesde',
    label: 'Desde',
    type: 'date',
  },
  {
    key: 'fechaHasta',
    label: 'Hasta',
    type: 'date',
  },
  {
    key: 'idProveedor',
    label: 'Proveedor',
    type: 'select',
    placeholder: 'Seleccionar',
    disabled: clientesQuery.isLoading.value,
    options: (clientesQuery.data.value?.data ?? []).map((c) => ({
      value: c.id,
      label: getClienteOptionLabel(c),
    })),
  },
  {
    key: 'idAlmacen',
    label: 'Almacén',
    type: 'select',
    placeholder: 'Seleccionar',
    disabled: almacenesQuery.isLoading.value,
    options: (almacenesQuery.data.value?.data ?? []).map((a) => ({
      value: a.id,
      label: a.nombre,
    })),
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar',
    options: [
      { value: 1, label: 'Activo' },
      { value: 0, label: 'Anulado' },
    ],
  },
])

const columns: TableColumn[] = [
  { key: 'comprobante', label: 'Comprobante', mobile: 'primary' },
  { key: 'proveedor', label: 'Proveedor' },
  { key: 'total_importe', label: 'Total', align: 'right' },
  { key: 'estado', label: 'Estado' },
  { key: 'tiene_movimientos_inventario', label: 'Inventario' },
]

function syncFilters() {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
    idProveedor: active.idProveedor != null ? Number(active.idProveedor) : undefined,
    idAlmacen: active.idAlmacen != null ? Number(active.idAlmacen) : undefined,
    estado: active.estado != null ? Number(active.estado) : undefined,
  }
}

function onFiltersChange() {
  pagina.value = 1
  syncFilters()
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined
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

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function openDetail(row: CompraListItem) {
  void router.push({
    name: 'admin-compras-detalle',
    params: { id: String(row.id) },
  })
}

function openCreate() {
  void router.push({ name: 'admin-compras-nuevo' })
}

function openEdit(row: CompraListItem) {
  void router.push({
    name: 'admin-compras-editar',
    params: { id: String(row.id) },
  })
}

function openCorreccion(row: CompraListItem) {
  void router.push({
    name: 'admin-compras-nuevo',
    query: { referencia: String(row.id) },
  })
}

function openAnular(row: CompraListItem) {
  compraToAnular.value = row
  anularModalOpen.value = true
}

function actionItemsForRow(row: CompraListItem): ActionMenuItem[] {
  const items: ActionMenuItem[] = []

  if (canEdit.value && row.estado === 1) {
    items.push({
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
    })
  }

  if (canDelete.value && row.estado === 1) {
    items.push({
      key: 'anular',
      label: 'Anular',
      icon: ICONS.ban,
      danger: true,
    })
  }

  if (canCreate.value && row.estado === 0) {
    items.push({
      key: 'correccion',
      label: 'Crear corrección',
      icon: ICONS.refreshCw,
    })
  }

  return items
}

function onActionSelect(key: string, row: CompraListItem) {
  switch (key) {
    case 'edit':
      return openEdit(row)
    case 'anular':
      return openAnular(row)
    case 'correccion':
      return openCorreccion(row)
  }
}

async function confirmAnular() {
  const row = compraToAnular.value
  const userId = authStore.user?.id
  if (!row || !userId) return

  await anularMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: userId })
  anularModalOpen.value = false
}
</script>

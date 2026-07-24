<template>
  <div>
    <PageBreadcrumb page-title="Compras" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Serie, número, proveedor o glosa..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
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
        <div class="mt-1">
          <ListaOpcionBadge :value="row.nombre_tipo_comprobante" />
        </div>
      </template>

      <template #cell-proveedor="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.razon_social_proveedor ?? '—' }}
        </p>
        <p v-if="row.doc_proveedor" class="text-xs text-gray-500 dark:text-gray-400">
          {{ row.doc_proveedor }}
        </p>
      </template>

      <template #cell-total_importe="{ value }">
        <span class="tabular-nums">{{ formatMoney(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-nombre_tipo_registro="{ value }">
        <ListaOpcionBadge :value="String(value ?? '')" raw />
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

    <CompraDetailModal v-model="detailModalOpen" :compra-id="compraToViewId" />

    <CompraFormModal v-model="formModalOpen" :compra="compraToEdit" @saved="syncFilters" />

    <AppModal v-model="deleteModalOpen" title="Eliminar comprobante de compra" size="sm">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ compraToDelete?.serie ?? '—' }}-{{ compraToDelete?.numero ?? '—' }}
        </span>
        ?
      </p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        El comprobante se dará de baja lógica.
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
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
import { useComprasQuery } from '@/modules/compras/composables/useComprasQuery'
import { useDeleteCompraMutation } from '@/modules/compras/composables/useCompraMutations'
import type { CompraListFilters, CompraListItem } from '@/modules/compras/interfaces/compra.interface'
import { comprasService } from '@/modules/compras/services/compras.service'
import CompraDetailModal from '@/modules/compras/components/CompraDetailModal.vue'
import CompraFormModal from '@/modules/compras/components/CompraFormModal.vue'
import { comprasBreadcrumbItems } from '@/modules/compras/config/compras-breadcrumb'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { AppActionMenu, AppListToolbar, AppModal, AppPagination, AppTable, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { ListaIds } from '@/shared/constants/lista-ids'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'

const breadcrumbItems = comprasBreadcrumbItems('Compras')

const authStore = useAuthStore()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filters = ref<CompraListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const comprasQuery = useComprasQuery(filters)
const deleteMutation = useDeleteCompraMutation()

const detailModalOpen = ref(false)
const compraToViewId = ref<number | null>(null)

const formModalOpen = ref(false)
const compraToEdit = ref<CompraListItem | null>(null)

const deleteModalOpen = ref(false)
const compraToDelete = ref<CompraListItem | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.COMPRAS_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.COMPRAS_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.COMPRAS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.COMPRAS_ELIMINAR))

const isLoading = computed(() => comprasQuery.isFetching.value)
const rows = computed(() => comprasQuery.data.value?.data ?? [])

// Catálogos para filtros
const tiposComprobanteQuery = useListaOpcionesQuery(computed(() => ListaIds.TIPO_COMPROBANTE))
const tiposRegistroQuery = useListaOpcionesQuery(computed(() => ListaIds.TIPO_REGISTRO))
const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

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
    key: 'idTipoComprobante',
    label: 'Tipo comprobante',
    type: 'select',
    placeholder: 'Seleccionar',
    options: toSelectOptions(tiposComprobanteQuery.data.value ?? []),
  },
  {
    key: 'idTipoRegistro',
    label: 'Tipo registro',
    type: 'select',
    placeholder: 'Seleccionar',
    options: toSelectOptions(tiposRegistroQuery.data.value ?? []),
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
])

const columns: TableColumn[] = [
  { key: 'comprobante', label: 'Comprobante', mobile: 'primary' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'proveedor', label: 'Proveedor' },
  { key: 'nombre_tipo_registro', label: 'Registro' },
  { key: 'total_importe', label: 'Total', align: 'right' },
]

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

function syncFilters() {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim() || undefined,
    pagina: pagina.value,
    limite: limite.value,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
    idTipoComprobante: active.idTipoComprobante != null ? Number(active.idTipoComprobante) : undefined,
    idTipoRegistro: active.idTipoRegistro != null ? Number(active.idTipoRegistro) : undefined,
    idProveedor: active.idProveedor != null ? Number(active.idProveedor) : undefined,
  }
}

function onFiltersChange() {
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

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function openDetail(row: CompraListItem) {
  compraToViewId.value = row.id
  detailModalOpen.value = true
}

function openCreate() {
  compraToEdit.value = null
  formModalOpen.value = true
}

function openEdit(row: CompraListItem) {
  compraToEdit.value = row
  formModalOpen.value = true
}

function openDelete(row: CompraListItem) {
  compraToDelete.value = row
  deleteModalOpen.value = true
}

function actionItemsForRow(row: CompraListItem): ActionMenuItem[] {
  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      hidden: !canEdit.value,
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: ICONS.trash,
      danger: true,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: CompraListItem) {
  switch (key) {
    case 'edit':
      return openEdit(row)
    case 'delete':
      return openDelete(row)
  }
}

async function confirmDelete() {
  const row = compraToDelete.value
  const userId = authStore.user?.id
  if (!row || !userId) return

  await deleteMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: userId })
  deleteModalOpen.value = false
}
</script>

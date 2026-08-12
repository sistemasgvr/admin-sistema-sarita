<template>
  <div>
    <PageBreadcrumb
      v-if="!embedded"
      page-title="Recargas planta externa"
      :items="breadcrumbItems"
    />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Orden, lote, GRE, factura o proveedor..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <AppExportExcelButton
              label="Protocolo Excel"
              title="Exportar protocolo (ida, guías, factura, retorno, lote)"
              :on-export="exportProtocolo"
            />
            <RouterLink
              v-if="canCreate"
              :to="{ name: 'admin-balones-recargas-planta-nueva' }"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nueva orden
            </RouterLink>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-numero="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.numero || `RP-${row.id}` }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ formatListDate(row.fecha_salida) }}
        </p>
      </template>

      <template #cell-nombre_estado="{ value }">
        <AppBadge v-if="value === 'BORRADOR'" color="neutral">Borrador</AppBadge>
        <AppBadge v-else-if="value === 'ENVIADO'" color="warning">Enviado</AppBadge>
        <AppBadge v-else-if="value === 'RETORNADO'" color="primary">Retornado</AppBadge>
        <AppBadge v-else-if="value === 'CERRADO'" color="success">Cerrado</AppBadge>
        <span v-else class="text-gray-400">{{ value || '—' }}</span>
      </template>

      <template #cell-nombre_proveedor="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-documentos="{ row }">
        <div class="space-y-0.5 text-sm text-gray-600 dark:text-gray-400">
          <p class="whitespace-nowrap">
            GRE sal.: {{ formatDocumento(row.serie_guia_salida, row.numero_guia_salida) }}
          </p>
          <p class="whitespace-nowrap">
            GRE ret.: {{ formatDocumento(row.serie_guia_ingreso, row.numero_guia_ingreso) }}
          </p>
          <p class="whitespace-nowrap">
            Fac.: {{ formatDocumento(row.serie_factura, row.numero_factura) }}
          </p>
        </div>
      </template>

      <template #cell-lote="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.lote || '—' }}
        </p>
        <p v-if="row.fecha_vencimiento_lote" class="text-xs text-gray-500 dark:text-gray-400">
          vence {{ formatListDate(row.fecha_vencimiento_lote) }}
        </p>
        <AppBadge
          v-else-if="row.fecha_llegada_almacen && !row.lote"
          size="sm"
          color="warning"
          class="mt-1"
        >
          Sin protocolo
        </AppBadge>
      </template>

      <template #cell-total_cilindros="{ value }">
        <span class="font-medium">{{ value ?? 0 }}</span>
      </template>

      <template #cell-nombre_almacen="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            v-if="canEdit"
            type="button"
            title="Editar / retorno"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="goToEdit(row)"
          >
            <AppIcon :name="ICONS.pencil" :size="15" />
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
          :meta="ordenesQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar orden"
      subtitle="Solo si aún no hay compra ni retorno registrado."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Eliminar la orden
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ ordenToDelete?.numero || `RP-${ordenToDelete?.id}` }}
        </span>
        ? Los cilindros en recarga externa volverán a almacén.
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
import { useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useDeleteRecargaPlantaMutation } from '@/modules/balones/recargas/composables/useRecargaPlantaMutations'
import { useRecargasPlantaQuery } from '@/modules/balones/recargas/composables/useRecargasPlantaQuery'
import type {
  RecargaPlanta,
  RecargaPlantaListFilters,
} from '@/modules/balones/recargas/interfaces/recarga-planta.interface'
import { recargasPlantaService } from '@/modules/balones/recargas/services/recargas-planta.service'
import { exportarProtocoloRecargaPlantaExcel } from '@/modules/balones/recargas/utils/exportarProtocoloRecargaPlantaExcel'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
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
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatListDate } from '@/shared/utils/date'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
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
const router = useRouter()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filters = ref<RecargaPlantaListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const ordenesQuery = useRecargasPlantaQuery(filters)

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const listaEstadoId = ref(ListaIds.ESTADO_RECARGA_PLANTA)
const estadoQuery = useListaOpcionesQuery(listaEstadoId)

const deleteModalOpen = ref(false)
const ordenToDelete = ref<RecargaPlanta | null>(null)
const deleteMutation = useDeleteRecargaPlantaMutation()

const breadcrumbItems = balonesBreadcrumbItems('Recargas planta externa')

const canCreate = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR),
)
const canEdit = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_EDITAR),
)
const canDelete = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_ELIMINAR),
)

const isLoading = computed(
  () => ordenesQuery.isFetching.value || ordenesQuery.isLoading.value,
)

const rows = computed(() => ordenesQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'numero', label: 'Orden' },
  { key: 'nombre_estado', label: 'Estado' },
  { key: 'nombre_proveedor', label: 'Proveedor' },
  { key: 'lote', label: 'Lote' },
  { key: 'total_cilindros', label: 'Cil.' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'nombre_almacen', label: 'Almacén' },
]

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  { key: 'fechaDesde', label: 'Desde', type: 'date' },
  { key: 'fechaHasta', label: 'Hasta', type: 'date' },
  {
    key: 'idEstado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Todos los estados',
    disabled: estadoQuery.isLoading.value,
    options: toSelectOptions(estadoQuery.data.value),
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
])

const formatDocumento = (serie?: string | null, numero?: string | null) => {
  if (!serie && !numero) return '—'
  if (serie && numero) return `${serie}-${numero}`
  return serie || numero || '—'
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  const active = dynamicFilters.value
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
    idEstado: active.idEstado != null ? Number(active.idEstado) : undefined,
    idAlmacen: active.idAlmacen != null ? Number(active.idAlmacen) : undefined,
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

const exportProtocolo = async () => {
  const protocoloRows = await recargasPlantaService.listarProtocolo({
    buscar: filters.value.buscar,
    idProveedor: filters.value.idProveedor,
    idAlmacen: filters.value.idAlmacen,
    idEstado: filters.value.idEstado,
    fechaDesde: filters.value.fechaDesde,
    fechaHasta: filters.value.fechaHasta,
  })
  await exportarProtocoloRecargaPlantaExcel(protocoloRows ?? [])
}

const goToEdit = (row: RecargaPlanta) => {
  void router.push({
    name: 'admin-balones-recargas-planta-editar',
    params: { id: row.id },
  })
}

const openDeleteModal = (row: RecargaPlanta) => {
  ordenToDelete.value = row
  deleteModalOpen.value = true
}

function actionItemsForRow(row: RecargaPlanta): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value
  const blocked =
    row.puede_eliminar === false ||
    row.nombre_estado === 'CERRADO' ||
    row.nombre_estado === 'RETORNADO' ||
    Boolean(row.id_comprobante_compra)
  const motivo =
    row.motivo_bloqueo_eliminar ||
    (row.id_comprobante_compra
      ? 'tiene compra'
      : row.nombre_estado === 'CERRADO' || row.nombre_estado === 'RETORNADO'
        ? 'estado no permite'
        : null)

  return [
    {
      key: 'edit',
      label: 'Editar / retorno',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !canEdit.value,
    },
    {
      key: 'delete',
      label: blocked && motivo ? `Eliminar (${motivo})` : 'Eliminar',
      icon: ICONS.trash,
      danger: !blocked,
      disabled: busy || blocked,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: RecargaPlanta) {
  if (key === 'edit') goToEdit(row)
  if (key === 'delete') {
    const blocked =
      row.puede_eliminar === false ||
      row.nombre_estado === 'CERRADO' ||
      row.nombre_estado === 'RETORNADO' ||
      Boolean(row.id_comprobante_compra)
    if (blocked) return
    openDeleteModal(row)
  }
}

const confirmDelete = async () => {
  const orden = ordenToDelete.value
  const userId = authStore.user?.id
  if (!orden || !userId) return

  try {
    await deleteMutation.mutateAsync({
      id: orden.id,
      idUsuarioAuditoria: userId,
    })
    deleteModalOpen.value = false
    ordenToDelete.value = null
  } catch {
    // toast en mutation
  }
}
</script>

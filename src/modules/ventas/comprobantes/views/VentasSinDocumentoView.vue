<template>
  <div>
    <PageBreadcrumb page-title="Ventas Sin Documento" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="VSD01-0000123, serie, número o cliente..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <RouterLink
              v-if="canCreate"
              :to="{ name: 'admin-ventas-pos' }"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nueva venta
            </RouterLink>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-comprobante="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.serie }}-{{ row.numero }}
        </p>
        <div class="mt-1">
          <ListaOpcionBadge
            :value="row.nombre_tipo_comprobante ?? row.codigo_tipo_comprobante"
          />
        </div>
      </template>

      <template #cell-destino="{ row }">
        <template v-if="row.serie_comprobante_destino">
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ row.serie_comprobante_destino }}-{{ row.numero_comprobante_destino }}
          </p>
          <div class="mt-1">
            <ListaOpcionBadge
              :value="row.nombre_tipo_comprobante_destino ?? row.codigo_tipo_comprobante_destino"
            />
          </div>
        </template>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-nombre_cliente="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-total_importe="{ value }">
        <span class="tabular-nums">{{ formatMoney(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-nombre_estado_sunat="{ value }">
        <ListaOpcionBadge :value="String(value ?? 'NO_APLICA')" raw />
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
          :meta="comprobantesQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
      Las notas de venta son documentos internos (no se emiten a SUNAT). Usa
      <strong class="font-medium text-gray-700 dark:text-gray-200">Nueva venta sin documento</strong>
      en el punto de venta.
    </p>

    <ComprobanteDetailModal v-model="detailModalOpen" :comprobante-id="comprobanteToViewId" />
    <ComprobanteEditModal v-model="editModalOpen" :comprobante="comprobanteToEdit" />
    <EmitirFacturaBoletaModal
      v-model="emitirModalOpen"
      :comprobante="comprobanteToEmitir"
      :codigo-tipo="emitirCodigoTipo"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar venta sin documento"
      subtitle="Documento interno; no afecta a SUNAT."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ comprobanteToDelete?.serie }}-{{ comprobanteToDelete?.numero }}
        </span>
        ?
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
import {
  useComprobanteCatalogosPosQuery,
  useComprobantesQuery,
} from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import { useDeleteComprobanteMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import ComprobanteDetailModal from '@/modules/ventas/comprobantes/components/ComprobanteDetailModal.vue'
import ComprobanteEditModal from '@/modules/ventas/comprobantes/components/ComprobanteEditModal.vue'
import EmitirFacturaBoletaModal from '@/modules/ventas/comprobantes/components/EmitirFacturaBoletaModal.vue'
import type { CodigoTipoComprobanteSunat } from '@/modules/ventas/comprobantes/utils/serieComprobante'
import { esVentaSinDocumentoTipo } from '@/modules/ventas/comprobantes/constants/tipoComprobante'
import { normalizarBusquedaComprobante } from '@/modules/ventas/comprobantes/utils/busquedaComprobante'
import type {
  ComprobanteListFilters,
  ComprobanteListItem,
} from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import {
  downloadBlob,
  openPdfPrintWindow,
  printBlobInWindow,
  type ComprobantePdfFormato,
} from '@/modules/ventas/comprobantes/utils/comprobantePdf'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { ventasBreadcrumbItems } from '@/modules/ventas/config/ventas-breadcrumb'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppActionMenu, AppListToolbar, AppModal, AppPagination, AppTable, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const breadcrumbItems = ventasBreadcrumbItems('Ventas sin documento')
const authStore = useAuthStore()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filters = ref<ComprobanteListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const comprobantesQuery = useComprobantesQuery(filters)
const catalogosQuery = useComprobanteCatalogosPosQuery()
const deleteMutation = useDeleteComprobanteMutation()

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const detailModalOpen = ref(false)
const comprobanteToViewId = ref<number | null>(null)
const editModalOpen = ref(false)
const comprobanteToEdit = ref<ComprobanteListItem | null>(null)
const deleteModalOpen = ref(false)
const comprobanteToDelete = ref<ComprobanteListItem | null>(null)
const pdfBusyId = ref<number | null>(null)
const emitirModalOpen = ref(false)
const comprobanteToEmitir = ref<ComprobanteListItem | null>(null)
const emitirCodigoTipo = ref<CodigoTipoComprobanteSunat>('03')

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_ELIMINAR))

const idTipoNotaVenta = computed(() => {
  const tipos = catalogosQuery.data.value?.tiposComprobante ?? []
  return (
    tipos.find((t) =>
      esVentaSinDocumentoTipo({
        codigo: t.descripcion,
        nombre: t.nombre,
      }),
    )?.id ?? null
  )
})

const isLoading = computed(
  () =>
    comprobantesQuery.isFetching.value ||
    (catalogosQuery.isLoading.value && idTipoNotaVenta.value == null),
)

const rows = computed(() => {
  if (idTipoNotaVenta.value == null) return []
  return comprobantesQuery.data.value?.data ?? []
})

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  { key: 'fechaDesde', label: 'Desde', type: 'date' },
  { key: 'fechaHasta', label: 'Hasta', type: 'date' },
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
    key: 'serie',
    label: 'Serie',
    type: 'text',
    placeholder: 'VSD01',
  },
])

const columns: TableColumn[] = [
  { key: 'comprobante', label: 'Venta sin Doc', mobile: 'primary' },
  { key: 'destino', label: 'Destino' },
  { key: 'nombre_cliente', label: 'Cliente' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'total_importe', label: 'Total', align: 'right' },
  { key: 'nombre_estado_sunat', label: 'Estado', mobile: 'badge' },
]

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

function syncFilters() {
  const active = dynamicFilters.value
  const serie = active.serie != null ? String(active.serie).trim() : ''
  const idTipo = idTipoNotaVenta.value

  const term = buscar.value.trim()
  const termNorm = normalizarBusquedaComprobante(term)

  filters.value = {
    buscar: termNorm.includes('-') ? termNorm : term,
    pagina: pagina.value,
    limite: limite.value,
    idTipoComprobante: idTipo ?? -1,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
    idCliente: active.idCliente != null ? Number(active.idCliente) : undefined,
    serie: serie || undefined,
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

watch(
  idTipoNotaVenta,
  (id) => {
    if (id != null) syncFilters()
  },
  { immediate: true },
)

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function actionItemsForRow(row: ComprobanteListItem): ActionMenuItem[] {
  const busy = pdfBusyId.value !== null
  const tieneDestino = Boolean(row.serie_comprobante_destino)

  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !canEdit.value,
    },
    {
      key: 'pdf-a4',
      label: 'Descargar PDF A4',
      icon: ICONS.download,
      disabled: busy,
      hidden: !canView.value,
    },
    {
      key: 'print-a4',
      label: 'Imprimir A4',
      icon: ICONS.printer,
      disabled: busy,
      hidden: !canView.value,
    },
    {
      key: 'pdf-ticket',
      label: 'Descargar ticket 80mm',
      icon: ICONS.ticket,
      disabled: busy,
      hidden: !canView.value,
    },
    {
      key: 'print-ticket',
      label: 'Imprimir ticket 80mm',
      icon: ICONS.printer,
      disabled: busy,
      hidden: !canView.value,
    },
    {
      key: 'emitir-boleta',
      label: 'Emitir Boleta',
      icon: ICONS.ticket,
      disabled: busy || tieneDestino,
      hidden: !canView.value || tieneDestino,
    },
    {
      key: 'emitir-factura',
      label: 'Emitir Factura',
      icon: ICONS.ticket,
      disabled: busy || tieneDestino,
      hidden: !canView.value || tieneDestino,
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

function onActionSelect(key: string, row: ComprobanteListItem) {
  switch (key) {
    case 'edit':
      openEditModal(row)
      return
    case 'pdf-a4':
      return descargarPdf(row, 'a4')
    case 'print-a4':
      return imprimirPdf(row, 'a4')
    case 'pdf-ticket':
      return descargarPdf(row, 'ticket')
    case 'print-ticket':
      return imprimirPdf(row, 'ticket')
    case 'emitir-boleta':
      comprobanteToEmitir.value = row
      emitirCodigoTipo.value = '03'
      emitirModalOpen.value = true
      return
    case 'emitir-factura':
      comprobanteToEmitir.value = row
      emitirCodigoTipo.value = '01'
      emitirModalOpen.value = true
      return
    case 'delete':
      openDeleteModal(row)
      return
  }
}

async function descargarPdf(row: ComprobanteListItem, formato: ComprobantePdfFormato) {
  pdfBusyId.value = row.id
  try {
    const blob = await comprobantesService.obtenerPdf(row.id, formato)
    downloadBlob(blob, `${row.serie}-${row.numero}-${formato}.pdf`)
    toastSuccess(formato === 'ticket' ? 'PDF ticketera 80mm descargado' : 'PDF A4 descargado')
  } catch (error) {
    toastApiError(error, 'No se pudo generar el documento')
  } finally {
    pdfBusyId.value = null
  }
}

async function imprimirPdf(row: ComprobanteListItem, formato: ComprobantePdfFormato) {
  pdfBusyId.value = row.id
  const win = openPdfPrintWindow()
  if (!win) {
    pdfBusyId.value = null
    toastWarning(
      'El navegador bloqueó la ventana de impresión. Permite ventanas emergentes en la URL.',
    )
    return
  }

  try {
    const blob = await comprobantesService.obtenerPdf(row.id, formato)
    printBlobInWindow(win, blob)
  } catch (error) {
    win.close()
    toastApiError(error, 'No se pudo abrir para imprimir')
  } finally {
    pdfBusyId.value = null
  }
}

function openDetailModal(row: ComprobanteListItem) {
  comprobanteToViewId.value = row.id
  detailModalOpen.value = true
}

function openEditModal(row: ComprobanteListItem) {
  comprobanteToEdit.value = row
  editModalOpen.value = true
}

function openDeleteModal(row: ComprobanteListItem) {
  comprobanteToDelete.value = row
  deleteModalOpen.value = true
}

async function confirmDelete() {
  const row = comprobanteToDelete.value
  const userId = authStore.user?.id
  if (!row || !userId) return

  await deleteMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: userId })
  deleteModalOpen.value = false
  comprobanteToDelete.value = null
}
</script>

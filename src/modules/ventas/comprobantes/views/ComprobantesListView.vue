<template>
  <div>
    <PageBreadcrumb page-title="Comprobantes" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Serie, número o cliente..."
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

      <template #cell-origen="{ row }">
        <template v-if="row.serie_comprobante_origen">
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ row.serie_comprobante_origen }}-{{ row.numero_comprobante_origen }}
          </p>
          <div class="mt-1">
            <ListaOpcionBadge
              :value="row.nombre_tipo_comprobante_origen ?? row.codigo_tipo_comprobante_origen"
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
        <ListaOpcionBadge :value="String(value ?? 'PENDIENTE')" raw />
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

    <ComprobanteDetailModal v-model="detailModalOpen" :comprobante-id="comprobanteToViewId" />

    <ComprobanteEditModal v-model="editModalOpen" :comprobante="comprobanteToEdit" />

    <ComprobanteNotaCreditoModal
      v-model="notaCreditoModalOpen"
      :comprobante="comprobanteToNotaCredito"
    />

    <ComprobanteCdrModal v-model="cdrModalOpen" :comprobante="comprobanteToCdr" />

    <ComprobanteAnularModal v-model="anularModalOpen" :comprobante="comprobanteToAnular" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar comprobante"
      subtitle="Solo se pueden eliminar comprobantes no aceptados por SUNAT."
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
import {
  useDeleteComprobanteMutation,
  useEmitirComprobanteMutation,
} from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import ComprobanteAnularModal from '@/modules/ventas/comprobantes/components/ComprobanteAnularModal.vue'
import ComprobanteCdrModal from '@/modules/ventas/comprobantes/components/ComprobanteCdrModal.vue'
import ComprobanteDetailModal from '@/modules/ventas/comprobantes/components/ComprobanteDetailModal.vue'
import ComprobanteEditModal from '@/modules/ventas/comprobantes/components/ComprobanteEditModal.vue'
import ComprobanteNotaCreditoModal from '@/modules/ventas/comprobantes/components/ComprobanteNotaCreditoModal.vue'
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
import {
  emitirConImpresionTicket,
} from '@/modules/ventas/comprobantes/utils/imprimirTicketTrasEmision'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { ventasBreadcrumbItems } from '@/modules/ventas/config/ventas-breadcrumb'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
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

const breadcrumbItems = ventasBreadcrumbItems('Comprobantes')

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
const emitMutation = useEmitirComprobanteMutation()
const deleteMutation = useDeleteComprobanteMutation()

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const detailModalOpen = ref(false)
const comprobanteToViewId = ref<number | null>(null)

const editModalOpen = ref(false)
const comprobanteToEdit = ref<ComprobanteListItem | null>(null)

const notaCreditoModalOpen = ref(false)
const comprobanteToNotaCredito = ref<ComprobanteListItem | null>(null)

const cdrModalOpen = ref(false)
const comprobanteToCdr = ref<ComprobanteListItem | null>(null)

const deleteModalOpen = ref(false)
const comprobanteToDelete = ref<ComprobanteListItem | null>(null)

const anularModalOpen = ref(false)
const comprobanteToAnular = ref<ComprobanteListItem | null>(null)

const pdfBusyId = ref<number | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_EDITAR))
const canEmit = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_EMITIR))
const canConsultarCdr = computed(() =>
  authStore.hasPermission(PermisoBanderas.COMPROBANTES_CONSULTAR_CDR),
)
const canAnular = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_EMITIR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_ELIMINAR))

const isLoading = computed(() => comprobantesQuery.isFetching.value)
const rows = computed(() => comprobantesQuery.data.value?.data ?? [])

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
    label: 'Tipo',
    type: 'select',
    placeholder: 'Boleta, factura...',
    disabled: catalogosQuery.isLoading.value || catalogosQuery.isFetching.value,
    options: toSelectOptions(
      (catalogosQuery.data.value?.tiposComprobante ?? []).filter((tipo) => {
        const codigo = String(tipo.descripcion ?? '').toUpperCase()
        const nombre = String(tipo.nombre ?? '').toUpperCase()
        return (
          codigo !== 'NV' &&
          !nombre.includes('NOTA_VENTA') &&
          !nombre.includes('NOTA DE VENTA')
        )
      }),
    ),
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
    key: 'idEstadoSunat',
    label: 'Estado SUNAT',
    type: 'select',
    placeholder: 'Pendiente, aceptado...',
    disabled: catalogosQuery.isLoading.value || catalogosQuery.isFetching.value,
    options: toSelectOptions(catalogosQuery.data.value?.estadosSunat),
  },
  {
    key: 'serie',
    label: 'Serie',
    type: 'text',
    placeholder: 'B001 / F001',
  },
])

const columns: TableColumn[] = [
  { key: 'comprobante', label: 'Comprobante', mobile: 'primary' },
  { key: 'origen', label: 'Origen' },
  { key: 'nombre_cliente', label: 'Cliente' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'total_importe', label: 'Total', align: 'right' },
  { key: 'nombre_estado_sunat', label: 'SUNAT', mobile: 'badge' },
]

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

function syncFilters() {
  const active = dynamicFilters.value
  const serie = active.serie != null ? String(active.serie).trim() : ''

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
    idTipoComprobante:
      active.idTipoComprobante != null ? Number(active.idTipoComprobante) : undefined,
    idCliente: active.idCliente != null ? Number(active.idCliente) : undefined,
    idEstadoSunat:
      active.idEstadoSunat != null ? Number(active.idEstadoSunat) : undefined,
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

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function esNotaVenta(row: ComprobanteListItem) {
  const codigo = String(row.codigo_tipo_comprobante ?? '').toUpperCase()
  const nombre = String(row.nombre_tipo_comprobante ?? '').toUpperCase()
  return codigo === 'NV' || nombre.includes('NOTA_VENTA') || nombre.includes('NOTA DE VENTA')
}

function puedeEmitir(row: ComprobanteListItem) {
  if (esNotaVenta(row) || row.nombre_estado_sunat === 'NO_APLICA') return false
  return row.nombre_estado_sunat !== 'ACEPTADO' && row.nombre_estado_sunat !== 'BAJA'
}

function puedeEditar(row: ComprobanteListItem) {
  return row.nombre_estado_sunat !== 'ACEPTADO' && row.nombre_estado_sunat !== 'BAJA'
}

function puedeEliminar(row: ComprobanteListItem) {
  return row.nombre_estado_sunat !== 'ACEPTADO' && row.nombre_estado_sunat !== 'BAJA'
}

function puedePdf(row: ComprobanteListItem) {
  return (
    row.nombre_estado_sunat === 'ACEPTADO' ||
    row.nombre_estado_sunat === 'BAJA' ||
    row.nombre_estado_sunat === 'NO_APLICA' ||
    esNotaVenta(row)
  )
}

function puedeConsultarCdr(row: ComprobanteListItem) {
  if (esNotaVenta(row) || row.nombre_estado_sunat === 'NO_APLICA') return false
  return row.nombre_estado_sunat === 'PENDIENTE' || row.nombre_estado_sunat === 'ACEPTADO'
}

function puedeNotaCredito(row: ComprobanteListItem) {
  if (esNotaVenta(row)) return false
  if (row.nombre_estado_sunat !== 'ACEPTADO') return false
  const codigo = String(row.codigo_tipo_comprobante ?? '')
  const nombre = String(row.nombre_tipo_comprobante ?? '').toUpperCase()
  if (codigo === '01' || codigo === '03') return true
  return (
    (nombre.includes('FACTURA') || nombre.includes('BOLETA')) &&
    !nombre.includes('NOTA')
  )
}

function puedeAnular(row: ComprobanteListItem) {
  if (esNotaVenta(row)) return false
  if (row.nombre_estado_sunat !== 'ACEPTADO') return false
  const codigo = String(row.codigo_tipo_comprobante ?? '')
  const nombre = String(row.nombre_tipo_comprobante ?? '').toUpperCase()
  // Comunicación de baja: facturas y notas (no boletas)
  if (codigo === '01' || codigo === '07' || codigo === '08') return true
  return (
    nombre.includes('FACTURA') ||
    nombre.includes('NOTA_CREDITO') ||
    nombre.includes('NOTA_DEBITO') ||
    nombre.includes('NOTA CREDITO') ||
    nombre.includes('NOTA DEBITO')
  ) && !nombre.includes('BOLETA')
}

function actionItemsForRow(row: ComprobanteListItem): ActionMenuItem[] {
  const busy = pdfBusyId.value !== null || emitMutation.isPending.value

  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !(canEdit.value && puedeEditar(row)),
    },
    {
      key: 'emit',
      label: 'Emitir SUNAT',
      icon: ICONS.plug,
      disabled: busy,
      hidden: !(canEmit.value && puedeEmitir(row)),
    },
    {
      key: 'nota-credito',
      label: 'Nota de crédito',
      icon: ICONS.fileText,
      disabled: busy,
      hidden: !(canCreate.value && puedeNotaCredito(row)),
    },
    {
      key: 'cdr',
      label: 'Consultar CDR',
      icon: ICONS.refreshCw,
      disabled: busy,
      hidden: !(canConsultarCdr.value && puedeConsultarCdr(row)),
    },
    {
      key: 'anular',
      label: 'Anular en SUNAT',
      icon: ICONS.ban,
      disabled: busy,
      hidden: !(canAnular.value && puedeAnular(row)),
    },
    {
      key: 'pdf-a4',
      label: 'Descargar PDF A4',
      icon: ICONS.download,
      disabled: busy,
      hidden: !(canView.value && puedePdf(row)),
    },
    {
      key: 'print-a4',
      label: 'Imprimir A4',
      icon: ICONS.printer,
      disabled: busy,
      hidden: !(canView.value && puedePdf(row)),
    },
    {
      key: 'pdf-ticket',
      label: 'Descargar ticket 80mm',
      icon: ICONS.ticket,
      disabled: busy,
      hidden: !(canView.value && puedePdf(row)),
    },
    {
      key: 'print-ticket',
      label: 'Imprimir ticket 80mm',
      icon: ICONS.printer,
      disabled: busy,
      hidden: !(canView.value && puedePdf(row)),
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: ICONS.trash,
      danger: true,
      disabled: busy,
      hidden: !(canDelete.value && puedeEliminar(row)),
    },
  ]
}

function onActionSelect(key: string, row: ComprobanteListItem) {
  switch (key) {
    case 'edit':
      openEditModal(row)
      return
    case 'emit':
      return emitirComprobante(row)
    case 'nota-credito':
      openNotaCreditoModal(row)
      return
    case 'cdr':
      openCdrModal(row)
      return
    case 'anular':
      openAnularModal(row)
      return
    case 'pdf-a4':
      return descargarPdf(row, 'a4')
    case 'print-a4':
      return imprimirPdf(row, 'a4')
    case 'pdf-ticket':
      return descargarPdf(row, 'ticket')
    case 'print-ticket':
      return imprimirPdf(row, 'ticket')
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

function openNotaCreditoModal(row: ComprobanteListItem) {
  comprobanteToNotaCredito.value = row
  notaCreditoModalOpen.value = true
}

function openDeleteModal(row: ComprobanteListItem) {
  comprobanteToDelete.value = row
  deleteModalOpen.value = true
}

function openAnularModal(row: ComprobanteListItem) {
  comprobanteToAnular.value = row
  anularModalOpen.value = true
}

function openCdrModal(row: ComprobanteListItem) {
  comprobanteToCdr.value = row
  cdrModalOpen.value = true
}

async function emitirComprobante(row: ComprobanteListItem) {
  const userId = authStore.user?.id
  if (!userId) return

  try {
    const resultado = await emitirConImpresionTicket({
      comprobanteId: row.id,
      emitir: () =>
        emitMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: userId }),
    })

    if (resultado === 'sin_ventana') {
      toastWarning(
        'Emitido OK. Permite ventanas emergentes en la URL para imprimir el ticket automáticamente.',
      )
    }
  } catch {
    // mutateAsync ya muestra el toast de error
  }
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

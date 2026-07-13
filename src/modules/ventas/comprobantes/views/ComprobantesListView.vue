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
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ row.nombre_tipo_comprobante ?? row.codigo_tipo_comprobante }}
        </p>
      </template>

      <template #cell-nombre_cliente="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-total_importe="{ value }">
        <span class="tabular-nums">{{ formatMoney(Number(value ?? 0)) }}</span>
      </template>

      <template #cell-nombre_estado_sunat="{ value }">
        <AppBadge variant="light" :color="sunatBadgeColor(String(value ?? ''))">
          {{ value ?? 'PENDIENTE' }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex flex-wrap items-center justify-end gap-1.5">
          <button
            v-if="canView"
            type="button"
            title="Ver detalle"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openDetailModal(row)"
          >
            <AppIcon :name="ICONS.eye" :size="15" />
          </button>

          <button
            v-if="canView && puedePdf(row)"
            type="button"
            title="Descargar PDF A4"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            :disabled="pdfBusyId === row.id"
            @click="descargarPdf(row, 'a4')"
          >
            <AppIcon :name="ICONS.download" :size="15" />
          </button>

          <button
            v-if="canView && puedePdf(row)"
            type="button"
            title="Imprimir A4"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            :disabled="pdfBusyId === row.id"
            @click="imprimirPdf(row, 'a4')"
          >
            <AppIcon :name="ICONS.printer" :size="15" />
          </button>

          <button
            v-if="canView && puedePdf(row)"
            type="button"
            title="Descargar ticketera 80mm"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-500 text-brand-600 transition hover:bg-brand-500/10 disabled:opacity-60"
            :disabled="pdfBusyId === row.id"
            @click="descargarPdf(row, 'ticket')"
          >
            <AppIcon :name="ICONS.ticket" :size="15" />
          </button>

          <button
            v-if="canView && puedePdf(row)"
            type="button"
            title="Imprimir ticket 80mm"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-500 text-brand-600 transition hover:bg-brand-500/10 disabled:opacity-60"
            :disabled="pdfBusyId === row.id"
            @click="imprimirPdf(row, 'ticket')"
          >
            <AppIcon :name="ICONS.printer" :size="15" />
          </button>

          <button
            v-if="canEmit && puedeEmitir(row)"
            type="button"
            title="Emitir SUNAT"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-success-500 text-success-600 transition hover:bg-success-500/10 disabled:opacity-60"
            :disabled="emitMutation.isPending.value"
            @click="emitirComprobante(row)"
          >
            <AppIcon :name="ICONS.plug" :size="15" />
          </button>

          <button
            v-if="canDelete && puedeEliminar(row)"
            type="button"
            title="Eliminar"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-error-500 text-error-500 transition hover:bg-error-500/10"
            @click="openDeleteModal(row)"
          >
            <AppIcon :name="ICONS.trash" :size="15" />
          </button>
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
import { useComprobantesQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import {
  useDeleteComprobanteMutation,
  useEmitirComprobanteMutation,
} from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import ComprobanteDetailModal from '@/modules/ventas/comprobantes/components/ComprobanteDetailModal.vue'
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
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppListToolbar, AppModal, AppPagination, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const breadcrumbItems = [
  { label: 'Ventas', path: '/admin/ventas/pos' },
  { label: 'Comprobantes' },
]

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
const emitMutation = useEmitirComprobanteMutation()
const deleteMutation = useDeleteComprobanteMutation()

const detailModalOpen = ref(false)
const comprobanteToViewId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const comprobanteToDelete = ref<ComprobanteListItem | null>(null)
const pdfBusyId = ref<number | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_VER))
const canEmit = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_EMITIR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_ELIMINAR))

const isLoading = computed(() => comprobantesQuery.isFetching.value)
const rows = computed(() => comprobantesQuery.data.value?.data ?? [])

const filterFields = computed<DynamicFilterFieldDef[]>(() => [])

const columns: TableColumn[] = [
  { key: 'comprobante', label: 'Comprobante', mobile: 'primary' },
  { key: 'nombre_cliente', label: 'Cliente' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'total_importe', label: 'Total', align: 'right' },
  { key: 'nombre_estado_sunat', label: 'SUNAT', mobile: 'badge' },
]

watch([buscar, pagina, limite, dynamicFilters], () => {
  filters.value = {
    buscar: buscar.value,
    pagina: pagina.value,
    limite: limite.value,
  }
})

function onFiltersChange() {
  pagina.value = 1
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function sunatBadgeColor(estado: string) {
  if (estado.toUpperCase() === 'ACEPTADO') return 'success'
  if (estado.toUpperCase() === 'RECHAZADO') return 'error'
  return 'warning'
}

function puedeEmitir(row: ComprobanteListItem) {
  return row.nombre_estado_sunat !== 'ACEPTADO'
}

function puedeEliminar(row: ComprobanteListItem) {
  return row.nombre_estado_sunat !== 'ACEPTADO'
}

function puedePdf(row: ComprobanteListItem) {
  return row.nombre_estado_sunat === 'ACEPTADO'
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

function openDeleteModal(row: ComprobanteListItem) {
  comprobanteToDelete.value = row
  deleteModalOpen.value = true
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

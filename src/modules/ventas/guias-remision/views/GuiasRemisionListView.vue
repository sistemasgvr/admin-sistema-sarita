<template>
  <div>
    <PageBreadcrumb page-title="Guías de remisión" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Serie, número o destinatario..."
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
              Nueva guía
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-documento="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.serie }}-{{ row.numero }}
        </p>
        <div class="mt-1">
          <ListaOpcionBadge :value="row.nombre_tipo_guia ?? row.codigo_tipo_guia" />
        </div>
      </template>

      <template #cell-nombre_destinatario="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-motivo="{ row }">
        {{ formatListaOpcionLabel(row.nombre_motivo_traslado, row.codigo_motivo_traslado) }}
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
          :meta="guiasQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <GuiaRemisionDetailModal v-model="detailModalOpen" :guia-id="guiaToViewId" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar guía de remisión"
      subtitle="Solo se pueden eliminar guías no aceptadas por SUNAT."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ guiaToDelete?.serie }}-{{ guiaToDelete?.numero }}
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
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-70 sm:w-auto"
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
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import GuiaRemisionDetailModal from '@/modules/ventas/guias-remision/components/GuiaRemisionDetailModal.vue'
import {
  useConsultarEstadoGuiaRemisionMutation,
  useDeleteGuiaRemisionMutation,
  useEmitirGuiaRemisionMutation,
} from '@/modules/ventas/guias-remision/composables/useGuiaRemisionMutations'
import {
  useGuiaRemisionCatalogosQuery,
  useGuiasRemisionQuery,
} from '@/modules/ventas/guias-remision/composables/useGuiasRemisionQuery'
import type {
  GuiaRemisionListFilters,
  GuiaRemisionListItem,
} from '@/modules/ventas/guias-remision/interfaces/guia-remision.interface'
import { ventasBreadcrumbItems } from '@/modules/ventas/config/ventas-breadcrumb'
import { downloadBlob } from '@/modules/ventas/comprobantes/utils/comprobantePdf'
import { guiasRemisionService } from '@/modules/ventas/guias-remision/services/guias-remision.service'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'
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
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type {
  DynamicFilterFieldDef,
  DynamicFilterValues,
} from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const breadcrumbItems = ventasBreadcrumbItems('Guías de remisión')
const router = useRouter()
const authStore = useAuthStore()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filters = ref<GuiaRemisionListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const guiasQuery = useGuiasRemisionQuery(filters)
const catalogosQuery = useGuiaRemisionCatalogosQuery()
const emitMutation = useEmitirGuiaRemisionMutation()
const consultarMutation = useConsultarEstadoGuiaRemisionMutation()
const deleteMutation = useDeleteGuiaRemisionMutation()

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const detailModalOpen = ref(false)
const guiaToViewId = ref<number | null>(null)
const deleteModalOpen = ref(false)
const guiaToDelete = ref<GuiaRemisionListItem | null>(null)
const pdfBusyId = ref<number | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.GUIAS_REMISION_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.GUIAS_REMISION_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.GUIAS_REMISION_EDITAR))
const canEmit = computed(() => authStore.hasPermission(PermisoBanderas.GUIAS_REMISION_EMITIR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.GUIAS_REMISION_ELIMINAR))

const isLoading = computed(() => guiasQuery.isFetching.value)
const rows = computed(() => guiasQuery.data.value?.data ?? [])

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  { key: 'fechaDesde', label: 'Desde', type: 'date' },
  { key: 'fechaHasta', label: 'Hasta', type: 'date' },
  {
    key: 'idTipoGuia',
    label: 'Tipo',
    type: 'select',
    placeholder: '09 / 31',
    disabled: catalogosQuery.isLoading.value,
    options: toSelectOptions(catalogosQuery.data.value?.tiposGuia),
  },
  {
    key: 'idDestinatario',
    label: 'Destinatario',
    type: 'select',
    placeholder: 'Cliente',
    disabled: clientesQuery.isLoading.value,
    options: (clientesQuery.data.value?.data ?? []).map((c) => ({
      value: c.id,
      label: getClienteOptionLabel(c),
    })),
  },
  {
    key: 'idEstadoSunat',
    label: 'Estado SUNAT',
    type: 'select',
    placeholder: 'Pendiente, aceptado...',
    disabled: catalogosQuery.isLoading.value,
    options: toSelectOptions(catalogosQuery.data.value?.estadosSunat),
  },
  {
    key: 'serie',
    label: 'Serie',
    type: 'text',
    placeholder: 'T001',
  },
])

const columns: TableColumn[] = [
  { key: 'documento', label: 'Guía', mobile: 'primary' },
  { key: 'nombre_destinatario', label: 'Destinatario' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'motivo', label: 'Motivo' },
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
    idTipoGuia: active.idTipoGuia != null ? Number(active.idTipoGuia) : undefined,
    idDestinatario:
      active.idDestinatario != null ? Number(active.idDestinatario) : undefined,
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

syncFilters()

function puedeEmitir(row: GuiaRemisionListItem) {
  // ACEPTADO: ya emitida. Con ticket + PENDIENTE: forzar consultar (evitar reenvío).
  if (row.nombre_estado_sunat === 'ACEPTADO') return false
  if (row.nombre_estado_sunat === 'PENDIENTE' && row.ticket_sunat) return false
  return true
}

function puedeEditar(row: GuiaRemisionListItem) {
  return row.nombre_estado_sunat !== 'ACEPTADO'
}

function puedeEliminar(row: GuiaRemisionListItem) {
  return row.nombre_estado_sunat !== 'ACEPTADO'
}

function puedeConsultar(row: GuiaRemisionListItem) {
  return Boolean(row.ticket_sunat)
}

function actionItemsForRow(row: GuiaRemisionListItem): ActionMenuItem[] {
  const busy = pdfBusyId.value !== null || emitMutation.isPending.value || consultarMutation.isPending.value

  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !(canEdit.value && puedeEditar(row)),
    },
    {
      key: 'pdf',
      label: 'Descargar PDF',
      icon: ICONS.fileText,
      disabled: busy,
      hidden: !canView.value,
    },
    {
      key: 'emit',
      label: 'Emitir SUNAT',
      icon: ICONS.plug,
      disabled: busy,
      hidden: !(canEmit.value && puedeEmitir(row)),
    },
    {
      key: 'status',
      label: 'Consultar estado',
      icon: ICONS.refreshCw,
      disabled: busy,
      hidden: !(canEmit.value && puedeConsultar(row)),
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

function onActionSelect(key: string, row: GuiaRemisionListItem) {
  switch (key) {
    case 'edit':
      openEdit(row)
      return
    case 'pdf':
      return descargarPdf(row)
    case 'emit':
      return emitir(row)
    case 'status':
      return consultarEstado(row)
    case 'delete':
      guiaToDelete.value = row
      deleteModalOpen.value = true
      return
  }
}

function openCreate() {
  void router.push({ name: 'admin-ventas-guias-remision-nueva' })
}

function openEdit(row: GuiaRemisionListItem) {
  void router.push({
    name: 'admin-ventas-guias-remision-editar',
    params: { id: String(row.id) },
  })
}

function openDetail(row: GuiaRemisionListItem) {
  guiaToViewId.value = row.id
  detailModalOpen.value = true
}

async function descargarPdf(row: GuiaRemisionListItem) {
  if (pdfBusyId.value !== null) return
  pdfBusyId.value = row.id

  try {
    const blob = await guiasRemisionService.obtenerPdf(row.id)
    downloadBlob(blob, `GRE-${row.serie}-${row.numero}.pdf`)
    toastSuccess('PDF descargado')
  } catch (error) {
    toastApiError(error, 'No se pudo generar el PDF')
  } finally {
    pdfBusyId.value = null
  }
}

async function emitir(row: GuiaRemisionListItem) {
  const userId = authStore.user?.id
  if (!userId) return
  await emitMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: userId })
}

async function consultarEstado(row: GuiaRemisionListItem) {
  const userId = authStore.user?.id
  if (!userId) return
  await consultarMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: userId })
}

async function confirmDelete() {
  const row = guiaToDelete.value
  const userId = authStore.user?.id
  if (!row || !userId) return
  await deleteMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: userId })
  deleteModalOpen.value = false
  guiaToDelete.value = null
}
</script>

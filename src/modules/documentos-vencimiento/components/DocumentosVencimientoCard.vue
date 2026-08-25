<template>
  <div class="w-full rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
    <div class="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
      <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
        Permisos y certificados
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Control de vencimientos y renovaciones de la empresa: BPA, salubridad, defensa civil,
        saneamiento ambiental, extintores, SOAT y demás documentos con fecha de vencimiento.
      </p>
    </div>

    <div class="px-6 py-5">
      <AppSummaryChips :chips="summaryChips" />

      <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
        <template #toolbar>
          <AppListToolbar
            v-model:search="buscar"
            v-model:filters="dynamicFilters"
            :filter-fields="filterFields"
            search-placeholder="Buscar por descripción o N° de documento..."
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
                Nuevo documento
              </button>
            </template>
          </AppListToolbar>
        </template>

        <template #cell-documento="{ row }">
          <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ row.descripcion }}</p>
          <p v-if="row.numero_documento" class="text-xs text-gray-500 dark:text-gray-400">
            N° {{ row.numero_documento }}
          </p>
        </template>

        <template #cell-categoria="{ row }">
          <AppBadge v-if="row.nombre_categoria" size="sm" color="neutral">
            {{ formatListaOpcionLabel(row.nombre_categoria) }}
          </AppBadge>
          <span v-else class="text-sm text-gray-400 dark:text-gray-500">—</span>
        </template>

        <template #cell-alcance="{ row }">
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ alcanceTexto(row) }}</p>
        </template>

        <template #cell-vencimiento="{ row }">
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatListDate(row.fecha_vencimiento) }}</p>
          <p class="text-xs" :class="diasTextoClass(row)">{{ diasTexto(row) }}</p>
        </template>

        <template #cell-estado="{ row }">
          <AppBadge :color="estadoColor(row.estado_calculado)">
            {{ estadoLabel(row.estado_calculado) }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <button
            type="button"
            title="Ver detalle"
            class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            @click="openDetailModal(row)"
          >
            <AppIcon :name="ICONS.eye" :size="16" />
          </button>

          <button
            v-if="canEdit && row.estado === 1"
            type="button"
            title="Renovar"
            class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10"
            @click="openRenovarModal(row)"
          >
            <AppIcon :name="ICONS.refreshCw" :size="16" />
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
            v-if="canDelete && row.estado === 1"
            type="button"
            title="Desactivar"
            class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
            @click="openDeleteModal(row)"
          >
            <AppIcon :name="ICONS.archive" :size="16" />
          </button>
        </template>

        <template #footer>
          <AppPagination
            v-model:pagina="pagina"
            v-model:limite="limite"
            :meta="documentosQuery.data.value?.meta"
            :disabled="isLoading"
          />
        </template>
      </AppTable>
    </div>

    <DocumentoVencimientoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :documento="selectedDocumento"
      @saved="onDocumentoSaved"
    />

    <RenovarDocumentoVencimientoModal
      v-model="renovarModalOpen"
      :documento="documentoToRenovar"
      @saved="documentoToRenovar = null"
    />

    <AppModal v-model="detailModalOpen" title="Detalle del documento" size="sm">
      <div v-if="documentoDetailQuery.isFetching.value && !documentoDetalle" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando...
      </div>
      <dl v-else-if="documentoDetalle" class="space-y-3">
        <div>
          <dt class="text-xs text-gray-500 dark:text-gray-400">Descripción</dt>
          <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
            {{ documentoDetalle.descripcion }}
          </dd>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">Categoría</dt>
            <dd class="text-sm text-gray-700 dark:text-gray-300">
              {{ documentoDetalle.nombre_categoria ? formatListaOpcionLabel(documentoDetalle.nombre_categoria) : '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">Alcance</dt>
            <dd class="text-sm text-gray-700 dark:text-gray-300">{{ alcanceTexto(documentoDetalle) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">Vencimiento</dt>
            <dd class="text-sm text-gray-700 dark:text-gray-300">
              {{ formatListDate(documentoDetalle.fecha_vencimiento) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">Última renovación</dt>
            <dd class="text-sm text-gray-700 dark:text-gray-300">
              {{ documentoDetalle.fecha_renovacion ? formatListDate(documentoDetalle.fecha_renovacion) : '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">N° de documento</dt>
            <dd class="text-sm text-gray-700 dark:text-gray-300">{{ documentoDetalle.numero_documento || '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500 dark:text-gray-400">Estado</dt>
            <dd>
              <AppBadge :color="estadoColor(documentoDetalle.estado_calculado)" size="sm">
                {{ estadoLabel(documentoDetalle.estado_calculado) }}
              </AppBadge>
            </dd>
          </div>
        </div>
        <div v-if="documentoDetalle.observacion">
          <dt class="text-xs text-gray-500 dark:text-gray-400">Observación</dt>
          <dd class="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
            {{ documentoDetalle.observacion }}
          </dd>
        </div>
      </dl>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
          @click="detailModalOpen = false"
        >
          Cerrar
        </button>
      </template>
    </AppModal>

    <AppModal
      v-model="deleteModalOpen"
      title="Desactivar documento"
      subtitle="El registro no se elimina de forma permanente; queda inactivo y puede reactivarse desde soporte técnico."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas desactivar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ documentoToDelete?.descripcion }}
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
          {{ deleteMutation.isPending.value ? 'Desactivando...' : 'Desactivar' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DocumentoVencimientoFormModal from '@/modules/documentos-vencimiento/components/DocumentoVencimientoFormModal.vue'
import RenovarDocumentoVencimientoModal from '@/modules/documentos-vencimiento/components/RenovarDocumentoVencimientoModal.vue'
import { useDeleteDocumentoVencimientoMutation } from '@/modules/documentos-vencimiento/composables/useDocumentoVencimientoMutations'
import { useDocumentosVencimientoQuery } from '@/modules/documentos-vencimiento/composables/useDocumentosVencimientoQuery'
import { useDocumentoVencimientoDetailQuery } from '@/modules/documentos-vencimiento/composables/useDocumentoVencimientoDetailQuery'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import type {
  DocumentoVencimiento,
  DocumentoVencimientoEstadoFiltro,
  DocumentoVencimientoFormMode,
  DocumentoVencimientoListFilters,
  DocumentoVencimientoResumen,
  EstadoVencimiento,
} from '@/modules/documentos-vencimiento/interfaces/documento-vencimiento.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppBadge,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppSummaryChips,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { SummaryChip } from '@/shared/interfaces/summary-chip.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { formatListDate } from '@/shared/utils/date'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const authStore = useAuthStore()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({ estadoRegistro: 'activos' })
const pagina = ref(1)
const limite = ref(10)

const listaCategoriaId = ref(ListaIds.CATEGORIA_VENCIMIENTO)
const categoriaQuery = useListaOpcionesQuery(listaCategoriaId)
const categoriaOptions = computed(() => toSelectOptions(categoriaQuery.data.value))

const estadoRegistroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]

const estadoVencimientoOptions: SelectOption[] = [
  { label: 'Vigente', value: 'VIGENTE' },
  { label: 'Por vencer', value: 'POR_VENCER' },
  { label: 'Vencido', value: 'VENCIDO' },
]

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idCategoria',
    label: 'Categoría',
    type: 'select',
    placeholder: 'Todas',
    options: categoriaOptions.value,
  },
  {
    key: 'estadoVencimiento',
    label: 'Vencimiento',
    type: 'select',
    placeholder: 'Todos',
    options: estadoVencimientoOptions,
  },
  {
    key: 'estadoRegistro',
    label: 'Registro',
    type: 'select',
    placeholder: 'Activos',
    options: estadoRegistroOptions,
  },
])

const buildIsActivos = (value: DocumentoVencimientoEstadoFiltro): number | undefined => {
  switch (value) {
    case 'activos':
      return 1
    case 'inactivos':
      return 0
    case 'todos':
    default:
      return undefined
  }
}

const filters = ref<DocumentoVencimientoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  isActivos: 1,
})

const documentosQuery = useDocumentosVencimientoQuery(filters)
const deleteMutation = useDeleteDocumentoVencimientoMutation()

const resumen = computed(
  () => (documentosQuery.data.value?.meta?.resumen ?? {}) as Partial<DocumentoVencimientoResumen>,
)

const summaryChips = computed<SummaryChip[]>(() => [
  { label: 'Total', value: documentosQuery.data.value?.meta?.total ?? 0, color: 'primary' },
  { label: 'Vigentes', value: resumen.value.vigentes ?? 0, color: 'success' },
  { label: 'Por vencer', value: resumen.value.porVencer ?? 0, color: 'warning' },
  { label: 'Vencidos', value: resumen.value.vencidos ?? 0, color: 'error' },
])

const isLoading = computed(() => documentosQuery.isFetching.value)
const rows = computed(() => documentosQuery.data.value?.data ?? [])

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.DOCUMENTOS_VENCIMIENTO_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.DOCUMENTOS_VENCIMIENTO_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.DOCUMENTOS_VENCIMIENTO_ELIMINAR))

const columns = computed<TableColumn<DocumentoVencimiento>[]>(() => [
  { key: 'documento', label: 'Documento' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'alcance', label: 'Alcance' },
  { key: 'vencimiento', label: 'Vencimiento' },
  { key: 'estado', label: 'Estado' },
])

const alcanceTexto = (row: DocumentoVencimiento) => {
  if (row.id_vehiculo) return `Vehículo · ${row.vehiculo_placa ?? '—'}`
  if (row.id_sucursal) return `Local · ${row.sucursal_nombre ?? '—'}`
  return 'Empresa'
}

const estadoColor = (estado: EstadoVencimiento): BadgeColor => {
  switch (estado) {
    case 'VIGENTE':
      return 'success'
    case 'POR_VENCER':
      return 'warning'
    case 'VENCIDO':
    default:
      return 'error'
  }
}

const estadoLabel = (estado: EstadoVencimiento) => {
  switch (estado) {
    case 'VIGENTE':
      return 'Vigente'
    case 'POR_VENCER':
      return 'Por vencer'
    case 'VENCIDO':
    default:
      return 'Vencido'
  }
}

const diasTexto = (row: DocumentoVencimiento) => {
  const dias = row.dias_para_vencer
  if (dias === 0) return 'Vence hoy'
  if (dias > 0) return `Vence en ${dias} día(s)`
  return `Vencido hace ${Math.abs(dias)} día(s)`
}

const diasTextoClass = (row: DocumentoVencimiento) =>
  row.dias_para_vencer < 0 ? 'text-error-500' : 'text-gray-400 dark:text-gray-500'

const estadoRegistroFiltroActual = computed<DocumentoVencimientoEstadoFiltro>(() => {
  const v = dynamicFilters.value.estadoRegistro
  return v === 'activos' || v === 'inactivos' ? v : 'todos'
})

const syncFilters = () => {
  const idCategoria = dynamicFilters.value.idCategoria
  const estadoVencimiento = dynamicFilters.value.estadoVencimiento

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    isActivos: buildIsActivos(estadoRegistroFiltroActual.value),
    idCategoria: idCategoria != null && idCategoria !== '' ? Number(idCategoria) : undefined,
    estado: (estadoVencimiento || undefined) as EstadoVencimiento | undefined,
  }
}

const onFiltersChange = () => {
  pagina.value = 1
  syncFilters()
}

watch(buscar, () => {
  pagina.value = 1
  syncFilters()
})

watch([pagina, limite], () => {
  syncFilters()
})

/* ---------- Modales ---------- */
const formModalOpen = ref(false)
const formMode = ref<DocumentoVencimientoFormMode>('create')
const selectedDocumento = ref<DocumentoVencimiento | null>(null)

const detailModalOpen = ref(false)
const documentoToView = ref<DocumentoVencimiento | null>(null)
const idDocumentoToView = computed(() => documentoToView.value?.id)
const documentoDetailQuery = useDocumentoVencimientoDetailQuery(idDocumentoToView, detailModalOpen)
const documentoDetalle = computed(() => documentoDetailQuery.data.value ?? documentoToView.value)

const renovarModalOpen = ref(false)
const documentoToRenovar = ref<DocumentoVencimiento | null>(null)

const deleteModalOpen = ref(false)
const documentoToDelete = ref<DocumentoVencimiento | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)

const openCreateModal = () => {
  formMode.value = 'create'
  selectedDocumento.value = null
  formModalOpen.value = true
}

const openEditModal = (documento: DocumentoVencimiento) => {
  formMode.value = 'edit'
  selectedDocumento.value = documento
  formModalOpen.value = true
}

const openDetailModal = (documento: DocumentoVencimiento) => {
  documentoToView.value = documento
  detailModalOpen.value = true
}

const openRenovarModal = (documento: DocumentoVencimiento) => {
  documentoToRenovar.value = documento
  renovarModalOpen.value = true
}

const openDeleteModal = (documento: DocumentoVencimiento) => {
  documentoToDelete.value = documento
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!documentoToDelete.value || !currentUserId.value) return

  try {
    await deleteMutation.mutateAsync({
      id: documentoToDelete.value.id,
      idUsuarioAuditoria: currentUserId.value,
    })
    deleteModalOpen.value = false
    documentoToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onDocumentoSaved = () => {
  selectedDocumento.value = null
}
</script>

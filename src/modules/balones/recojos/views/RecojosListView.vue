<template>
  <div>
    <PageBreadcrumb v-if="!embedded" page-title="Recojos" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Cliente, préstamo u observación..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <button
              v-if="canCreate"
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="openProgramar()"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Programar
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-cliente="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.nombre_cliente || '—' }}
        </p>
        <p v-if="row.documento_cliente" class="text-xs text-gray-500 dark:text-gray-400">
          {{ row.documento_cliente }}
        </p>
      </template>

      <template #cell-programado="{ row }">
        <span class="whitespace-nowrap">
          {{ row.fecha_programada?.slice(0, 10) || '—' }}
          <span v-if="row.hora_estimada" class="text-gray-500">
            · {{ String(row.hora_estimada).slice(0, 5) }}
          </span>
        </span>
      </template>

      <template #cell-nombre_estado="{ value }">
        <ListaOpcionBadge :value="value as string" />
      </template>

      <template #cell-total_detalles="{ value }">
        <span
          class="inline-flex min-w-8 items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300"
        >
          {{ value ?? 0 }}
        </span>
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
          :meta="recojosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <RecojoProgramarModal v-model="programarOpen" @saved="onSaved" />
    <RecojoResultadoModal
      v-model="resultadoOpen"
      :recojo-id="recojoActivoId"
      @saved="onSaved"
    />
    <RecojoDetailModal v-model="detailOpen" :recojo-id="recojoActivoId" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar recojo"
      subtitle="Baja lógica de la visita programada."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas eliminar el recojo de
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ recojoAEliminar?.nombre_cliente || `#${recojoAEliminar?.id}` }}
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
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import RecojoDetailModal from '@/modules/balones/recojos/components/RecojoDetailModal.vue'
import RecojoProgramarModal from '@/modules/balones/recojos/components/RecojoProgramarModal.vue'
import RecojoResultadoModal from '@/modules/balones/recojos/components/RecojoResultadoModal.vue'
import {
  useDeleteRecojoMutation,
  useUpdateRecojoMutation,
} from '@/modules/balones/recojos/composables/useRecojoMutations'
import { useRecojosQuery } from '@/modules/balones/recojos/composables/useRecojosQuery'
import {
  ESTADOS_RECOJO_FILTRO,
  type Recojo,
  type RecojoListFilters,
} from '@/modules/balones/recojos/interfaces/recojo.interface'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
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
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const props = withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false })
const authStore = useAuthStore()
const breadcrumbItems = balonesBreadcrumbItems('Recojos')

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filters = ref<RecojoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const recojosQuery = useRecojosQuery(filters)
const deleteMutation = useDeleteRecojoMutation()
const updateMutation = useUpdateRecojoMutation()

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const programarOpen = ref(false)
const resultadoOpen = ref(false)
const detailOpen = ref(false)
const recojoActivoId = ref<number | null>(null)
const deleteModalOpen = ref(false)
const recojoAEliminar = ref<Recojo | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.RECOJOS_BALON_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.RECOJOS_BALON_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.RECOJOS_BALON_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.RECOJOS_BALON_ELIMINAR))

const isLoading = computed(
  () => recojosQuery.isFetching.value || recojosQuery.isLoading.value,
)
const rows = computed(() => recojosQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'numero_prestamo', label: 'Préstamo' },
  { key: 'programado', label: 'Programado' },
  { key: 'nombre_estado', label: 'Estado' },
  { key: 'total_detalles', label: 'Cilindros' },
]

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idCliente',
    label: 'Cliente',
    type: 'select',
    placeholder: 'Seleccionar cliente',
    disabled: clientesQuery.isLoading.value,
    options: (clientesQuery.data.value?.data ?? []).map((c) => ({
      value: c.id,
      label: getClienteOptionLabel(c),
    })),
  },
  {
    key: 'estadoNombre',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    options: ESTADOS_RECOJO_FILTRO.map((e) => ({ value: e.value, label: e.label })),
  },
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
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

function syncFilters() {
  const active = dynamicFilters.value
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idCliente: active.idCliente != null ? Number(active.idCliente) : undefined,
    estadoNombre:
      active.estadoNombre != null && String(active.estadoNombre) !== ''
        ? String(active.estadoNombre)
        : undefined,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
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

watch([pagina, limite], () => syncFilters())

function esEditable(row: Recojo) {
  const estado = (row.nombre_estado ?? '').toUpperCase()
  return estado === 'PROGRAMADO' || estado === 'EN_RUTA'
}

function openProgramar() {
  programarOpen.value = true
}

function openDetail(row: Recojo) {
  recojoActivoId.value = row.id
  detailOpen.value = true
}

function openResultado(row: Recojo) {
  recojoActivoId.value = row.id
  resultadoOpen.value = true
}

function actionItemsForRow(row: Recojo): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value || updateMutation.isPending.value
  const editable = esEditable(row)
  return [
    {
      key: 'resultado',
      label: 'Registrar resultado',
      icon: ICONS.clipboardCheck,
      disabled: busy,
      hidden: !canEdit.value || !editable,
    },
    {
      key: 'en_ruta',
      label: 'Marcar en ruta',
      icon: ICONS.truck,
      disabled: busy,
      hidden: !canEdit.value || (row.nombre_estado ?? '').toUpperCase() !== 'PROGRAMADO',
    },
    {
      key: 'cancelar',
      label: 'Cancelar visita',
      icon: ICONS.x,
      danger: true,
      disabled: busy,
      hidden: !canEdit.value || !editable,
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

async function onActionSelect(key: string, row: Recojo) {
  const userId = authStore.user?.id
  if (key === 'resultado') {
    openResultado(row)
    return
  }
  if (key === 'en_ruta' && userId) {
    await updateMutation.mutateAsync({
      id: row.id,
      payload: { idUsuarioAuditoria: userId, estadoNombre: 'EN_RUTA' },
    })
    return
  }
  if (key === 'cancelar' && userId) {
    await updateMutation.mutateAsync({
      id: row.id,
      payload: { idUsuarioAuditoria: userId, estadoNombre: 'CANCELADO' },
    })
    return
  }
  if (key === 'delete') {
    recojoAEliminar.value = row
    deleteModalOpen.value = true
  }
}

async function confirmDelete() {
  const row = recojoAEliminar.value
  const userId = authStore.user?.id
  if (!row || !userId) return
  try {
    await deleteMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: userId })
    deleteModalOpen.value = false
    recojoAEliminar.value = null
  } catch {
    // toast en mutation
  }
}

function onSaved() {
  void recojosQuery.refetch()
}
</script>

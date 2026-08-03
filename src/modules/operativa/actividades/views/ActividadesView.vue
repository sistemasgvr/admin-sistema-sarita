<template>
  <div>
    <PageBreadcrumb page-title="Actividades" :items="breadcrumbItems" />

    <div class="mb-4">
      <AppListToolbar
        v-model:search="buscar"
        v-model:filters="dynamicFilters"
        :filter-fields="filterFields"
        search-placeholder="Buscar por título, cliente..."
        @filter-change="onFiltersChange"
      >
        <template #actions>
          <button
            v-if="canCreate"
            type="button"
            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreateModal()"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            Nueva actividad
          </button>
        </template>
      </AppListToolbar>
    </div>

    <AppTabs v-model="activeTab" :tabs="tabs" inline class="mb-4" />

    <div v-show="activeTab === 'lista'">
      <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoadingList">
        <template #cell-actividad="{ row }">
          <p class="truncate font-medium text-gray-800 dark:text-white/90">
            {{ row.titulo }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ row.razon_social_cliente ?? 'Sin cliente asignado' }}
          </p>
        </template>

        <template #cell-programacion="{ row }">
          <div class="flex flex-col gap-1">
            <AppBadge
              v-if="row.fecha_programada"
              size="sm"
              variant="light"
              color="primary"
              :icon="ICONS.calendar"
              title="Fecha programada"
            >
              {{ formatListDate(row.fecha_programada) }}
            </AppBadge>
            <AppBadge
              v-if="row.hora_inicio_estimada || row.hora_fin_estimada"
              size="sm"
              variant="light"
              color="neutral"
              :icon="ICONS.clock"
              title="Horario estimado"
            >
              {{ formatHoraRango(row.hora_inicio_estimada, row.hora_fin_estimada) }}
            </AppBadge>
            <span
              v-if="!row.fecha_programada && !row.hora_inicio_estimada && !row.hora_fin_estimada"
              class="text-gray-400"
            >
              —
            </span>
          </div>
        </template>

        <template #cell-prioridad="{ row }">
          <ListaOpcionBadge
            v-if="row.nombre_prioridad"
            :value="row.nombre_prioridad"
          />
          <span v-else class="text-gray-400">—</span>
        </template>

        <template #cell-estado="{ row }">
          <ListaOpcionBadge
            v-if="row.nombre_estado_actividad"
            :value="row.nombre_estado_actividad"
          />
          <span v-else class="text-gray-400">—</span>
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
            :meta="actividadesQuery.data.value?.meta"
            :disabled="isLoadingList"
          />
        </template>
      </AppTable>
    </div>

    <div v-show="activeTab === 'calendario'">
      <ActividadesCalendar
        :actividades="calendarRows"
        :loading="isLoadingCalendar"
        @select-date="onSelectDate"
        @select-actividad="openDetailModal"
        @range-change="onCalendarRangeChange"
      />
    </div>

    <ActividadFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :actividad="selectedActividad"
      :default-fecha="defaultFecha"
      @saved="onActividadSaved"
    />

    <ActividadDetailModal v-model="detailModalOpen" :actividad="actividadToView" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar actividad"
      subtitle="Esta acción desactivará la actividad en el sistema (baja lógica)."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar la actividad
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ actividadToDelete?.titulo ?? '' }}
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
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import ActividadDetailModal from '@/modules/operativa/actividades/components/ActividadDetailModal.vue'
import ActividadFormModal from '@/modules/operativa/actividades/components/ActividadFormModal.vue'
import ActividadesCalendar from '@/modules/operativa/actividades/components/ActividadesCalendar.vue'
import { useDeleteActividadMutation } from '@/modules/operativa/actividades/composables/useActividadMutations'
import { useActividadesQuery } from '@/modules/operativa/actividades/composables/useActividadesQuery'
import type {
  Actividad,
  ActividadFormMode,
  ActividadListFilters,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppBadge,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
  AppTabs,
  ListaOpcionBadge,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'
import type {
  DynamicFilterFieldDef,
  DynamicFilterValues,
} from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'
import { formatListDate } from '@/shared/utils/date'

const authStore = useAuthStore()

const breadcrumbItems: BreadcrumbItem[] = [
  { label: 'Operativa' },
  { label: 'Actividades' },
]

const route = useRoute()
const router = useRouter()

const tabs: AppTabItem[] = [
  { key: 'lista', label: 'Lista', icon: ICONS.list },
  { key: 'calendario', label: 'Calendario', icon: ICONS.calendar },
]

const resolveTab = (tab: LocationQueryValue | LocationQueryValue[]): 'lista' | 'calendario' => {
  const value = Array.isArray(tab) ? tab[0] : tab
  return value === 'calendario' ? 'calendario' : 'lista'
}

const activeTab = ref<'lista' | 'calendario'>(resolveTab(route.query.tab))

watch(activeTab, (tab) => {
  const wantsCalendario = tab === 'calendario'
  const hasCalendarioQuery = route.query.tab === 'calendario'
  if (wantsCalendario === hasCalendarioQuery) return
  if (wantsCalendario) {
    router.replace({ query: { ...route.query, tab: 'calendario' } })
    return
  }
  const { tab: _tab, ...rest } = route.query
  router.replace({ query: rest })
})

watch(
  () => route.query.tab,
  (tab) => {
    const resolved = resolveTab(tab)
    if (activeTab.value !== resolved) {
      activeTab.value = resolved
    }
  },
)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.ACTIVIDADES_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.ACTIVIDADES_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.ACTIVIDADES_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.ACTIVIDADES_ELIMINAR))

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})

const listaEstadoActividadId = computed(() => ListaIds.ESTADO_ACTIVIDAD)
const estadoActividadQuery = useListaOpcionesQuery(listaEstadoActividadId)

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idEstado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Todos los estados',
    disabled: estadoActividadQuery.isFetching.value,
    options: toSelectOptions(estadoActividadQuery.data.value),
  },
  { key: 'fechaDesde', label: 'Desde', type: 'date' },
  { key: 'fechaHasta', label: 'Hasta', type: 'date' },
])

const pagina = ref(1)
const limite = ref(10)

const listFilters = ref<ActividadListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const actividadesQuery = useActividadesQuery(
  listFilters,
  computed(() => activeTab.value === 'lista'),
)

const isLoadingList = computed(() => actividadesQuery.isFetching.value)
const rows = computed(() => actividadesQuery.data.value?.data ?? [])

const columns = computed<TableColumn<Actividad>[]>(() => [
  { key: 'actividad', label: 'Actividad' },
  { key: 'programacion', label: 'Programación' },
  { key: 'prioridad', label: 'Prioridad' },
  { key: 'estado', label: 'Estado' },
])

const formatHoraRango = (inicio?: string | null, fin?: string | null) => {
  const desde = inicio?.slice(0, 5)
  const hasta = fin?.slice(0, 5)
  if (desde && hasta) return `${desde} - ${hasta}`
  return desde || hasta || '—'
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

function parseOptionalId(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function parseOptionalDate(value: unknown): string | undefined {
  if (value == null || value === '') return undefined
  const text = String(value).trim()
  return text || undefined
}

function syncListFilters() {
  const active = dynamicFilters.value
  listFilters.value = {
    buscar: buscar.value.trim() || undefined,
    pagina: pagina.value,
    limite: limite.value,
    idEstado: parseOptionalId(active.idEstado),
    fechaDesde: parseOptionalDate(active.fechaDesde),
    fechaHasta: parseOptionalDate(active.fechaHasta),
  }
}

function syncCalendarSharedFilters() {
  calendarFilters.value = {
    ...calendarFilters.value,
    buscar: buscar.value.trim() || undefined,
    idEstado: parseOptionalId(dynamicFilters.value.idEstado),
  }
}

function onFiltersChange() {
  pagina.value = 1
  syncListFilters()
  syncCalendarSharedFilters()
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncListFilters()
    syncCalendarSharedFilters()
  }, 350)
})

watch([pagina, limite], () => {
  syncListFilters()
})

const calendarFilters = ref<ActividadListFilters>({
  pagina: 1,
  limite: 500,
})

const calendarQuery = useActividadesQuery(
  calendarFilters,
  computed(() => activeTab.value === 'calendario'),
)

const isLoadingCalendar = computed(() => calendarQuery.isFetching.value)
const calendarRows = computed(() => calendarQuery.data.value?.data ?? [])

const onCalendarRangeChange = (range: { fechaDesde: string; fechaHasta: string }) => {
  calendarFilters.value = {
    ...calendarFilters.value,
    buscar: buscar.value.trim() || undefined,
    idEstado: parseOptionalId(dynamicFilters.value.idEstado),
    fechaDesde: range.fechaDesde,
    fechaHasta: range.fechaHasta,
  }
}

const deleteMutation = useDeleteActividadMutation()

const formModalOpen = ref(false)
const formMode = ref<ActividadFormMode>('create')
const selectedActividad = ref<Actividad | null>(null)
const defaultFecha = ref<string | null>(null)

const detailModalOpen = ref(false)
const actividadToView = ref<Actividad | null>(null)

const deleteModalOpen = ref(false)
const actividadToDelete = ref<Actividad | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)

function actionItemsForRow(_row: Actividad): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value
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
      label: 'Eliminar',
      icon: ICONS.trash,
      danger: true,
      disabled: busy,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: Actividad) {
  if (key === 'edit') openEditModal(row)
  if (key === 'delete') openDeleteModal(row)
}

const openCreateModal = (fecha?: string) => {
  formMode.value = 'create'
  selectedActividad.value = null
  defaultFecha.value = fecha ?? null
  formModalOpen.value = true
}

const openEditModal = (actividad: Actividad) => {
  formMode.value = 'edit'
  selectedActividad.value = actividad
  defaultFecha.value = null
  formModalOpen.value = true
}

const openDetailModal = (actividad: Actividad) => {
  actividadToView.value = actividad
  detailModalOpen.value = true
}

const openDeleteModal = (actividad: Actividad) => {
  actividadToDelete.value = actividad
  deleteModalOpen.value = true
}

const onSelectDate = (fecha: string) => {
  if (!canCreate.value) return
  openCreateModal(fecha)
}

const confirmDelete = async () => {
  if (!actividadToDelete.value || !currentUserId.value) return

  try {
    await deleteMutation.mutateAsync({
      id: actividadToDelete.value.id,
      idUsuarioAuditoria: currentUserId.value,
    })
    deleteModalOpen.value = false
    actividadToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onActividadSaved = () => {
  selectedActividad.value = null
}
</script>

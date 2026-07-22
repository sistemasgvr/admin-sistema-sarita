<template>
  <div>
    <PageBreadcrumb page-title="Actividades" :items="breadcrumbItems" />

    <div class="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
          <div class="sm:col-span-2 lg:w-72">
            <AppInput
              v-model="buscar"
              type="search"
              label="Buscar"
              placeholder="Buscar por título, cliente..."
            />
          </div>

          <div class="lg:w-48">
            <AppSelect
              v-model="idEstadoFiltro"
              label="Estado"
              placeholder="Todos los estados"
              :options="estadoFiltroOptions"
            />
          </div>

          <div>
            <AppInput v-model="fechaDesde" type="date" label="Desde" />
          </div>

          <div>
            <AppInput v-model="fechaHasta" type="date" label="Hasta" />
          </div>
        </div>

        <button
          v-if="canCreate"
          type="button"
          class="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 sm:w-auto"
          @click="openCreateModal()"
        >
          <AppIcon :name="ICONS.plus" :size="18" />
          Nueva actividad
        </button>
      </div>
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
          <p class="text-sm text-gray-700 dark:text-gray-300">
            {{ formatListDate(row.fecha_programada) }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ row.hora_inicio_estimada?.slice(0, 5) }} - {{ row.hora_fin_estimada?.slice(0, 5) }}
          </p>
        </template>

        <template #cell-prioridad="{ row }">
          <AppBadge v-if="row.nombre_prioridad" color="warning">
            {{ row.nombre_prioridad }}
          </AppBadge>
          <span v-else>—</span>
        </template>

        <template #cell-estado="{ row }">
          <AppBadge v-if="row.nombre_estado_actividad" color="primary">
            {{ row.nombre_estado_actividad }}
          </AppBadge>
          <span v-else>—</span>
        </template>

        <template #actions="{ row }">
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            @click="openDetailModal(row)"
          >
            <AppIcon :name="ICONS.eye" :size="16" />
          </button>

          <button
            v-if="canEdit"
            type="button"
            class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
            @click="openEditModal(row)"
          >
            <AppIcon :name="ICONS.pencil" :size="16" />
          </button>

          <button
            v-if="canDelete"
            type="button"
            class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
            @click="openDeleteModal(row)"
          >
            <AppIcon :name="ICONS.trash" :size="16" />
          </button>
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
  AppBadge,
  AppInput,
  AppModal,
  AppPagination,
  AppSelect,
  AppTable,
  AppTabs,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'
import { formatListDate } from '@/shared/utils/date'

const authStore = useAuthStore()

const breadcrumbItems: BreadcrumbItem[] = [
  { label: 'Operativa' },
  { label: 'Actividades' },
]

const tabs: AppTabItem[] = [
  { key: 'lista', label: 'Lista', icon: ICONS.list },
  { key: 'calendario', label: 'Calendario', icon: ICONS.calendar },
]
const activeTab = ref<'lista' | 'calendario'>('lista')

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.ACTIVIDADES_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.ACTIVIDADES_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.ACTIVIDADES_ELIMINAR))

// --- Filtros compartidos entre la vista de lista y de calendario ---
const buscar = ref('')
const idEstadoFiltro = ref<string | number>('')
const fechaDesde = ref('')
const fechaHasta = ref('')

const listaEstadoActividadId = computed(() => ListaIds.ESTADO_ACTIVIDAD)
const estadoActividadQuery = useListaOpcionesQuery(listaEstadoActividadId)
const estadoFiltroOptions = computed<SelectOption[]>(() => [
  { label: 'Todos', value: '' },
  ...toSelectOptions(estadoActividadQuery.data.value),
])

// --- Vista de lista (paginada) ---
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

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

watch(buscar, (value) => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    listFilters.value = { ...listFilters.value, buscar: value.trim(), pagina: 1 }
  }, 350)
})

watch(idEstadoFiltro, (value) => {
  pagina.value = 1
  listFilters.value = {
    ...listFilters.value,
    idEstado: value ? Number(value) : undefined,
    pagina: 1,
  }
})

watch([fechaDesde, fechaHasta], ([desde, hasta]) => {
  pagina.value = 1
  listFilters.value = {
    ...listFilters.value,
    fechaDesde: desde || undefined,
    fechaHasta: hasta || undefined,
    pagina: 1,
  }
})

watch([pagina, limite], () => {
  listFilters.value = { ...listFilters.value, pagina: pagina.value, limite: limite.value }
})

// --- Vista de calendario (por rango de fechas visible) ---
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
    idEstado: idEstadoFiltro.value ? Number(idEstadoFiltro.value) : undefined,
    fechaDesde: range.fechaDesde,
    fechaHasta: range.fechaHasta,
  }
}

watch([buscar, idEstadoFiltro], () => {
  calendarFilters.value = {
    ...calendarFilters.value,
    buscar: buscar.value.trim() || undefined,
    idEstado: idEstadoFiltro.value ? Number(idEstadoFiltro.value) : undefined,
  }
})

// --- Modales compartidos (crear, editar, ver, eliminar) ---
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

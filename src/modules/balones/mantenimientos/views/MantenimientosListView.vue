<template>
  <div>
    <PageBreadcrumb page-title="Mantenimientos" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <div class="flex flex-col gap-4">
          <div v-if="canCreate" class="flex justify-end">
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="openCreateModal"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nuevo mantenimiento
            </button>
          </div>

          <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div class="sm:col-span-2 lg:col-span-1">
              <AppInput
                v-model="buscar"
                label="Buscar"
                type="search"
                placeholder="Cilindro o descripción..."
              />
            </div>

            <AppSelect
              v-model="idBalonFiltro"
              label="Cilindro"
              placeholder="Todos"
              :options="balonFilterOptions"
              :disabled="balonesQuery.isLoading.value"
            />

            <AppSelect
              v-model="idTipoMantenimientoFiltro"
              label="Tipo"
              placeholder="Todos"
              :options="tipoMantenimientoFilterOptions"
              :disabled="tiposMantenimientoQuery.isFetching.value"
            />

            <AppSelect
              v-model="idEstadoFiltro"
              label="Estado"
              placeholder="Todos"
              :options="estadoMantenimientoFilterOptions"
              :disabled="estadosMantenimientoQuery.isFetching.value"
            />

            <AppSelect
              v-model="esExternoFiltro"
              label="Externo"
              placeholder="Todos"
              :options="esExternoFilterOptions"
            />
          </div>
        </div>
      </template>

      <template #cell-codigo_balon="{ value }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ value }}</p>
      </template>

      <template #cell-nombre_tipo_mantenimiento="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-fecha_ingreso="{ value }">
        <span class="whitespace-nowrap">{{ formatCellDate(value as string) }}</span>
      </template>

      <template #cell-fecha_salida="{ value }">
        <span class="whitespace-nowrap">{{ formatCellDate(value as string) }}</span>
      </template>

      <template #cell-costo="{ value }">
        <span v-if="value != null">{{ formatMoney(value as number) }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-es_externo="{ value }">
        <span
          class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
          :class="
            value
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
              : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
          "
        >
          {{ value ? 'Externo' : 'Interno' }}
        </span>
      </template>

      <template #cell-nombre_estado="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #actions="{ row }">
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
          v-if="canDelete"
          type="button"
          title="Eliminar"
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
          :meta="mantenimientosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <MantenimientoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :mantenimiento-id="selectedMantenimientoId"
      @saved="onMantenimientoSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar mantenimiento"
      subtitle="Esta acción dará de baja el registro de mantenimiento."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el mantenimiento del cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ mantenimientoToDelete?.codigo_balon }}
        </span>
        con ingreso el
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ formatCellDate(mantenimientoToDelete?.fecha_ingreso) }}
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
import MantenimientoFormModal from '@/modules/balones/mantenimientos/components/MantenimientoFormModal.vue'
import { useDeleteMantenimientoMutation } from '@/modules/balones/mantenimientos/composables/useMantenimientoMutations'
import { useMantenimientosQuery } from '@/modules/balones/mantenimientos/composables/useMantenimientosQuery'
import type {
  Mantenimiento,
  MantenimientoFormMode,
  MantenimientoListFilters,
} from '@/modules/balones/mantenimientos/interfaces/mantenimiento.interface'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppPagination, AppSelect, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const idBalonFiltro = ref<number | ''>('')
const idTipoMantenimientoFiltro = ref<number | ''>('')
const idEstadoFiltro = ref<number | ''>('')
const esExternoFiltro = ref<'' | 'true' | 'false'>('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<MantenimientoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const mantenimientosQuery = useMantenimientosQuery(filters)

const balonesFilters = ref({ pagina: 1, limite: 200 })
const balonesQuery = useBalonesQuery(balonesFilters)

const listaTipoMantenimientoId = ref(ListaIds.TIPO_MANTENIMIENTO)
const listaEstadoMantenimientoId = ref(ListaIds.ESTADO_MANTENIMIENTO)
const tiposMantenimientoQuery = useListaOpcionesQuery(listaTipoMantenimientoId)
const estadosMantenimientoQuery = useListaOpcionesQuery(listaEstadoMantenimientoId)

const formModalOpen = ref(false)
const formMode = ref<MantenimientoFormMode>('create')
const selectedMantenimientoId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const mantenimientoToDelete = ref<Mantenimiento | null>(null)
const deleteMutation = useDeleteMantenimientoMutation()

const breadcrumbItems = balonesBreadcrumbItems('Mantenimientos')

const canCreate = computed(() =>
  authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_CREAR),
)
const canEdit = computed(() =>
  authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_EDITAR),
)
const canDelete = computed(() =>
  authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_ELIMINAR),
)

const isLoading = computed(
  () => mantenimientosQuery.isFetching.value || mantenimientosQuery.isLoading.value,
)

const rows = computed(() => mantenimientosQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'nombre_tipo_mantenimiento', label: 'Tipo' },
  { key: 'fecha_ingreso', label: 'Ingreso' },
  { key: 'fecha_salida', label: 'Salida' },
  { key: 'costo', label: 'Costo' },
  { key: 'es_externo', label: 'Origen' },
  { key: 'nombre_estado', label: 'Estado' },
]

const allOption = (): SelectOption => ({ value: '', label: 'Todos' })

const balonFilterOptions = computed(() => [
  allOption(),
  ...(balonesQuery.data.value?.data ?? []).map((balon) => ({
    value: balon.id,
    label: balon.codigo_balon,
  })),
])

const tipoMantenimientoFilterOptions = computed(() => [
  allOption(),
  ...toSelectOptions(tiposMantenimientoQuery.data.value),
])

const estadoMantenimientoFilterOptions = computed(() => [
  allOption(),
  ...toSelectOptions(estadosMantenimientoQuery.data.value),
])

const esExternoFilterOptions: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Externo' },
  { value: 'false', label: 'Interno' },
]

const formatCellDate = (value?: string | null) => {
  if (!value) return '—'
  const date = value.slice(0, 10)
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return date
  return `${day}/${month}/${year}`
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idBalon: idBalonFiltro.value === '' ? undefined : Number(idBalonFiltro.value),
    idTipoMantenimiento:
      idTipoMantenimientoFiltro.value === '' ? undefined : Number(idTipoMantenimientoFiltro.value),
    idEstado: idEstadoFiltro.value === '' ? undefined : Number(idEstadoFiltro.value),
    esExterno:
      esExternoFiltro.value === '' ? undefined : esExternoFiltro.value === 'true',
  }
}

watch([buscar, idBalonFiltro, idTipoMantenimientoFiltro, idEstadoFiltro, esExternoFiltro], () => {
  pagina.value = 1
  syncFilters()
})

watch([pagina, limite], () => {
  syncFilters()
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedMantenimientoId.value = null
  formModalOpen.value = true
}

const openEditModal = (row: Mantenimiento) => {
  formMode.value = 'edit'
  selectedMantenimientoId.value = row.id
  formModalOpen.value = true
}

const openDeleteModal = (row: Mantenimiento) => {
  mantenimientoToDelete.value = row
  deleteModalOpen.value = true
}

const onMantenimientoSaved = () => {
  mantenimientosQuery.refetch()
}

const confirmDelete = async () => {
  const mantenimiento = mantenimientoToDelete.value
  const userId = authStore.user?.id
  if (!mantenimiento || !userId) return

  try {
    await deleteMutation.mutateAsync({
      id: mantenimiento.id,
      idUsuarioAuditoria: userId,
    })
    deleteModalOpen.value = false
    mantenimientoToDelete.value = null
  } catch {
    // toast en mutation
  }
}
</script>

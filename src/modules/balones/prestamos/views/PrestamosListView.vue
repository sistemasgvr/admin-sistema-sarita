<template>
  <div>
    <PageBreadcrumb page-title="Préstamos" :items="breadcrumbItems" />

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
              Nuevo préstamo
            </button>
          </div>

          <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div class="sm:col-span-2 lg:col-span-1">
              <AppInput
                v-model="buscar"
                label="Buscar"
                type="search"
                placeholder="Número o título..."
              />
            </div>

            <AppSelect
              v-model="idTipoPrestamoFiltro"
              label="Tipo"
              placeholder="Todos"
              :options="tipoPrestamoFilterOptions"
              :disabled="tiposPrestamoQuery.isFetching.value"
            />

            <AppSelect
              v-model="idClienteFiltro"
              label="Cliente"
              placeholder="Todos"
              :options="clienteFilterOptions"
              :disabled="clientesQuery.isLoading.value"
            />

            <AppSelect
              v-model="idEstadoFiltro"
              label="Estado"
              placeholder="Todos"
              :options="estadoPrestamoFilterOptions"
              :disabled="estadosPrestamoQuery.isFetching.value"
            />
          </div>
        </div>
      </template>

      <template #cell-numero_prestamo="{ value }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ value || '—' }}
        </p>
      </template>

      <template #cell-nombre_tipo_prestamo="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-nombre_cliente="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-fecha_salida="{ value }">
        <span class="whitespace-nowrap">{{ formatCellDate(value as string) }}</span>
      </template>

      <template #cell-fecha_retorno_pactada="{ value }">
        <span class="whitespace-nowrap">{{ formatCellDate(value as string) }}</span>
      </template>

      <template #cell-nombre_estado="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-total_detalles="{ value }">
        <span class="inline-flex min-w-8 items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300">
          {{ value ?? 0 }}
        </span>
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
          :meta="prestamosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <PrestamoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :prestamo-id="selectedPrestamoId"
      @saved="onPrestamoSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar préstamo"
      subtitle="Esta acción dará de baja el préstamo y sus referencias."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el préstamo
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ prestamoToDelete?.numero_prestamo || prestamoToDelete?.titulo || `#${prestamoToDelete?.id}` }}
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
import PrestamoFormModal from '@/modules/balones/prestamos/components/PrestamoFormModal.vue'
import { useDeletePrestamoMutation } from '@/modules/balones/prestamos/composables/usePrestamoMutations'
import { usePrestamosQuery } from '@/modules/balones/prestamos/composables/usePrestamosQuery'
import type {
  Prestamo,
  PrestamoFormMode,
  PrestamoListFilters,
} from '@/modules/balones/prestamos/interfaces/prestamo.interface'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
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
const idTipoPrestamoFiltro = ref<number | ''>('')
const idClienteFiltro = ref<number | ''>('')
const idEstadoFiltro = ref<number | ''>('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<PrestamoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const prestamosQuery = usePrestamosQuery(filters)

const listaTipoPrestamoId = ref(ListaIds.TIPO_PRESTAMO)
const listaEstadoPrestamoId = ref(ListaIds.ESTADO_PRESTAMO)
const tiposPrestamoQuery = useListaOpcionesQuery(listaTipoPrestamoId)
const estadosPrestamoQuery = useListaOpcionesQuery(listaEstadoPrestamoId)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const formModalOpen = ref(false)
const formMode = ref<PrestamoFormMode>('create')
const selectedPrestamoId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const prestamoToDelete = ref<Prestamo | null>(null)
const deleteMutation = useDeletePrestamoMutation()

const breadcrumbItems = balonesBreadcrumbItems('Préstamos')

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_ELIMINAR))

const isLoading = computed(
  () => prestamosQuery.isFetching.value || prestamosQuery.isLoading.value,
)

const rows = computed(() => prestamosQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'numero_prestamo', label: 'Número' },
  { key: 'nombre_tipo_prestamo', label: 'Tipo' },
  { key: 'titulo', label: 'Título' },
  { key: 'nombre_cliente', label: 'Cliente' },
  { key: 'fecha_salida', label: 'Salida' },
  { key: 'fecha_retorno_pactada', label: 'Retorno pactado' },
  { key: 'nombre_estado', label: 'Estado' },
  { key: 'total_detalles', label: 'Cilindros' },
]

const allOption = (): SelectOption => ({ value: '', label: 'Todos' })

const tipoPrestamoFilterOptions = computed(() => [
  allOption(),
  ...toSelectOptions(tiposPrestamoQuery.data.value),
])

const estadoPrestamoFilterOptions = computed(() => [
  allOption(),
  ...toSelectOptions(estadosPrestamoQuery.data.value),
])

const clienteFilterOptions = computed(() => [
  allOption(),
  ...(clientesQuery.data.value?.data ?? []).map((cliente) => ({
    value: cliente.id,
    label:
      cliente.razon_social ||
      [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
      cliente.numero_documento,
  })),
])

const formatCellDate = (value?: string | null) => {
  if (!value) return '—'
  const date = value.slice(0, 10)
  const [year, month, day] = date.split('-')
  if (!year || !month || !day) return date
  return `${day}/${month}/${year}`
}

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idTipoPrestamo:
      idTipoPrestamoFiltro.value === '' ? undefined : Number(idTipoPrestamoFiltro.value),
    idCliente: idClienteFiltro.value === '' ? undefined : Number(idClienteFiltro.value),
    idEstado: idEstadoFiltro.value === '' ? undefined : Number(idEstadoFiltro.value),
  }
}

watch([buscar, idTipoPrestamoFiltro, idClienteFiltro, idEstadoFiltro], () => {
  pagina.value = 1
  syncFilters()
})

watch([pagina, limite], () => {
  syncFilters()
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedPrestamoId.value = null
  formModalOpen.value = true
}

const openEditModal = (row: Prestamo) => {
  formMode.value = 'edit'
  selectedPrestamoId.value = row.id
  formModalOpen.value = true
}

const openDeleteModal = (row: Prestamo) => {
  prestamoToDelete.value = row
  deleteModalOpen.value = true
}

const onPrestamoSaved = () => {
  prestamosQuery.refetch()
}

const confirmDelete = async () => {
  const prestamo = prestamoToDelete.value
  const userId = authStore.user?.id
  if (!prestamo || !userId) return

  try {
    await deleteMutation.mutateAsync({
      id: prestamo.id,
      idUsuarioAuditoria: userId,
    })
    deleteModalOpen.value = false
    prestamoToDelete.value = null
  } catch {
    // toast en mutation
  }
}
</script>

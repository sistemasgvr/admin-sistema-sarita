<template>
  <div>
    <PageBreadcrumb page-title="Alquileres" :items="breadcrumbItems" />

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
              Nuevo alquiler
            </button>
          </div>

          <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div class="sm:col-span-2 lg:col-span-1">
              <AppInput
                v-model="buscar"
                label="Buscar"
                type="search"
                placeholder="Número o observación..."
              />
            </div>

            <AppSelect
              v-model="idClienteFiltro"
              label="Cliente"
              placeholder="Todos"
              :options="clienteFilterOptions"
              :disabled="clientesQuery.isLoading.value"
            />

            <AppSelect
              v-model="idAlmacenFiltro"
              label="Almacén"
              placeholder="Todos"
              :options="almacenFilterOptions"
              :disabled="almacenesQuery.isLoading.value"
            />

            <AppSelect
              v-model="idEstadoFiltro"
              label="Estado"
              placeholder="Todos"
              :options="estadoAlquilerFilterOptions"
              :disabled="estadosAlquilerQuery.isFetching.value"
            />
          </div>
        </div>
      </template>

      <template #cell-numero_alquiler="{ value }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ value }}</p>
      </template>

      <template #cell-nombre_cliente="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-nombre_almacen="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-fecha_inicio="{ value }">
        <span class="whitespace-nowrap">{{ formatCellDate(value as string) }}</span>
      </template>

      <template #cell-fecha_fin_pactada="{ value }">
        <span class="whitespace-nowrap">{{ formatCellDate(value as string) }}</span>
      </template>

      <template #cell-tarifa_diaria="{ value }">
        <span v-if="value != null">{{ formatMoney(value as number) }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-nombre_estado="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-total_detalles="{ value }">
        <span
          class="inline-flex min-w-8 items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300"
        >
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
          :meta="alquileresQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <AlquilerFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :alquiler-id="selectedAlquilerId"
      @saved="onAlquilerSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar alquiler"
      subtitle="Esta acción dará de baja el alquiler y sus referencias."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el alquiler
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ alquilerToDelete?.numero_alquiler }}
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
import AlquilerFormModal from '@/modules/balones/alquileres/components/AlquilerFormModal.vue'
import { useDeleteAlquilerMutation } from '@/modules/balones/alquileres/composables/useAlquilerMutations'
import { useAlquileresQuery } from '@/modules/balones/alquileres/composables/useAlquileresQuery'
import type {
  Alquiler,
  AlquilerFormMode,
  AlquilerListFilters,
} from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
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
const idClienteFiltro = ref<number | ''>('')
const idAlmacenFiltro = ref<number | ''>('')
const idEstadoFiltro = ref<number | ''>('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<AlquilerListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const alquileresQuery = useAlquileresQuery(filters)

const listaEstadoAlquilerId = ref(ListaIds.ESTADO_ALQUILER)
const estadosAlquilerQuery = useListaOpcionesQuery(listaEstadoAlquilerId)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const formModalOpen = ref(false)
const formMode = ref<AlquilerFormMode>('create')
const selectedAlquilerId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const alquilerToDelete = ref<Alquiler | null>(null)
const deleteMutation = useDeleteAlquilerMutation()

const breadcrumbItems = balonesBreadcrumbItems('Alquileres')

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_ELIMINAR))

const isLoading = computed(
  () => alquileresQuery.isFetching.value || alquileresQuery.isLoading.value,
)

const rows = computed(() => alquileresQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'numero_alquiler', label: 'Número' },
  { key: 'nombre_cliente', label: 'Cliente' },
  { key: 'nombre_almacen', label: 'Almacén' },
  { key: 'fecha_inicio', label: 'Inicio' },
  { key: 'fecha_fin_pactada', label: 'Fin pactado' },
  { key: 'tarifa_diaria', label: 'Tarifa/día' },
  { key: 'nombre_estado', label: 'Estado' },
  { key: 'total_detalles', label: 'Cilindros' },
]

const allOption = (): SelectOption => ({ value: '', label: 'Todos' })

const estadoAlquilerFilterOptions = computed(() => [
  allOption(),
  ...toSelectOptions(estadosAlquilerQuery.data.value),
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

const almacenFilterOptions = computed(() => [
  allOption(),
  ...(almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
])

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
    idCliente: idClienteFiltro.value === '' ? undefined : Number(idClienteFiltro.value),
    idAlmacen: idAlmacenFiltro.value === '' ? undefined : Number(idAlmacenFiltro.value),
    idEstado: idEstadoFiltro.value === '' ? undefined : Number(idEstadoFiltro.value),
  }
}

watch([buscar, idClienteFiltro, idAlmacenFiltro, idEstadoFiltro], () => {
  pagina.value = 1
  syncFilters()
})

watch([pagina, limite], () => {
  syncFilters()
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedAlquilerId.value = null
  formModalOpen.value = true
}

const openEditModal = (row: Alquiler) => {
  formMode.value = 'edit'
  selectedAlquilerId.value = row.id
  formModalOpen.value = true
}

const openDeleteModal = (row: Alquiler) => {
  alquilerToDelete.value = row
  deleteModalOpen.value = true
}

const onAlquilerSaved = () => {
  alquileresQuery.refetch()
}

const confirmDelete = async () => {
  const alquiler = alquilerToDelete.value
  const userId = authStore.user?.id
  if (!alquiler || !userId) return

  try {
    await deleteMutation.mutateAsync({
      id: alquiler.id,
      idUsuarioAuditoria: userId,
    })
    deleteModalOpen.value = false
    alquilerToDelete.value = null
  } catch {
    // toast en mutation
  }
}
</script>

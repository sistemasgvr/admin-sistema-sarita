<template>
  <div>
    <PageBreadcrumb page-title="Recargas" :items="breadcrumbItems" />

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
              Nueva recarga
            </button>
          </div>

          <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div class="sm:col-span-2 lg:col-span-1">
              <AppInput
                v-model="buscar"
                label="Buscar"
                type="search"
                placeholder="Cilindro, GRE o factura..."
              />
            </div>

            <AppInput v-model="fechaDesde" label="Desde" type="date" />

            <AppInput v-model="fechaHasta" label="Hasta" type="date" />

            <AppSelect
              v-model="idBalonFiltro"
              label="Cilindro"
              placeholder="Todos"
              :options="balonFilterOptions"
              :disabled="balonesQuery.isLoading.value"
            />

            <AppSelect
              v-model="idAlmacenFiltro"
              label="Almacén"
              placeholder="Todos"
              :options="almacenFilterOptions"
              :disabled="almacenesQuery.isLoading.value"
            />
          </div>
        </div>
      </template>

      <template #cell-vigencia="{ row }">
        <DateRangeBadges
          :from="row.fecha_salida_almacen"
          :to="row.fecha_llegada_almacen"
        />
      </template>

      <template #cell-codigo_balon="{ value }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ value }}</p>
      </template>

      <template #cell-nombre_producto="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-documentos="{ row }">
        <div class="space-y-0.5 text-sm text-gray-600 dark:text-gray-400">
          <p class="whitespace-nowrap">
            GRE: {{ formatDocumento(row.serie_guia_salida, row.numero_guia_salida) }}
          </p>
          <p class="whitespace-nowrap">
            Fac: {{ formatDocumento(row.serie_factura, row.numero_factura) }}
          </p>
        </div>
      </template>

      <template #cell-nombre_almacen="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #actions="{ row }">
        <button
          v-if="canView"
          type="button"
          title="Ver"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetailModal(row)"
        >
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>

        <button
          v-if="canEdit"
          type="button"
          title="Editar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click="openEditModal(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
          <!-- Editar -->
        </button>

        <button
          v-if="canDelete"
          type="button"
          title="Eliminar"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openDeleteModal(row)"
        >
          <AppIcon :name="ICONS.trash" :size="16" />
          <!-- Eliminar -->
        </button>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="recargasQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <MovimientoRecargaFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :recarga-id="selectedRecargaId"
      @saved="onRecargaSaved"
    />

    <MovimientoRecargaDetailModal
      v-model="detailModalOpen"
      :recarga-id="recargaToViewId"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar recarga"
      subtitle="Esta acción dará de baja el registro de recarga."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar la recarga del cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ recargaToDelete?.codigo_balon }}
        </span>
        con salida el
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ formatListDate(recargaToDelete?.fecha_salida_almacen) }}
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
import MovimientoRecargaFormModal from '@/modules/balones/recargas/components/MovimientoRecargaFormModal.vue'
import MovimientoRecargaDetailModal from '@/modules/balones/recargas/components/MovimientoRecargaDetailModal.vue'
import DateRangeBadges from '@/modules/balones/components/DateRangeBadges.vue'
import { useDeleteMovimientoRecargaMutation } from '@/modules/balones/recargas/composables/useMovimientoRecargaMutations'
import { useMovimientosRecargaQuery } from '@/modules/balones/recargas/composables/useMovimientosRecargaQuery'
import type {
  MovimientoRecarga,
  MovimientoRecargaFormMode,
  MovimientoRecargaListFilters,
} from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppPagination, AppSelect, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatListDate } from '@/shared/utils/date'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const fechaDesde = ref('')
const fechaHasta = ref('')
const idBalonFiltro = ref<number | ''>('')
const idAlmacenFiltro = ref<number | ''>('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<MovimientoRecargaListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const recargasQuery = useMovimientosRecargaQuery(filters)

const balonesFilters = ref({ pagina: 1, limite: 200 })
const balonesQuery = useBalonesQuery(balonesFilters)

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const formModalOpen = ref(false)
const formMode = ref<MovimientoRecargaFormMode>('create')
const selectedRecargaId = ref<number | null>(null)

const detailModalOpen = ref(false)
const recargaToViewId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const recargaToDelete = ref<MovimientoRecarga | null>(null)
const deleteMutation = useDeleteMovimientoRecargaMutation()

const breadcrumbItems = balonesBreadcrumbItems('Recargas')

const canCreate = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR),
)
const canView = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_VER),
)
const canEdit = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_EDITAR),
)
const canDelete = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_ELIMINAR),
)

const isLoading = computed(
  () => recargasQuery.isFetching.value || recargasQuery.isLoading.value,
)

const rows = computed(() => recargasQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'vigencia', label: 'Salida / Llegada' },
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'nombre_producto', label: 'Gas' },
  { key: 'documentos', label: 'GRE / Factura' },
  { key: 'nombre_almacen', label: 'Almacén' },
]

const allOption = (): SelectOption => ({ value: '', label: 'Todos' })

const balonFilterOptions = computed(() => [
  allOption(),
  ...(balonesQuery.data.value?.data ?? []).map((balon) => ({
    value: balon.id,
    label: balon.codigo_balon,
  })),
])

const almacenFilterOptions = computed(() => [
  allOption(),
  ...(almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
])

const formatDocumento = (serie?: string | null, numero?: string | null) => {
  if (!serie && !numero) return '—'
  if (serie && numero) return `${serie}-${numero}`
  return serie || numero || '—'
}

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    fechaDesde: fechaDesde.value || undefined,
    fechaHasta: fechaHasta.value || undefined,
    idBalon: idBalonFiltro.value === '' ? undefined : Number(idBalonFiltro.value),
    idAlmacen: idAlmacenFiltro.value === '' ? undefined : Number(idAlmacenFiltro.value),
  }
}

watch([buscar, fechaDesde, fechaHasta, idBalonFiltro, idAlmacenFiltro], () => {
  pagina.value = 1
  syncFilters()
})

watch([pagina, limite], () => {
  syncFilters()
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedRecargaId.value = null
  formModalOpen.value = true
}

const openEditModal = (row: MovimientoRecarga) => {
  formMode.value = 'edit'
  selectedRecargaId.value = row.id
  formModalOpen.value = true
}

const openDetailModal = (row: MovimientoRecarga) => {
  recargaToViewId.value = row.id
  detailModalOpen.value = true
}

const openDeleteModal = (row: MovimientoRecarga) => {
  recargaToDelete.value = row
  deleteModalOpen.value = true
}

const onRecargaSaved = () => {
  recargasQuery.refetch()
}

const confirmDelete = async () => {
  const recarga = recargaToDelete.value
  const userId = authStore.user?.id
  if (!recarga || !userId) return

  try {
    await deleteMutation.mutateAsync({
      id: recarga.id,
      idUsuarioAuditoria: userId,
    })
    deleteModalOpen.value = false
    recargaToDelete.value = null
  } catch {
    // toast en mutation
  }
}
</script>

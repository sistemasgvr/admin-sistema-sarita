<template>
  <div>
    <PageBreadcrumb
      v-if="!embedded"
      page-title="Libro de cilindros"
      :items="breadcrumbItems"
    />

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
              Nuevo cilindro
            </button>
          </div>

          <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div class="sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <AppInput
                v-model="buscar"
                label="Buscar"
                type="search"
                placeholder="Código, libro, tipo..."
              />
            </div>

            <AppSelect
              v-model="idTipoBalonFiltro"
              label="Tipo"
              placeholder="Todos"
              :options="tipoBalonFilterOptions"
              :disabled="tiposBalonQuery.isLoading.value"
            />

            <AppSelect
              v-model="idMarcaCilindroFiltro"
              label="Marca"
              placeholder="Todas"
              :options="marcaFilterOptions"
              :disabled="marcaQuery.isLoading.value"
            />

            <AppSelect
              v-model="idAlmacenFiltro"
              label="Almacén"
              placeholder="Todos"
              :options="almacenFilterOptions"
              :disabled="almacenesQuery.isLoading.value"
            />

            <AppSelect
              v-model="idEstadoBalonFiltro"
              label="Estado"
              placeholder="Todos"
              :options="estadoBalonFilterOptions"
              :disabled="estadoBalonQuery.isLoading.value"
            />

            <AppSelect
              v-model="phPorVencerDiasFiltro"
              label="PH por vencer"
              placeholder="Todos"
              :options="phPorVencerOptions"
            />

            <div class="flex items-end pb-2">
              <AppCheckbox v-model="phVencidaFiltro" label="Solo PH vencida" />
            </div>
          </div>
        </div>
      </template>

      <template #cell-codigo_balon="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ row.codigo_balon }}
        </p>
        <p v-if="row.libro_cilindro" class="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">
          {{ row.libro_cilindro }}<span v-if="row.pagina_libro"> — pág. {{ row.pagina_libro }}</span>
        </p>
      </template>

      <template #cell-nombre_marca_cilindro="{ value }">
        <span v-if="value" class="whitespace-nowrap">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-nombre_estado_balon="{ row }">
        <BalonEstadoBadge :balon="row" />
      </template>

      <template #cell-fecha_proxima_prueba_hidrostatica="{ row, value }">
        <div class="flex flex-col gap-1">
          <span class="whitespace-nowrap">{{ formatCellDate(value) }}</span>
          <AppBadge v-if="row.estado_ph" size="sm" :color="phBadgeColor(row.estado_ph)">
            PH {{ phBadgeLabel(row.estado_ph) }}
          </AppBadge>
        </div>
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
          <!-- Ver -->
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
          v-if="canEdit && puedeDarDeBaja(row)"
          type="button"
          title="Solicitar baja"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
          @click="openBajaModal(row)"
        >
          <AppIcon :name="ICONS.archive" :size="16" />
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
          :meta="balonesQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <BalonFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :balon-id="selectedBalonId"
      @saved="onBalonSaved"
    />

    <BalonDetailModal v-model="detailModalOpen" :balon-id="balonToViewId" />

    <BalonBajaModal
      v-model="bajaModalOpen"
      :balon-id="balonToBajaId"
      @saved="onBalonBajaSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar cilindro"
      subtitle="Esta acción dará de baja el registro del libro de cilindros."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ balonToDelete?.codigo_balon }}
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
import BalonBajaModal from '@/modules/balones/cilindros/components/BalonBajaModal.vue'
import BalonDetailModal from '@/modules/balones/cilindros/components/BalonDetailModal.vue'
import BalonFormModal from '@/modules/balones/cilindros/components/BalonFormModal.vue'
import { useDeleteBalonMutation } from '@/modules/balones/cilindros/composables/useBalonMutations'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import type {
  Balon,
  BalonFormMode,
  BalonListFilters,
  EstadoPh,
} from '@/modules/balones/cilindros/interfaces/balon.interface'
import { useTiposBalonQuery } from '@/modules/balones/tipos-balon/composables/useTiposBalonQuery'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppCheckbox, AppInput, AppModal, AppPagination, AppSelect, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import BalonEstadoBadge from '@/modules/balones/components/BalonEstadoBadge.vue'

withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false,
  },
)

const authStore = useAuthStore()

const buscar = ref('')
const idTipoBalonFiltro = ref<number | ''>('')
const idMarcaCilindroFiltro = ref<number | ''>('')
const idAlmacenFiltro = ref<number | ''>('')
const idEstadoBalonFiltro = ref<number | ''>('')
const phVencidaFiltro = ref(false)
const phPorVencerDiasFiltro = ref<number | ''>('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<BalonListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const balonesQuery = useBalonesQuery(filters)
const deleteMutation = useDeleteBalonMutation()

const tiposBalonFilters = ref({ pagina: 1, limite: 200 })
const tiposBalonQuery = useTiposBalonQuery(tiposBalonFilters)

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const listaEstadoBalonId = ref(ListaIds.ESTADO_BALON)
const listaMarcaId = ref(ListaIds.MARCA_CILINDRO)
const estadoBalonQuery = useListaOpcionesQuery(listaEstadoBalonId)
const marcaQuery = useListaOpcionesQuery(listaMarcaId)

const formModalOpen = ref(false)
const formMode = ref<BalonFormMode>('create')
const selectedBalonId = ref<number | null>(null)

const detailModalOpen = ref(false)
const balonToViewId = ref<number | null>(null)

const deleteModalOpen = ref(false)
const balonToDelete = ref<Balon | null>(null)

const bajaModalOpen = ref(false)
const balonToBajaId = ref<number | null>(null)

const breadcrumbItems = computed(() => balonesBreadcrumbItems('Libro de cilindros'))

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.BALONES_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.BALONES_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.BALONES_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.BALONES_ELIMINAR))

const isLoading = computed(() => balonesQuery.isFetching.value)
const rows = computed(() => balonesQuery.data.value?.data ?? [])

const formatCellDate = (value: unknown) =>
  typeof value === 'string' && value ? value.slice(0, 10) : '—'

const phBadgeLabel = (estado: EstadoPh) => {
  if (estado === 'VENCIDA') return 'vencida'
  if (estado === 'POR_VENCER') return 'por vencer'
  return 'vigente'
}

const phBadgeColor = (estado: EstadoPh): BadgeColor => {
  if (estado === 'VENCIDA') return 'error'
  if (estado === 'POR_VENCER') return 'warning'
  return 'success'
}

const puedeDarDeBaja = (balon: Balon) =>
  balon.estado === 1 &&
  !balon.baja &&
  !balon.tiene_solicitud_baja_pendiente &&
  balon.nombre_estado_balon?.toUpperCase() !== 'DADO_DE_BAJA'

const phPorVencerOptions: SelectOption[] = [
  { label: 'Todos', value: '' },
  { label: '30 días', value: 30 },
  { label: '60 días', value: 60 },
  { label: '90 días', value: 90 },
]

const withAllOption = (options: SelectOption[]): SelectOption[] => [
  { label: 'Todos', value: '' },
  ...options,
]

const tipoBalonFilterOptions = computed(() =>
  withAllOption(
    (tiposBalonQuery.data.value?.data ?? []).map((tipo) => ({
      label: tipo.nombre,
      value: tipo.id,
    })),
  ),
)

const almacenFilterOptions = computed(() =>
  withAllOption(
    (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
      label: almacen.nombre,
      value: almacen.id,
    })),
  ),
)

const estadoBalonFilterOptions = computed(() =>
  withAllOption(toSelectOptions(estadoBalonQuery.data.value)),
)

const marcaFilterOptions = computed(() =>
  withAllOption(toSelectOptions(marcaQuery.data.value)),
)

const columns = computed<TableColumn<Balon>[]>(() => [
  { key: 'codigo_balon', label: 'Código / Libro' },
  { key: 'nombre_tipo_balon', label: 'Tipo' },
  { key: 'nombre_marca_cilindro', label: 'Marca', cellClass: 'whitespace-nowrap' },
  { key: 'nombre_estado_balon', label: 'Estado', cellClass: 'whitespace-nowrap' },
  { key: 'nombre_almacen', label: 'Almacén' },
  { key: 'nombre_producto_gas', label: 'Gas' },
  {
    key: 'fecha_proxima_prueba_hidrostatica',
    label: 'Próx. P.H.',
    cellClass: 'whitespace-nowrap',
  },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idTipoBalon: idTipoBalonFiltro.value ? Number(idTipoBalonFiltro.value) : undefined,
    idMarcaCilindro: idMarcaCilindroFiltro.value ? Number(idMarcaCilindroFiltro.value) : undefined,
    idAlmacen: idAlmacenFiltro.value ? Number(idAlmacenFiltro.value) : undefined,
    idEstadoBalon: idEstadoBalonFiltro.value ? Number(idEstadoBalonFiltro.value) : undefined,
    phVencida: phVencidaFiltro.value || undefined,
    phPorVencerDias: phPorVencerDiasFiltro.value
      ? Number(phPorVencerDiasFiltro.value)
      : undefined,
  }
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncFilters()
  }, 350)
})

watch(
  [idTipoBalonFiltro, idMarcaCilindroFiltro, idAlmacenFiltro, idEstadoBalonFiltro, phVencidaFiltro, phPorVencerDiasFiltro],
  () => {
    pagina.value = 1
    syncFilters()
  },
)

watch([pagina, limite], () => {
  syncFilters()
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedBalonId.value = null
  formModalOpen.value = true
}

const openEditModal = (balon: Balon) => {
  formMode.value = 'edit'
  selectedBalonId.value = balon.id
  formModalOpen.value = true
}

const openDetailModal = (balon: Balon) => {
  balonToViewId.value = balon.id
  detailModalOpen.value = true
}

const openDeleteModal = (balon: Balon) => {
  balonToDelete.value = balon
  deleteModalOpen.value = true
}

const openBajaModal = (balon: Balon) => {
  balonToBajaId.value = balon.id
  bajaModalOpen.value = true
}

const onBalonBajaSaved = () => {
  balonToBajaId.value = null
}

const confirmDelete = async () => {
  const currentUserId = authStore.user?.id
  if (!balonToDelete.value || !currentUserId) return

  try {
    await deleteMutation.mutateAsync({
      id: balonToDelete.value.id,
      idUsuarioAuditoria: currentUserId,
    })
    deleteModalOpen.value = false
    balonToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onBalonSaved = () => {
  selectedBalonId.value = null
}
</script>

<template>
  <div>
    <PageBreadcrumb
      v-if="!embedded"
      page-title="Libro de cilindros"
      :items="breadcrumbItems"
    />

    <div
      v-if="phAlertCount > 0 || phVencidaCount > 0"
      class="mb-4 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="space-y-1">
        <p v-if="phAlertCount > 0" class="font-medium">
          {{ phAlertCount }} cilindro(s) con P.H. por vencer en ~3 meses
        </p>
        <p v-if="phVencidaCount > 0">
          {{ phVencidaCount }} cilindro(s) con P.H. vencida
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="phAlertCount > 0"
          type="button"
          class="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-500/10"
          @click="aplicarAlertaPh(90)"
        >
          Ver por vencer
        </button>
        <button
          v-if="phVencidaCount > 0"
          type="button"
          class="rounded-lg border border-error-300 bg-white px-3 py-1.5 text-xs font-medium text-error-700 hover:bg-error-50 dark:border-error-500/40 dark:bg-transparent dark:text-error-300"
          @click="aplicarPhVencida"
        >
          Ver vencidas
        </button>
      </div>
    </div>

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Código, libro, tipo..."
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
              Nuevo
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-codigo_balon="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ row.codigo_balon }}
        </p>
        <p v-if="row.libro_cilindro" class="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">
          {{ row.libro_cilindro }}<span v-if="row.pagina_libro"> — pág. {{ row.pagina_libro }}</span>
        </p>
      </template>

      <template #cell-tipo_gas="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ row.nombre_tipo_balon || '—' }}
        </p>
        <p class="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">
          {{ row.nombre_producto_gas || '—' }}
        </p>
      </template>

      <template #cell-capacidad_marca="{ row }">
        <p class="truncate whitespace-nowrap font-medium text-gray-800 dark:text-white/90">
          <template v-if="row.capacidad != null">
            {{ row.capacidad }}{{ row.nombre_unidad_medida ? ` ${row.nombre_unidad_medida}` : '' }}
          </template>
          <span v-else class="font-normal text-gray-400">—</span>
        </p>
        <p class="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">
          {{ row.nombre_marca_cilindro || '—' }}
        </p>
      </template>

      <template #cell-nombre_estado_balon="{ row }">
        <BalonEstadoBadge :balon="row" />
      </template>

      <template #cell-fecha_proxima_prueba_hidrostatica="{ row, value }">
        <div class="flex flex-col gap-1">
          <span class="whitespace-nowrap">{{ formatMonthYear(value as string | null) }}</span>
          <AppBadge v-if="row.estado_ph" size="sm" :color="phBadgeColor(row.estado_ph)">
            PH {{ phBadgeLabel(row.estado_ph) }}
          </AppBadge>
        </div>
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
      subtitle="Solo para registros sin historial. Si el cilindro se perdió o deterioró, use Solicitar baja."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ balonToDelete?.codigo_balon }}
        </span>
        ? Los cilindros con movimientos, P.H. o baja deben solicitarse por el flujo de baja para
        conservar el historial.
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
import {
  AppActionMenu,
  AppBadge,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import BalonEstadoBadge from '@/modules/balones/components/BalonEstadoBadge.vue'
import { formatMonthYear } from '@/modules/balones/utils/formatMonthYear'

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
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)

const filters = ref<BalonListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const balonesQuery = useBalonesQuery(filters)
const deleteMutation = useDeleteBalonMutation()

const phAlertFilters = ref<BalonListFilters>({
  pagina: 1,
  limite: 1,
  phPorVencerDias: 90,
  soloBajas: false,
})
const phVencidaFilters = ref<BalonListFilters>({
  pagina: 1,
  limite: 1,
  phVencida: true,
  soloBajas: false,
})
const phAlertQuery = useBalonesQuery(phAlertFilters)
const phVencidaQuery = useBalonesQuery(phVencidaFilters)
const phAlertCount = computed(() => phAlertQuery.data.value?.meta?.total ?? 0)
const phVencidaCount = computed(() => phVencidaQuery.data.value?.meta?.total ?? 0)

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

const phPorVencerOptions = [
  { label: '30 días', value: 30 },
  { label: '60 días', value: 60 },
  { label: '90 días', value: 90 },
]

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idTipoBalon',
    label: 'Tipo',
    type: 'select',
    placeholder: 'Seleccionar tipo',
    disabled: tiposBalonQuery.isLoading.value,
    options: (tiposBalonQuery.data.value?.data ?? []).map((tipo) => ({
      label: tipo.nombre,
      value: tipo.id,
    })),
  },
  {
    key: 'idMarcaCilindro',
    label: 'Marca',
    type: 'select',
    placeholder: 'Seleccionar marca',
    disabled: marcaQuery.isLoading.value,
    options: toSelectOptions(marcaQuery.data.value),
  },
  {
    key: 'idAlmacen',
    label: 'Almacén',
    type: 'select',
    placeholder: 'Seleccionar almacén',
    disabled: almacenesQuery.isLoading.value,
    options: (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
      label: almacen.nombre,
      value: almacen.id,
    })),
  },
  {
    key: 'idEstadoBalon',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    disabled: estadoBalonQuery.isLoading.value,
    options: toSelectOptions(estadoBalonQuery.data.value),
  },
  {
    key: 'phPorVencerDias',
    label: 'PH por vencer',
    type: 'select',
    placeholder: 'Seleccionar días',
    options: phPorVencerOptions,
  },
  {
    key: 'phVencida',
    label: 'PH vencida',
    type: 'checkbox',
    placeholder: 'Solo PH vencida',
  },
  {
    key: 'soloBajas',
    label: 'Historial bajas',
    type: 'checkbox',
    placeholder: 'Solo dados de baja / robados',
  },
])

const columns = computed<TableColumn<Balon>[]>(() => [
  { key: 'codigo_balon', label: 'Código / Libro' },
  { key: 'tipo_gas', label: 'Tipo / Gas' },
  { key: 'capacidad_marca', label: 'Capacidad / Marca', cellClass: 'whitespace-nowrap' },
  { key: 'nombre_estado_balon', label: 'Estado', cellClass: 'whitespace-nowrap' },
  { key: 'nombre_almacen', label: 'Almacén' },
  {
    key: 'fecha_proxima_prueba_hidrostatica',
    label: 'Próx. P.H.',
    cellClass: 'whitespace-nowrap',
  },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idTipoBalon: active.idTipoBalon != null ? Number(active.idTipoBalon) : undefined,
    idMarcaCilindro:
      active.idMarcaCilindro != null ? Number(active.idMarcaCilindro) : undefined,
    idAlmacen: active.idAlmacen != null ? Number(active.idAlmacen) : undefined,
    idEstadoBalon: active.idEstadoBalon != null ? Number(active.idEstadoBalon) : undefined,
    phVencida: active.phVencida === true ? true : undefined,
    phPorVencerDias:
      active.phPorVencerDias != null ? Number(active.phPorVencerDias) : undefined,
    soloBajas: active.soloBajas === true ? true : undefined,
  }
}

const aplicarAlertaPh = (dias: number) => {
  dynamicFilters.value = {
    ...dynamicFilters.value,
    phPorVencerDias: dias,
    phVencida: undefined,
    soloBajas: undefined,
  }
  pagina.value = 1
  syncFilters()
}

const aplicarPhVencida = () => {
  dynamicFilters.value = {
    ...dynamicFilters.value,
    phVencida: true,
    phPorVencerDias: undefined,
    soloBajas: undefined,
  }
  pagina.value = 1
  syncFilters()
}

const onFiltersChange = () => {
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

function actionItemsForRow(row: Balon): ActionMenuItem[] {
  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      hidden: !canEdit.value,
    },
    {
      key: 'baja',
      label: 'Solicitar baja',
      icon: ICONS.archive,
      hidden: !(canEdit.value && puedeDarDeBaja(row)),
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: ICONS.trash,
      danger: true,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: Balon) {
  if (key === 'edit') openEditModal(row)
  if (key === 'baja') openBajaModal(row)
  if (key === 'delete') openDeleteModal(row)
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

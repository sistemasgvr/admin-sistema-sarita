<template>
  <div>
    <PageBreadcrumb v-if="!embedded" page-title="Alquileres" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Número o observación..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <RouterLink
              v-if="canCreate"
              :to="{ name: 'admin-balones-alquileres-nuevo' }"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nuevo
            </RouterLink>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-numero_alquiler="{ value }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ value }}</p>
      </template>

      <template #cell-nombre_cliente="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-nombre_producto_regulador="{ row }">
        <template v-if="row.nombre_producto_regulador">
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ row.nombre_producto_regulador }}
          </p>
          <p v-if="row.codigo_producto_regulador" class="text-theme-xs text-gray-500">
            {{ row.codigo_producto_regulador }}
          </p>
        </template>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-nombre_almacen="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #cell-vigencia="{ row }">
        <DateRangeBadges :from="row.fecha_inicio" :to="row.fecha_fin_pactada" />
      </template>

      <template #cell-tarifa_diaria="{ value }">
        <span v-if="value != null">{{ formatMoney(value as number) }}</span>
        <span v-else class="text-gray-400">—</span>
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
          :meta="alquileresQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <AlquilerDetailModal v-model="detailModalOpen" :alquiler-id="alquilerToViewId" />

    <AlquilerDevolverCilindrosModal
      v-model="devolverCilindrosModalOpen"
      :alquiler="alquilerToDevolver"
      @saved="onDevolucionDesdeLista"
    />
    <RecojoProgramarModal
      v-model="programarRecojoOpen"
      :id-cliente="alquilerToRecojo?.id_cliente"
      :id-alquiler="alquilerToRecojo?.id"
      :numero-origen="alquilerToRecojo?.numero_alquiler"
      tipo-origen="ALQUILER"
      @saved="onDevolucionDesdeLista"
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
import { useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import AlquilerDetailModal from '@/modules/balones/alquileres/components/AlquilerDetailModal.vue'
import AlquilerDevolverCilindrosModal from '@/modules/balones/alquileres/components/AlquilerDevolverCilindrosModal.vue'
import RecojoProgramarModal from '@/modules/balones/recojos/components/RecojoProgramarModal.vue'
import DateRangeBadges from '@/modules/balones/components/DateRangeBadges.vue'
import { useDeleteAlquilerMutation } from '@/modules/balones/alquileres/composables/useAlquilerMutations'
import { useAlquileresQuery } from '@/modules/balones/alquileres/composables/useAlquileresQuery'
import type {
  Alquiler,
  AlquilerListFilters,
} from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
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
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { useOpenIdFromRouteQuery } from '@/shared/composables/useOpenIdFromRouteQuery'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false,
  },
)

const authStore = useAuthStore()
const router = useRouter()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
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

const detailModalOpen = ref(false)
const alquilerToViewId = ref<number | null>(null)

const devolverCilindrosModalOpen = ref(false)
const alquilerToDevolver = ref<Alquiler | null>(null)
const programarRecojoOpen = ref(false)
const alquilerToRecojo = ref<Alquiler | null>(null)

const deleteModalOpen = ref(false)
const alquilerToDelete = ref<Alquiler | null>(null)
const deleteMutation = useDeleteAlquilerMutation()

const breadcrumbItems = balonesBreadcrumbItems('Alquileres')

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_ELIMINAR))
const canDevolver = computed(
  () =>
    authStore.hasPermission(PermisoBanderas.ALQUILERES_DETALLE_EDITAR) ||
    authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_EDITAR),
)

const isLoading = computed(
  () => alquileresQuery.isFetching.value || alquileresQuery.isLoading.value,
)

const rows = computed(() => alquileresQuery.data.value?.data ?? [])

const columns: TableColumn[] = [
  { key: 'numero_alquiler', label: 'Número' },
  { key: 'nombre_cliente', label: 'Cliente' },
  { key: 'nombre_producto_regulador', label: 'Regulador' },
  { key: 'nombre_almacen', label: 'Almacén' },
  { key: 'vigencia', label: 'Inicio / Fin' },
  { key: 'tarifa_diaria', label: 'Tarifa' },
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
    options: (clientesQuery.data.value?.data ?? []).map((cliente) => ({
      value: cliente.id,
      label:
        cliente.razon_social ||
        [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
        cliente.numero_documento,
    })),
  },
  {
    key: 'idAlmacen',
    label: 'Almacén',
    type: 'select',
    placeholder: 'Seleccionar almacén',
    disabled: almacenesQuery.isLoading.value,
    options: (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
      value: almacen.id,
      label: almacen.nombre,
    })),
  },
  {
    key: 'idEstado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Seleccionar estado',
    disabled: estadosAlquilerQuery.isFetching.value,
    options: toSelectOptions(estadosAlquilerQuery.data.value),
  },
])

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idCliente: active.idCliente != null ? Number(active.idCliente) : undefined,
    idAlmacen: active.idAlmacen != null ? Number(active.idAlmacen) : undefined,
    idEstado: active.idEstado != null ? Number(active.idEstado) : undefined,
  }
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

const goToEdit = (row: Alquiler) => {
  router.push({
    name: 'admin-balones-alquileres-editar',
    params: { id: String(row.id) },
  })
}

const openDetailModal = (row: Alquiler) => {
  alquilerToViewId.value = row.id
  detailModalOpen.value = true
}

useOpenIdFromRouteQuery({
  onOpen: (id) => {
    alquilerToViewId.value = id
    detailModalOpen.value = true
  },
})

const openDeleteModal = (row: Alquiler) => {
  alquilerToDelete.value = row
  deleteModalOpen.value = true
}

const openDevolverCilindros = (row: Alquiler) => {
  alquilerToDevolver.value = row
  devolverCilindrosModalOpen.value = true
}

function isAlquilerActivo(row: Alquiler): boolean {
  return (row.nombre_estado ?? '').toUpperCase() === 'ACTIVO'
}

function deleteLabelForRow(row: Alquiler): string {
  if (row.puede_eliminar !== false) return 'Eliminar'
  if (row.id_comprobante_venta != null) return 'Eliminar (tiene comprobante)'
  return 'Eliminar (tiene detalles)'
}

function actionItemsForRow(row: Alquiler): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value
  const blockedDelete = row.puede_eliminar === false
  const activo = isAlquilerActivo(row)
  const tieneCilindros = Number(row.total_detalles ?? 0) > 0

  return [
    {
      key: 'devolver',
      label: 'Devolver cilindros',
      icon: ICONS.clipboardCheck,
      disabled: busy,
      hidden: !canDevolver.value || !activo || !tieneCilindros,
    },
    {
      key: 'programar_recojo',
      label: 'Programar recojo',
      icon: ICONS.truck,
      disabled: busy,
      hidden: !authStore.hasPermission(PermisoBanderas.RECOJOS_BALON_CREAR) || !activo || !tieneCilindros,
    },
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !canEdit.value,
    },
    {
      key: 'delete',
      label: deleteLabelForRow(row),
      icon: ICONS.trash,
      danger: !blockedDelete,
      disabled: busy || blockedDelete,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: Alquiler) {
  if (key === 'devolver') openDevolverCilindros(row)
  if (key === 'programar_recojo') {
    alquilerToRecojo.value = row
    programarRecojoOpen.value = true
  }
  if (key === 'edit') goToEdit(row)
  if (key === 'delete') openDeleteModal(row)
}

function onDevolucionDesdeLista() {
  void alquileresQuery.refetch()
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

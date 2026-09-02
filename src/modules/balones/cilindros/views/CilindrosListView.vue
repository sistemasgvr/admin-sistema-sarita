<template>  
  <div>
    <PageBreadcrumb
      v-if="!embedded"
      page-title="Libro de cilindros"
      :items="breadcrumbItems"
    />

    <AppSummaryCards :cards="resumenCards" />

    <div
      v-if="activeFilterChips.length"
      class="mb-4 flex flex-wrap items-center gap-2"
    >
      <span class="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
        Filtros activos
      </span>
      <button
        v-for="chip in activeFilterChips"
        :key="chip.key"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200 dark:hover:bg-brand-500/20"
        :title="`Quitar filtro ${chip.label}`"
        @click="clearFilterChip(chip.key)"
      >
        <span>{{ chip.label }}: {{ chip.value }}</span>
        <AppIcon :name="ICONS.x" :size="12" />
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
        @click="clearScopedFilters"
      >
        <AppIcon :name="ICONS.brushCleaning" :size="14" />
        Limpiar filtros
      </button>
    </div>

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
          <template #search-extra>
            <BalonBarcodeScanButton
              title="Escanear cilindro"
              @captured="onCodigoScanned"
            />
          </template>
          <template #actions>
            <AppExportExcelButton
              label="Exportar Excel"
              title="Exportar cilindros por propietario (resumen + detalle)"
              :on-export="exportExcelFile"
            />
            <button
              v-if="canCreate"
              type="button"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 sm:px-4"
              title="Nuevo"
              @click="goToCreate"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              <span class="hidden sm:inline">Nuevo</span>
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-codigo_balon="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ row.codigo_balon }}
        </p>
        <div v-if="row.libro_cilindro || row.pagina_libro != null" class="mt-1 flex flex-wrap gap-1">
          <AppBadge v-if="row.libro_cilindro" size="sm" color="neutral">
            {{ row.libro_cilindro }}
          </AppBadge>
          <AppBadge v-if="row.pagina_libro != null" size="sm" color="primary">
            pág. {{ row.pagina_libro }}
          </AppBadge>
        </div>
      </template>

      <template #cell-tipo_gas="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ row.nombre_tipo_balon || '—' }}
        </p>
        <div class="mt-1">
          <AppBadge v-if="row.nombre_producto_gas" size="sm" color="primary">
            {{ row.nombre_producto_gas }}
          </AppBadge>
          <span v-else class="text-theme-xs text-gray-400">—</span>
        </div>
      </template>

      <template #cell-capacidad_marca="{ row }">
        <p class="truncate whitespace-nowrap font-medium text-gray-800 dark:text-white/90">
          <template v-if="row.capacidad != null">
            {{ row.capacidad }}{{ row.nombre_unidad_medida ? ` ${row.nombre_unidad_medida}` : '' }}
          </template>
          <span v-else class="font-normal text-gray-400">—</span>
        </p>
        <div class="mt-1 flex flex-wrap gap-1">
          <AppBadge v-if="row.nombre_marca_cilindro" size="sm" color="neutral">
            {{ row.nombre_marca_cilindro }}
          </AppBadge>
          <AppBadge v-if="row.tipo_valvula" size="sm" color="neutral" :title="row.tipo_valvula">
            {{ row.tipo_valvula }}
          </AppBadge>
          <span
            v-if="!row.nombre_marca_cilindro && !row.tipo_valvula"
            class="text-theme-xs text-gray-400"
          >
            —
          </span>
        </div>
      </template>

      <template #cell-propiedad="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ formatListaOpcionLabel(row.nombre_propietario) || '—' }}
        </p>
        <div class="mt-1">
          <AppBadge v-if="row.nombre_planta" size="sm" color="primary" :title="row.nombre_planta">
            {{ row.nombre_planta }}
          </AppBadge>
          <AppBadge
            v-else-if="row.nombre_cliente_propietario"
            size="sm"
            color="neutral"
            :title="row.nombre_cliente_propietario"
          >
            {{ row.nombre_cliente_propietario }}
          </AppBadge>
          <span v-else class="text-theme-xs text-gray-400">—</span>
        </div>
      </template>

      <template #cell-estado_contenido="{ row }">
        <div class="flex flex-col gap-1">
          <BalonEstadoBadge :balon="row" />
          <span
            v-if="esNoDisponible(row)"
            class="inline-flex w-fit items-center gap-1 rounded-full bg-error-50 px-2 py-0.5 text-[11px] font-medium text-error-700 dark:bg-error-500/10 dark:text-error-400"
            :title="referenciaNoDisponible(row)"
          >
            <AppIcon :name="ICONS.ban" :size="11" />
            No disponible
            <template v-if="row.nombre_cliente_ubicacion">
              · {{ row.nombre_cliente_ubicacion }}
            </template>
          </span>
        </div>
      </template>

      <template #cell-nombre_almacen="{ row }">
        <span
          v-if="row.nombre_almacen"
          class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold uppercase tracking-tight text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
          :title="row.nombre_almacen"
        >
          {{ inicialesAlmacen(row.nombre_almacen) }}
        </span>
        <span v-else class="text-theme-xs text-gray-400" title="Sin almacén">—</span>
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
            @click="openDetailView(row)"
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

    <BalonBajaModal
      v-model="bajaModalOpen"
      :balon-id="balonToBajaId"
      @saved="onBalonBajaSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar cilindro"
      :subtitle="
        deleteBlocked
          ? 'Este cilindro tiene historial o dependencias.'
          : 'Solo para registros sin historial. Si se perdió o deterioró, use Solicitar baja.'
      "
      size="sm"
    >
      <div
        v-if="deleteBlocked"
        class="rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
      >
        No puedes eliminar
        <span class="font-medium">{{ balonToDelete?.codigo_balon }}</span>
        porque tiene historial (movimientos, préstamos, alquileres, P.H., etc.). Usa
        <strong>Solicitar baja</strong> para conservar la trazabilidad.
      </div>

      <p v-else class="text-sm text-gray-600 dark:text-gray-400">
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
          {{ deleteBlocked ? 'Cerrar' : 'Cancelar' }}
        </button>
        <button
          v-if="!deleteBlocked"
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="deleteMutation.isPending.value"
          @click="confirmDelete"
        >
          {{ deleteMutation.isPending.value ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </AppModal>

    <AppModal
      v-model="restaurarModalOpen"
      title="Reactivar cilindro"
      subtitle="El cilindro volverá a estado EN_ALMACEN y quedará en el historial."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas reactivar el cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ balonToRestaurar?.codigo_balon }}
        </span>
        ?
      </p>
      <label class="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Observación (opcional)
        <textarea
          v-model="restaurarObservacion"
          rows="3"
          maxlength="500"
          class="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          placeholder="Motivo de la reactivación..."
        />
      </label>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="restaurarMutation.isPending.value"
          @click="restaurarModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="restaurarMutation.isPending.value"
          @click="confirmRestaurar"
        >
          {{ restaurarMutation.isPending.value ? 'Reactivando...' : 'Reactivar' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import BalonBajaModal from '@/modules/balones/cilindros/components/BalonBajaModal.vue'
import BalonBarcodeScanButton from '@/modules/balones/cilindros/components/BalonBarcodeScanButton.vue'
import {
  useDeleteBalonMutation,
  useRestaurarBalonMutation,
} from '@/modules/balones/cilindros/composables/useBalonMutations'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import type {
  Balon,
  BalonListFilters,
  EstadoPh,
} from '@/modules/balones/cilindros/interfaces/balon.interface'
import { useTiposBalonQuery } from '@/modules/balones/tipos-balon/composables/useTiposBalonQuery'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import type { ClienteListFilters } from '@/modules/clientes/interfaces/cliente.interface'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppBadge,
  AppExportExcelButton,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppSummaryCards,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { SummaryCardItem } from '@/shared/components/ui/AppSummaryCards.vue'
import { parsePositiveIntQuery } from '@/shared/composables/useOpenIdFromRouteQuery'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds, TipoClienteIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import BalonEstadoBadge from '@/modules/balones/components/BalonEstadoBadge.vue'
import { balonesPropietarioService } from '@/modules/balones/propietario/services/balones-propietario.service'
import type {
  BalonPropietarioResumen,
  TipoPropietarioBalon,
} from '@/modules/balones/propietario/interfaces/balon-propietario.interface'
import { exportarBalonesPropietarioExcel } from '@/modules/balones/propietario/utils/exportarBalonesPropietarioExcel'
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
const route = useRoute()
const router = useRouter()

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const pagina = ref(1)
const limite = ref(10)
const idProductoGasFiltro = ref<number | null>(null)
const nombreGasFiltro = ref<string | null>(null)
const soloLlenosFueraFiltro = ref(false)

type ScopedFilterChipKey = 'gas' | 'almacen' | 'llenosFuera'

const filters = ref<BalonListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const balonesQuery = useBalonesQuery(filters)
const deleteMutation = useDeleteBalonMutation()
const restaurarMutation = useRestaurarBalonMutation()

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

const plantasFilters = ref<ClienteListFilters>({
  pagina: 1,
  limite: 200,
  soloActivos: 1,
  idTipoCliente: TipoClienteIds.PROVEEDOR,
})
const plantasQuery = useClientesQuery(plantasFilters)
const plantasClienteProveedorFilters = ref<ClienteListFilters>({
  pagina: 1,
  limite: 200,
  soloActivos: 1,
  idTipoCliente: TipoClienteIds.CLIENTE_PROVEEDOR,
})
const plantasClienteProveedorQuery = useClientesQuery(plantasClienteProveedorFilters)

const plantaOptions = computed(() => {
  const map = new Map<number, string>()
  for (const cliente of [
    ...(plantasQuery.data.value?.data ?? []),
    ...(plantasClienteProveedorQuery.data.value?.data ?? []),
  ]) {
    if (!map.has(cliente.id)) {
      map.set(cliente.id, getClienteOptionLabel(cliente))
    }
  }
  return [...map.entries()]
    .map(([value, label]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
})

const plantasLoading = computed(
  () => plantasQuery.isFetching.value || plantasClienteProveedorQuery.isFetching.value,
)

const activeFilterChips = computed(() => {
  const chips: { key: ScopedFilterChipKey; label: string; value: string }[] = []

  if (idProductoGasFiltro.value) {
    chips.push({
      key: 'gas',
      label: 'Gas',
      value: nombreGasFiltro.value || `#${idProductoGasFiltro.value}`,
    })
  }

  const idAlmacen = dynamicFilters.value.idAlmacen
  if (idAlmacen != null && idAlmacen !== '') {
    const almacen = (almacenesQuery.data.value?.data ?? []).find(
      (a) => a.id === Number(idAlmacen),
    )
    chips.push({
      key: 'almacen',
      label: 'Almacén',
      value: almacen?.nombre || `#${idAlmacen}`,
    })
  }

  if (soloLlenosFueraFiltro.value) {
    chips.push({
      key: 'llenosFuera',
      label: 'Vista',
      value: 'Llenos fuera de almacén',
    })
  }

  return chips
})

const listaEstadoBalonId = ref(ListaIds.ESTADO_BALON)
const listaMarcaId = ref(ListaIds.MARCA_CILINDRO)
const listaPropietarioId = ref(ListaIds.PROPIETARIO_BALON)
const estadoBalonQuery = useListaOpcionesQuery(listaEstadoBalonId)
const marcaQuery = useListaOpcionesQuery(listaMarcaId)
const propietarioQuery = useListaOpcionesQuery(listaPropietarioId)

const deleteModalOpen = ref(false)
const balonToDelete = ref<Balon | null>(null)
const deleteBlocked = computed(() => balonToDelete.value?.puede_eliminar === false)

const bajaModalOpen = ref(false)
const balonToBajaId = ref<number | null>(null)

const restaurarModalOpen = ref(false)
const balonToRestaurar = ref<Balon | null>(null)
const restaurarObservacion = ref('')

const breadcrumbItems = computed(() => balonesBreadcrumbItems('Libro de cilindros'))

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.BALONES_CREAR))
const canView = computed(() => authStore.hasPermission(PermisoBanderas.BALONES_VER))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.BALONES_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.BALONES_ELIMINAR))
const canSolicitarBaja = computed(() =>
  authStore.hasPermission(PermisoBanderas.BAJAS_BALON_SOLICITAR),
)

const isLoading = computed(() => balonesQuery.isFetching.value)
const rows = computed(() => balonesQuery.data.value?.data ?? [])

const resumen = computed(
  () => (balonesQuery.data.value?.meta?.resumen ?? {}) as Record<string, number>,
)

const resumenCards = computed<SummaryCardItem[]>(() => [
  {
    key: 'total',
    label: 'Total cilindros',
    value: String(resumen.value.total ?? 0),
    icon: ICONS.cylinder,
    iconClass: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
  },
  {
    key: 'almacen',
    label: 'En almacén',
    value: String(resumen.value.en_almacen ?? 0),
    icon: ICONS.warehouse,
    iconClass: 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300',
  },
  {
    key: 'llenos',
    label: 'Llenos (almacén)',
    value: String(resumen.value.llenos ?? 0),
    icon: ICONS.droplet,
    iconClass: 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300',
  },
  {
    key: 'vacios',
    label: 'Vacíos (almacén)',
    value: String(resumen.value.vacios ?? 0),
    icon: ICONS.archive,
    iconClass: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
  },
])

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

/** Iniciales del almacén para el avatar compacto (máx. 2 letras). */
const inicialesAlmacen = (nombre: string) => {
  const partes = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()[\]{}.,;:/\\|_+-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase()
}

const estadoBalonNombre = (balon: Balon) => balon.nombre_estado_balon?.toUpperCase() ?? ''

const ESTADOS_DISPONIBLES = ['EN_ALMACEN', '']

const esNoDisponible = (balon: Balon) => !ESTADOS_DISPONIBLES.includes(estadoBalonNombre(balon))

const referenciaNoDisponible = (balon: Balon) => {
  const estado = balon.nombre_estado_balon || 'Estado desconocido'
  if (balon.nombre_cliente_ubicacion) {
    return `Cilindro ${estado} y asignado a ${balon.nombre_cliente_ubicacion}; no está disponible para préstamo/alquiler`
  }
  return `Cilindro ${estado}; no está disponible para préstamo/alquiler`
}

const puedeDarDeBaja = (balon: Balon) =>
  balon.estado === 1 &&
  !balon.baja &&
  !balon.tiene_solicitud_baja_pendiente &&
  !['DADO_DE_BAJA', 'ROBO'].includes(estadoBalonNombre(balon))

const puedeRestaurar = (balon: Balon) =>
  balon.estado === 1 &&
  !balon.tiene_solicitud_baja_pendiente &&
  ['DADO_DE_BAJA', 'ROBO'].includes(estadoBalonNombre(balon))

const phPorVencerOptions = [
  { label: '30 días', value: 30 },
  { label: '45 días', value: 45 },
  { label: '60 días', value: 60 },
  { label: '90 días', value: 90 },
]

const tipoValvulaFilterOptions = [
  { label: 'Americana', value: 'Americana' },
  { label: 'China', value: 'China' },
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
    key: 'idPlanta',
    label: 'Planta',
    type: 'select',
    placeholder: 'Seleccionar planta',
    searchable: true,
    disabled: plantasLoading.value,
    options: plantaOptions.value,
  },
  {
    key: 'tipoValvula',
    label: 'Tipo válvula',
    type: 'select',
    placeholder: 'Americana / China...',
    options: tipoValvulaFilterOptions,
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
    key: 'idPropietario',
    label: 'Propietario',
    type: 'select',
    placeholder: 'Empresa / planta / cliente...',
    disabled: propietarioQuery.isLoading.value,
    options: toSelectOptions(propietarioQuery.data.value),
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
  { key: 'propiedad', label: 'Propiedad' },
  { key: 'estado_contenido', label: 'Estado', cellClass: 'whitespace-nowrap' },
  { key: 'nombre_almacen', label: 'Almacén', cellClass: 'w-16 text-center' },
  {
    key: 'fecha_proxima_prueba_hidrostatica',
    label: 'Próx. P.H.',
    cellClass: 'whitespace-nowrap',
  },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  const active = dynamicFilters.value
  const tipoValvulaRaw = active.tipoValvula
  const tipoValvula =
    typeof tipoValvulaRaw === 'string' && tipoValvulaRaw.trim()
      ? tipoValvulaRaw.trim()
      : undefined

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    idTipoBalon: active.idTipoBalon != null ? Number(active.idTipoBalon) : undefined,
    idMarcaCilindro:
      active.idMarcaCilindro != null ? Number(active.idMarcaCilindro) : undefined,
    idAlmacen: active.idAlmacen != null ? Number(active.idAlmacen) : undefined,
    idPlanta: active.idPlanta != null ? Number(active.idPlanta) : undefined,
    tipoValvula,
    idEstadoBalon: active.idEstadoBalon != null ? Number(active.idEstadoBalon) : undefined,
    idPropietario: active.idPropietario != null ? Number(active.idPropietario) : undefined,
    idProductoGas: idProductoGasFiltro.value ?? undefined,
    soloLlenosFuera: soloLlenosFueraFiltro.value ? true : undefined,
    phVencida: active.phVencida === true ? true : undefined,
    phPorVencerDias:
      active.phPorVencerDias != null ? Number(active.phPorVencerDias) : undefined,
    soloBajas: active.soloBajas === true ? true : undefined,
  }
}

const syncScopedQuery = () => {
  const nextQuery: Record<string, string> = {}
  if (typeof route.query.tab === 'string' && route.query.tab) {
    nextQuery.tab = route.query.tab
  }
  if (idProductoGasFiltro.value) nextQuery.idProductoGas = String(idProductoGasFiltro.value)
  if (nombreGasFiltro.value) nextQuery.gas = nombreGasFiltro.value
  const idAlmacen = dynamicFilters.value.idAlmacen
  if (idAlmacen != null && idAlmacen !== '') nextQuery.idAlmacen = String(idAlmacen)
  if (soloLlenosFueraFiltro.value) nextQuery.soloLlenosFuera = '1'

  const currGas =
    typeof route.query.idProductoGas === 'string' ? route.query.idProductoGas : undefined
  const currAlmacen =
    typeof route.query.idAlmacen === 'string' ? route.query.idAlmacen : undefined
  const currFuera =
    typeof route.query.soloLlenosFuera === 'string' ? route.query.soloLlenosFuera : undefined
  const currNombre = typeof route.query.gas === 'string' ? route.query.gas : undefined
  const currTab = typeof route.query.tab === 'string' ? route.query.tab : undefined

  if (
    currGas === nextQuery.idProductoGas &&
    currAlmacen === nextQuery.idAlmacen &&
    currFuera === nextQuery.soloLlenosFuera &&
    currNombre === nextQuery.gas &&
    currTab === nextQuery.tab
  ) {
    return
  }

  void router.replace({ query: nextQuery })
}

const applyScopedFiltersFromRoute = () => {
  const idGas = parsePositiveIntQuery(route.query.idProductoGas)
  const idAlmacen = parsePositiveIntQuery(route.query.idAlmacen)
  const soloFuera =
    route.query.soloLlenosFuera === '1' ||
    route.query.soloLlenosFuera === 'true'
  const gasLabel =
    typeof route.query.gas === 'string' && route.query.gas.trim()
      ? route.query.gas.trim()
      : null

  idProductoGasFiltro.value = idGas
  nombreGasFiltro.value = gasLabel
  soloLlenosFueraFiltro.value = soloFuera

  if (idAlmacen) {
    dynamicFilters.value = { ...dynamicFilters.value, idAlmacen }
  } else if (dynamicFilters.value.idAlmacen != null && !idAlmacen) {
    const { idAlmacen: _omit, ...rest } = dynamicFilters.value
    dynamicFilters.value = rest
  }

  pagina.value = 1
  syncFilters()
}

const clearFilterChip = (key: ScopedFilterChipKey) => {
  if (key === 'gas') {
    idProductoGasFiltro.value = null
    nombreGasFiltro.value = null
  }
  if (key === 'almacen') {
    const { idAlmacen: _omit, ...rest } = dynamicFilters.value
    dynamicFilters.value = rest
  }
  if (key === 'llenosFuera') {
    soloLlenosFueraFiltro.value = false
  }
  pagina.value = 1
  syncFilters()
  syncScopedQuery()
}

const clearScopedFilters = () => {
  idProductoGasFiltro.value = null
  nombreGasFiltro.value = null
  soloLlenosFueraFiltro.value = false
  const { idAlmacen: _omit, ...rest } = dynamicFilters.value
  dynamicFilters.value = rest
  pagina.value = 1
  syncFilters()
  syncScopedQuery()
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
  syncScopedQuery()
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

watch(
  () =>
    [
      route.query.idProductoGas,
      route.query.idAlmacen,
      route.query.soloLlenosFuera,
      route.query.gas,
    ] as const,
  () => {
    applyScopedFiltersFromRoute()
  },
)

onMounted(() => {
  applyScopedFiltersFromRoute()
})

const goToCreate = () => {
  router.push({ name: 'admin-balones-cilindros-nuevo' })
}

const resolveTipoPropietarioFiltro = (): TipoPropietarioBalon | undefined => {
  const id = filters.value.idPropietario
  if (id == null) return undefined
  const nombre = (propietarioQuery.data.value ?? [])
    .find((op) => op.id === id)
    ?.nombre?.toUpperCase()
  if (nombre === 'EMPRESA' || nombre === 'PLANTA' || nombre === 'CLIENTE') {
    return nombre
  }
  return undefined
}

const exportExcelFile = async () => {
  const result = await balonesPropietarioService.listar({
    buscar: filters.value.buscar,
    idAlmacen: filters.value.idAlmacen,
    idPlanta: filters.value.idPlanta,
    tipoPropietario: resolveTipoPropietarioFiltro(),
    excluirBajas: filters.value.soloBajas !== true,
    pagina: 1,
    limite: 10000,
  })
  await exportarBalonesPropietarioExcel({
    detalle: result.data ?? [],
    resumen: (result.meta?.resumen ?? {}) as BalonPropietarioResumen,
  })
}

const onCodigoScanned = (codigo: string) => {
  clearTimeout(buscarTimeout)
  buscar.value = codigo.trim()
  pagina.value = 1
  syncFilters()
}

const goToEdit = (balon: Balon) => {
  router.push({
    name: 'admin-balones-cilindros-editar',
    params: { id: String(balon.id) },
  })
}

const openDetailView = (balon: Balon) => {
  router.push({ name: 'admin-balones-cilindros-detalle', params: { id: String(balon.id) } })
}

const openDeleteModal = (balon: Balon) => {
  balonToDelete.value = balon
  deleteModalOpen.value = true
}

const openBajaModal = (balon: Balon) => {
  balonToBajaId.value = balon.id
  bajaModalOpen.value = true
}

const openRestaurarModal = (balon: Balon) => {
  balonToRestaurar.value = balon
  restaurarObservacion.value = ''
  restaurarModalOpen.value = true
}

function actionItemsForRow(row: Balon): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value
  const blockedDelete = row.puede_eliminar === false

  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !canEdit.value || puedeRestaurar(row),
    },
    {
      key: 'baja',
      label: 'Solicitar baja',
      icon: ICONS.archive,
      disabled: busy,
      hidden: !(canSolicitarBaja.value && puedeDarDeBaja(row)),
    },
    {
      key: 'restaurar',
      label: 'Reactivar',
      icon: ICONS.refreshCw,
      disabled: busy,
      hidden: !(canEdit.value && puedeRestaurar(row)),
    },
    {
      key: 'delete',
      label: blockedDelete ? 'Eliminar (tiene historial)' : 'Eliminar',
      icon: ICONS.trash,
      danger: !blockedDelete,
      disabled: busy || blockedDelete,
      hidden: !canDelete.value || puedeRestaurar(row),
    },
  ]
}

function onActionSelect(key: string, row: Balon) {
  if (key === 'edit') goToEdit(row)
  if (key === 'baja') openBajaModal(row)
  if (key === 'restaurar') openRestaurarModal(row)
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

const confirmRestaurar = async () => {
  const currentUserId = authStore.user?.id
  if (!balonToRestaurar.value || !currentUserId) return

  try {
    await restaurarMutation.mutateAsync({
      id: balonToRestaurar.value.id,
      payload: {
        idUsuarioAuditoria: currentUserId,
        observacion: restaurarObservacion.value.trim() || undefined,
      },
    })
    restaurarModalOpen.value = false
    balonToRestaurar.value = null
    restaurarObservacion.value = ''
  } catch {
    // toast en mutation
  }
}

</script>

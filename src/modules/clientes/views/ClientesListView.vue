<template>
  <div>
    <PageBreadcrumb v-if="!embedded" page-title="Clientes" />

    <AppSummaryChips :chips="summaryChips" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Buscar por razón social, nombres o documento..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <AppExportExcelButton :on-export="exportarExcel" />
            <RouterLink
              v-if="canCreate"
              :to="{ name: 'admin-clientes-nuevo' }"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nuevo
            </RouterLink>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-cliente="{ row }">
        <div class="flex flex-col gap-0.5">
          <div class="flex min-w-0 flex-wrap items-center gap-1.5">
            <p v-if="row.razon_social" class="truncate font-medium text-gray-800 dark:text-white/90">
              {{ row.razon_social }}
            </p>
            <AppBadge
              v-if="esClientesVarios(row)"
              size="sm"
              color="primary"
              title="Cliente de sistema para ventas sin documento"
            >
              Sistema
            </AppBadge>
          </div>
          <p
            v-if="row.nombres || row.apellido_paterno || row.apellido_materno"
            class="truncate text-sm text-gray-500 dark:text-gray-400"
          >
            {{ [row.nombres, row.apellido_paterno, row.apellido_materno].filter(Boolean).join(' ') }}
          </p>
        </div>
        <AppBadge v-if="row.nombre_tipo_persona" size="sm" color="neutral" class="mt-1">
          {{ formatListaOpcionLabel(row.nombre_tipo_persona) }}
        </AppBadge>
      </template>
      <template #cell-contacto="{ row }">
        <div class="flex flex-col text-sm">
          <span class="text-gray-500 dark:text-gray-400">
            tel: {{ row.telefono || '-' }}
          </span>

          <span class="text-gray-500 dark:text-gray-400">
            correo: {{ row.email || '-' }}
          </span>
        </div>
      </template>
      <template #cell-estado="{ row }">
        <AppBadge v-if="row.estado_baja_aprobacion" color="warning">
          Pendiente
        </AppBadge>
        <AppBadge v-else :color="row.estado === 1 ? 'success' : 'error'">
          {{ row.estado === 1 ? 'Activo' : 'Inactivo' }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <button
          type="button"
          title="Ver ficha"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetailView(row)"
        >
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>

        <button
          type="button"
          title="Reporte general (Excel)"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          :disabled="exportandoReporteId === row.id"
          @click="exportarReporte(row)"
        >
          <AppIcon
            :name="exportandoReporteId === row.id ? ICONS.loader : ICONS.fileText"
            :size="16"
            :class="{ 'animate-spin': exportandoReporteId === row.id }"
          />
        </button>

        <button
          v-if="canEdit && !esClientesVarios(row)"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click="openEditView(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
        </button>

        <button
          v-if="canEdit && row.estado === 1 && !esClientesVarios(row)"
          type="button"
          title="Solicitar baja"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
          @click="openBajaModal(row)"
        >
          <AppIcon :name="ICONS.archive" :size="16" />
        </button>

        <!-- <button
          v-if="canDelete && row.estado === 1"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-error-500 hover:bg-error-500/10"
          @click="openDeleteModal(row)"
        >
          <AppIcon :name="ICONS.trash" :size="16" />
        </button> -->

        <button
          v-if="canSolicitarBaja && row.estado !== 1 && !esClientesVarios(row)"
          type="button"
          title="Solicitar reactivación"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-success-600 hover:bg-success-500/10"
          @click="openReactivacionModal(row)"
        >
          <AppIcon :name="ICONS.refreshCw" :size="16" />
          Solicitar reactivación
        </button>
<!-- 
        <button
          v-if="canRestore && row.estado !== 1"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          :disabled="restaurarMutation.isPending.value"
          @click="restaurarCliente(row)"
        >
          <AppIcon :name="ICONS.check" :size="16" />
          Restaurar
        </button> -->
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="clientesQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <ClienteBajaModal
      v-model="bajaModalOpen"
      :cliente="clienteToBaja"
      @saved="onBajaSaved"
    />

    <ClienteReactivacionModal
      v-model="reactivacionModalOpen"
      :cliente="clienteToReactivacion"
      @saved="onReactivacionSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Archivar cliente"
      subtitle="Esta acción desactivará el cliente en el sistema (baja lógica)."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas archivar a
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ clienteToDelete ? getNombrePrincipal(clienteToDelete) : '' }}
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
          {{ deleteMutation.isPending.value ? 'Archivando...' : 'Archivar' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ClienteBajaModal from '@/modules/clientes/bajas-cliente/components/ClienteBajaModal.vue'
import ClienteReactivacionModal from '@/modules/clientes/bajas-cliente/components/ClienteReactivacionModal.vue'
import { useDeleteClienteMutation } from '@/modules/clientes/composables/useClienteMutations'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import type {
  Cliente,
  ClienteEstadoFiltro,
  ClienteListFilters,
} from '@/modules/clientes/interfaces/cliente.interface'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { esClientesVarios } from '@/modules/clientes/utils/clientesVarios'
import { exportarClientesExcel } from '@/modules/clientes/utils/exportarClientesExcel'
import { exportarReporteClienteExcel } from '@/modules/clientes/utils/exportarReporteClienteExcel'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { toastApiError } from '@/shared/composables/useToast'
import {
  AppBadge,
  AppExportExcelButton,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppSummaryChips,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { SummaryChip } from '@/shared/interfaces/summary-chip.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

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
const dynamicFilters = ref<DynamicFilterValues>({ estado: 'activos' })
const pagina = ref(1)
const limite = ref(10)

const tipoClienteQuery = useListaOpcionesQuery(computed(() => ListaIds.TIPO_CLIENTE))
const tipoClienteOptions = computed(() => toSelectOptions(tipoClienteQuery.data.value))

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'idTipoCliente',
    label: 'Tipo de cliente',
    type: 'select',
    placeholder: 'Todos los tipos',
    options: tipoClienteOptions.value,
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    placeholder: 'Todos',
    options: estadoFiltroOptions,
  },
])

const buildSoloActivos = (value: ClienteEstadoFiltro): number | undefined => {
  switch (value) {
    case 'activos':
      return 1
    case 'inactivos':
      return 0
    case 'todos':
    default:
      return undefined
  }
}

const filters = ref<ClienteListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  soloActivos: 1,
})

const clientesQuery = useClientesQuery(filters)
const deleteMutation = useDeleteClienteMutation()

// --- Chips de resumen (total / activos / inactivos, respetando búsqueda y tipo de cliente) ---
const breakdownFiltersBase = computed<ClienteListFilters>(() => ({
  buscar: buscar.value.trim(),
  pagina: 1,
  limite: 1,
  idTipoCliente:
    dynamicFilters.value.idTipoCliente != null ? Number(dynamicFilters.value.idTipoCliente) : undefined,
}))
// Sin soloActivos: el total real del sistema (o del subconjunto buscado/tipo), sin
// importar el filtro de Estado que esté activo en la tabla principal.
const todosFilters = computed<ClienteListFilters>(() => ({ ...breakdownFiltersBase.value }))
const activosFilters = computed<ClienteListFilters>(() => ({ ...breakdownFiltersBase.value, soloActivos: 1 }))
const inactivosFilters = computed<ClienteListFilters>(() => ({ ...breakdownFiltersBase.value, soloActivos: 0 }))
const todosQuery = useClientesQuery(todosFilters)
const activosQuery = useClientesQuery(activosFilters)
const inactivosQuery = useClientesQuery(inactivosFilters)

const summaryChips = computed<SummaryChip[]>(() => [
  // Antes usaba clientesQuery (la de la tabla, que sí respeta el filtro de Estado),
  // por eso con Estado=Activos "Total" mostraba solo los activos (26) en vez de 190.
  { label: 'Total clientes', value: todosQuery.data.value?.meta?.total ?? 0, color: 'primary' },
  { label: 'Activos', value: activosQuery.data.value?.meta?.total ?? 0, color: 'success' },
  { label: 'Inactivos', value: inactivosQuery.data.value?.meta?.total ?? 0, color: 'error' },
])

const deleteModalOpen = ref(false)
const clienteToDelete = ref<Cliente | null>(null)

const bajaModalOpen = ref(false)
const clienteToBaja = ref<Cliente | null>(null)

const reactivacionModalOpen = ref(false)
const clienteToReactivacion = ref<Cliente | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.CLIENTES_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.CLIENTES_EDITAR))
const canSolicitarBaja = computed(() => authStore.hasPermission(PermisoBanderas.BAJAS_CLIENTE_SOLICITAR))

const isLoading = computed(() => clientesQuery.isFetching.value)
const rows = computed(() => clientesQuery.data.value?.data ?? [])

const getNombrePrincipal = (cliente: Cliente) => {
  const esJuridica = cliente.nombre_tipo_persona?.toLowerCase().includes('jurí')

  if (esJuridica && cliente.razon_social) {
    return cliente.razon_social
  }

  const nombreCompleto = [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || cliente.razon_social || cliente.numero_documento
}

const columns = computed<TableColumn<Cliente>[]>(() => [
  { key: 'cliente', label: 'Cliente' },
  { key: 'numero_documento', label: 'Documento' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'contacto', label: 'Teléfono / Correo' },
  { key: 'estado', label: 'Estado' },
])

const estadoFiltroActual = computed<ClienteEstadoFiltro>(() => {
  const v = dynamicFilters.value.estado
  return v === 'activos' || v === 'inactivos' ? v : 'todos'
})

const syncFilters = () => {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    soloActivos: buildSoloActivos(estadoFiltroActual.value),
    idTipoCliente:
      dynamicFilters.value.idTipoCliente != null
        ? Number(dynamicFilters.value.idTipoCliente)
        : undefined,
  }
}

const onFiltersChange = () => {
  pagina.value = 1
  syncFilters()
}

const exportarExcel = () => exportarClientesExcel(filters.value)

const exportandoReporteId = ref<number | null>(null)

const exportarReporte = async (cliente: Cliente) => {
  if (exportandoReporteId.value) return
  exportandoReporteId.value = cliente.id
  try {
    await exportarReporteClienteExcel(cliente.id)
  } catch (error) {
    toastApiError(error, 'No se pudo generar el reporte')
  } finally {
    exportandoReporteId.value = null
  }
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

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

const openEditView = (cliente: Cliente) => {
  if (esClientesVarios(cliente)) return
  void router.push({
    name: 'admin-clientes-editar',
    params: { id: String(cliente.id) },
  })
}

const openDetailView = (cliente: Cliente) => {
  void router.push({
    name: 'admin-clientes-detalle',
    params: { id: String(cliente.id) },
  })
}

/* const openDeleteModal = (cliente: Cliente) => {
  clienteToDelete.value = cliente
  deleteModalOpen.value = true
} */

const openBajaModal = (cliente: Cliente) => {
  clienteToBaja.value = cliente
  bajaModalOpen.value = true
}

const openReactivacionModal = (cliente: Cliente) => {
  clienteToReactivacion.value = cliente
  reactivacionModalOpen.value = true
}

const onBajaSaved = () => {
  clienteToBaja.value = null
}

const onReactivacionSaved = () => {
  clienteToReactivacion.value = null
}

const confirmDelete = async () => {
  if (!clienteToDelete.value || !currentUserId.value) return

  try {
    await deleteMutation.mutateAsync({
      id: clienteToDelete.value.id,
      idUsuarioAuditoria: currentUserId.value,
    })
    deleteModalOpen.value = false
    clienteToDelete.value = null
  } catch {}
}

</script>

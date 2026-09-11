<template>
  <div>
    <PageBreadcrumb page-title="Documentos de salida" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          v-model:filters="dynamicFilters"
          :filter-fields="filterFields"
          search-placeholder="Buscar por número, serie, cliente..."
          @filter-change="onFiltersChange"
        >
          <template #actions>
            <router-link
              v-if="canCreate"
              :to="{ name: 'admin-documentos-salida-nueva' }"
              class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 sm:px-4"
              title="Nuevo documento de salida"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              <span class="hidden sm:inline">Nuevo documento</span>
            </router-link>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-numero="{ row }">
        <router-link
          :to="{ name: 'admin-documentos-salida-editar', params: { id: row.id } }"
          class="font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          {{ row.numero }}
        </router-link>
        <p v-if="row.serie && row.numero_sunat" class="text-xs text-gray-500 dark:text-gray-400">
          GRE {{ row.serie }}-{{ row.numero_sunat }}
        </p>
      </template>

      <template #cell-nombre_tipo_orden="{ value }">
        <AppBadge size="sm" color="primary">{{ formatTipoOrden(value) }}</AppBadge>
      </template>

      <template #cell-nombre_estado_ciclo="{ value }">
        <AppBadge size="sm" :color="estadoCicloColor(value)">{{ value }}</AppBadge>
      </template>

      <template #cell-estado_sunat="{ row }">
        <AppBadge v-if="row.nombre_estado_sunat" size="sm" :color="estadoSunatColor(row.nombre_estado_sunat)">
          {{ row.nombre_estado_sunat }}
        </AppBadge>
        <span v-else class="text-xs text-gray-400">—</span>
      </template>

      <template #cell-contraparte="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">
          {{ row.nombre_cliente ?? row.nombre_proveedor ?? '—' }}
        </p>
        <!-- En planta externa el proveedor es el destinatario del documento. -->
        <p
          v-if="!row.nombre_cliente && row.nombre_proveedor && esPlantaExterna(row)"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          Destinatario (planta externa)
        </p>
        <p v-if="row.detalle_desde_venta" class="text-xs text-gray-500 dark:text-gray-400">
          Venta {{ row.serie_venta }}-{{ row.numero_venta }}
        </p>
      </template>

      <template #cell-almacen="{ row }">
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ row.nombre_almacen ?? '—' }}</p>
      </template>

      <template #cell-fecha="{ row }">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ row.fecha }}</p>
      </template>

      <template #cell-total_items="{ value }">
        <span class="tabular-nums">{{ value }}</span>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <router-link
            :to="{ name: 'admin-documentos-salida-editar', params: { id: row.id } }"
            title="Ver / editar"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <AppIcon :name="ICONS.eye" :size="15" />
          </router-link>
          <AppActionMenu
            :items="accionesDeFila(row)"
            :execute="(key) => onAccion(key as DocSalidaAccion, row)"
          />
        </div>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="listQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <!--
      Los modales son los mismos del detalle. El documento completo se pide solo
      cuando se abre una acción: la fila del listado no trae el detalle.
    -->
    <DireccionEntregaModal
      v-if="documentoSeleccionado"
      v-model="direccionModalOpen"
      :id-doc-salida="documentoSeleccionado.id"
      :id-cliente="documentoSeleccionado.id_cliente"
    />
    <ConvertirGreModal v-model="greModalOpen" :documento="documentoSeleccionado" />
    <FinalizarRecargaModal v-model="retornoModalOpen" :documento="documentoSeleccionado" />
    <LoteProtocoloFormModal
      v-model="loteModalOpen"
      mode="create"
      :balones-preset="balonesPreset"
      :id-producto-gas-preset="gasUnicoSeleccionado"
      :id-doc-salida="documentoSeleccionado?.id ?? null"
    />

    <AppModal v-model="anularModalOpen" title="Anular documento" size="sm">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Esto revierte el inventario que este documento haya movido por su cuenta (no aplica a
        lo que ya movió la venta de origen).
      </p>
      <AppInput v-model="anularMotivo" label="Motivo" class="mt-4" />
      <template #footer>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
          @click="anularModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-70"
          :disabled="anularMutation.isPending.value"
          @click="onConfirmarAnular"
        >
          {{ anularMutation.isPending.value ? 'Anulando...' : 'Anular' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  useDocumentoSalidaCatalogosQuery,
  useDocumentoSalidaQuery,
  useDocumentosSalidaQuery,
} from '../composables/useDocumentosSalidaQuery'
import {
  useAnularDocSalidaMutation,
  useGenerarDocSalidaMutation,
} from '../composables/useDocumentoSalidaMutations'
import {
  useDocSalidaAcciones,
  type DocSalidaAccion,
  type DocSalidaAccionesFuente,
} from '../composables/useDocSalidaAcciones'
import { documentosSalidaService } from '../services/documentos-salida.service'
import ConvertirGreModal from '../components/ConvertirGreModal.vue'
import DireccionEntregaModal from '../components/DireccionEntregaModal.vue'
import FinalizarRecargaModal from '../components/FinalizarRecargaModal.vue'
import LoteProtocoloFormModal from '@/modules/balones/lotes-protocolo/components/LoteProtocoloFormModal.vue'
import type {
  CodigoTipoOrdenSalida,
  DocumentoSalidaListFilters,
} from '../interfaces/documento-salida.interface'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import {
  AppActionMenu,
  AppBadge,
  AppInput,
  AppListToolbar,
  AppModal,
  AppPagination,
  AppTable,
} from '@/shared/components'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const breadcrumbItems = [{ label: 'Documentos de salida' }]

const router = useRouter()

const authStore = useAuthStore()
const route = useRoute()

const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<DocumentoSalidaListFilters>({ buscar: '', pagina: 1, limite: 10 })
const listQuery = useDocumentosSalidaQuery(filters)
const catalogosQuery = useDocumentoSalidaCatalogosQuery()

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.DOCUMENTOS_SALIDA_CREAR))

// ---- Acciones de fila ----
// La fila del listado no trae el detalle: al elegir una acción se pide el
// documento completo y recién ahí se abre el modal, que es el mismo del detalle.
const idSeleccionado = ref<number | null>(null)
const documentoQuery = useDocumentoSalidaQuery(idSeleccionado)
const documentoSeleccionado = computed(() => documentoQuery.data.value ?? null)

const direccionModalOpen = ref(false)
const greModalOpen = ref(false)
const retornoModalOpen = ref(false)
const loteModalOpen = ref(false)
const anularModalOpen = ref(false)
const anularMotivo = ref('')

const generarMutation = useGenerarDocSalidaMutation()
const anularMutation = useAnularDocSalidaMutation()

const filaActiva = ref<DocSalidaAccionesFuente | null>(null)
const { accionesMenu } = useDocSalidaAcciones(filaActiva)

function accionesDeFila(row: DocSalidaAccionesFuente): ActionMenuItem[] {
  filaActiva.value = row
  return accionesMenu.value
}

const balonesDelSeleccionado = computed(
  () => (documentoSeleccionado.value?.detalle ?? []).filter((linea) => linea.id_balon != null),
)

const balonesPreset = computed(() =>
  balonesDelSeleccionado.value.map((linea) => ({
    idBalon: linea.id_balon as number,
    codigoBalon: linea.codigo_balon ?? '',
    nombreTipoBalon: linea.nombre_tipo_balon,
    numeroSerie: linea.numero_serie_balon,
  })),
)

/** Una ficha ICP cubre un solo gas: solo aplica si todos los cilindros coinciden. */
const gasUnicoSeleccionado = computed(() => {
  const balones = balonesDelSeleccionado.value
  if (!balones.length) return null
  const primero = balones[0].id_producto_gas_balon
  if (primero == null) return null
  return balones.every((b) => b.id_producto_gas_balon === primero) ? primero : null
})

const esPlantaExterna = (row: DocSalidaAccionesFuente) =>
  row.nombre_tipo_orden === 'RECARGA_PLANTA_EXTERNA'

async function onAccion(accion: DocSalidaAccion, row: DocSalidaAccionesFuente) {
  if (accion === 'ver') {
    void router.push({ name: 'admin-documentos-salida-editar', params: { id: row.id } })
    return
  }

  if (accion === 'generar') {
    await generarMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: authStore.user?.id })
    return
  }

  if (accion === 'pdf') {
    try {
      const blob = await documentosSalidaService.obtenerPdf(row.id)
      window.open(URL.createObjectURL(blob), '_blank')
      toastSuccess('PDF generado')
    } catch (error) {
      toastApiError(error, 'No se pudo generar el PDF')
    }
    return
  }

  // El resto necesita el documento completo para poblar su modal.
  idSeleccionado.value = row.id
  await documentoQuery.refetch()

  // Los datos de traslado se editan en el propio detalle, no en un modal suelto.
  if (accion === 'traslado') {
    void router.push({ name: 'admin-documentos-salida-editar', params: { id: row.id } })
  }
  if (accion === 'direccion') direccionModalOpen.value = true
  if (accion === 'gre') greModalOpen.value = true
  if (accion === 'retorno') retornoModalOpen.value = true
  if (accion === 'lote') loteModalOpen.value = true
  if (accion === 'emitir') {
    void router.push({ name: 'admin-documentos-salida-editar', params: { id: row.id } })
  }
  if (accion === 'anular') {
    anularMotivo.value = ''
    anularModalOpen.value = true
  }
}

async function onConfirmarAnular() {
  if (!documentoSeleccionado.value) return
  await anularMutation.mutateAsync({
    id: documentoSeleccionado.value.id,
    payload: { motivo: anularMotivo.value || undefined, idUsuarioAuditoria: authStore.user?.id },
  })
  anularModalOpen.value = false
}

const isLoading = computed(() => listQuery.isFetching.value)
const rows = computed(() => listQuery.data.value?.data ?? [])

const TIPO_LABELS: Record<string, string> = {
  ORDEN_SALIDA_VENTA: 'Orden de venta',
  ORDEN_SALIDA_INTERNA: 'Orden interna',
  RECARGA_PLANTA_EXTERNA: 'Recarga planta',
  TRASLADO: 'Traslado',
}
function formatTipoOrden(codigo: unknown) {
  const key = String(codigo ?? '')
  return TIPO_LABELS[key] ?? key
}

function estadoCicloColor(estado: unknown) {
  if (estado === 'ANULADA') return 'error'
  if (estado === 'EMITIDA_SUNAT') return 'success'
  if (estado === 'GENERADA') return 'primary'
  return 'warning'
}

function estadoSunatColor(estado: string) {
  if (estado === 'ACEPTADO') return 'success'
  if (estado === 'RECHAZADO') return 'error'
  return 'warning'
}

const filterFields = computed<DynamicFilterFieldDef[]>(() => [
  {
    key: 'codigoTipoOrden',
    label: 'Tipo',
    type: 'select',
    placeholder: 'Todos',
    options: Object.entries(TIPO_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    key: 'idEstadoCiclo',
    label: 'Estado',
    type: 'select',
    placeholder: 'Todos',
    disabled: catalogosQuery.isLoading.value,
    options: (catalogosQuery.data.value?.estadosCiclo ?? []).map((o) => ({
      value: o.id,
      label: formatListaOpcionLabel(o.nombre, o.descripcion),
    })),
  },
  {
    key: 'idAlmacen',
    label: 'Almacén',
    type: 'select',
    placeholder: 'Todos',
    disabled: almacenesQuery.isLoading.value,
    options: (almacenesQuery.data.value?.data ?? []).map((a) => ({
      value: a.id,
      label: a.nombre,
    })),
  },
  {
    key: 'idCliente',
    label: 'Cliente',
    type: 'select',
    placeholder: 'Seleccionar cliente',
    searchable: true,
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
    key: 'emitidoSunat',
    label: 'Emitido SUNAT',
    type: 'select',
    placeholder: 'Todos',
    options: [
      { value: '1', label: 'Sí' },
      { value: '0', label: 'No' },
    ],
  },
  {
    key: 'fechaDesde',
    label: 'Desde',
    type: 'date',
  },
  {
    key: 'fechaHasta',
    label: 'Hasta',
    type: 'date',
  },
])

const columns: TableColumn[] = [
  { key: 'numero', label: 'Número', mobile: 'primary' },
  { key: 'nombre_tipo_orden', label: 'Tipo', mobile: 'badge' },
  { key: 'nombre_estado_ciclo', label: 'Estado' },
  { key: 'estado_sunat', label: 'SUNAT' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'contraparte', label: 'Cliente / Destinatario' },
  { key: 'almacen', label: 'Almacén' },
  { key: 'total_items', label: 'Ítems', align: 'right' },
]

function syncFilters() {
  const active = dynamicFilters.value
  const codigoFromQuery = String(route.query.codigoTipoOrden ?? '') as CodigoTipoOrdenSalida | ''

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
    codigoTipoOrden:
      (active.codigoTipoOrden as CodigoTipoOrdenSalida) || codigoFromQuery || undefined,
    idEstadoCiclo: active.idEstadoCiclo != null ? Number(active.idEstadoCiclo) : undefined,
    idAlmacen: active.idAlmacen != null ? Number(active.idAlmacen) : undefined,
    idCliente: active.idCliente != null ? Number(active.idCliente) : undefined,
    emitidoSunat:
      active.emitidoSunat != null && active.emitidoSunat !== ''
        ? active.emitidoSunat === '1' || active.emitidoSunat === true
        : undefined,
    fechaDesde: active.fechaDesde ? String(active.fechaDesde) : undefined,
    fechaHasta: active.fechaHasta ? String(active.fechaHasta) : undefined,
  }
}

function onFiltersChange() {
  pagina.value = 1
  syncFilters()
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

watch(
  () => route.query.codigoTipoOrden,
  () => syncFilters(),
  { immediate: true },
)
</script>

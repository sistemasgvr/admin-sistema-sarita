<template>
  <div>
    <PageBreadcrumb page-title="Ruta pueblos" :items="breadcrumbItems" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          search-placeholder="Almacén, chofer, observación..."
        >
          <template #actions>
            <button
              v-if="canCreate"
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
              @click="formOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nueva ruta
            </button>
          </template>
        </AppListToolbar>
      </template>

      <template #cell-fecha="{ row }">
        <span class="whitespace-nowrap">{{ row.fecha?.slice(0, 10) || '—' }}</span>
      </template>

      <template #cell-nombre_estado="{ value }">
        <ListaOpcionBadge :value="value as string" />
      </template>

      <template #cell-cilindros="{ row }">
        <span class="tabular-nums">
          {{ row.total_retornados ?? 0 }}/{{ row.total_cilindros ?? 0 }}
        </span>
      </template>

      <template #cell-m3="{ row }">
        <div class="text-right text-sm tabular-nums">
          <p>{{ Number(row.m3_calculado ?? 0).toFixed(2) }} calc.</p>
          <p v-if="row.m3_reportado_ventas != null" class="text-xs text-gray-500">
            {{ Number(row.m3_reportado_ventas).toFixed(2) }} rep.
          </p>
        </div>
      </template>

      <template #cell-descuadre="{ row }">
        <span
          v-if="row.descuadre_m3 != null"
          class="tabular-nums text-sm font-medium"
          :class="
            Math.abs(Number(row.descuadre_m3)) > Number(row.tolerancia_m3 ?? 0.5)
              ? 'text-error-600'
              : 'text-success-600'
          "
        >
          {{ Number(row.descuadre_m3).toFixed(3) }}
        </span>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #actions="{ row }">
        <div class="inline-flex items-center justify-end gap-1.5">
          <button
            v-if="canEdit && row.nombre_estado === 'ABIERTA'"
            type="button"
            title="Iniciar ruta"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-300 text-brand-600 transition hover:bg-brand-50 dark:border-brand-700 dark:hover:bg-brand-500/10"
            @click="askIniciar(row)"
          >
            <AppIcon :name="ICONS.mapPin" :size="15" />
          </button>
          <button
            v-if="canEdit && (row.nombre_estado === 'ABIERTA' || row.nombre_estado === 'EN_RUTA')"
            type="button"
            title="Registrar retorno"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="openRetorno(row)"
          >
            <AppIcon :name="ICONS.truck" :size="15" />
          </button>
          <button
            v-if="
              canEdit &&
              row.nombre_estado === 'EN_RUTA' &&
              Number(row.total_retornados) >= Number(row.total_cilindros)
            "
            type="button"
            title="Cerrar ruta"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-success-300 text-success-600 transition hover:bg-success-50 dark:border-success-700 dark:hover:bg-success-500/10"
            @click="openCerrar(row)"
          >
            <AppIcon :name="ICONS.clipboardCheck" :size="15" />
          </button>
          <AppActionMenu
            v-if="actionsFor(row).length"
            :items="actionsFor(row)"
            :execute="(k) => onAction(k, row)"
          />
        </div>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="query.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <RutaPuebloFormModal v-model="formOpen" @saved="refresh" />
    <RutaPuebloRetornoModal v-model="retornoOpen" :ruta-id="rutaActivaId" @saved="refresh" />
    <RutaPuebloCerrarModal v-model="cerrarOpen" :ruta-id="rutaActivaId" @saved="refresh" />

    <AppConfirmDialog
      v-model="iniciarOpen"
      title="Iniciar ruta"
      variant="info"
      confirm-label="Iniciar"
      loading-label="Iniciando..."
      :loading="iniciarMutation.isPending.value"
      @confirm="confirmarIniciar"
    >
      Los cilindros pasarán a tránsito (EN_RUTA). ¿Continuar?
    </AppConfirmDialog>

    <AppConfirmDialog
      v-model="cancelarOpen"
      title="Cancelar ruta"
      variant="warning"
      confirm-label="Cancelar ruta"
      loading-label="Cancelando..."
      :loading="updateMutation.isPending.value"
      @confirm="confirmarCancelar"
    >
      ¿Cancelar la ruta? Si está EN_RUTA, los cilindros sin retorno vuelven al almacén con las lb de salida restauradas.
    </AppConfirmDialog>

    <AppConfirmDialog
      v-model="eliminarOpen"
      title="Eliminar ruta"
      variant="danger"
      confirm-label="Sí, eliminar"
      loading-label="Eliminando..."
      :loading="deleteMutation.isPending.value"
      @confirm="confirmarEliminar"
    >
      Baja lógica de la ruta. ¿Continuar?
    </AppConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useDeleteRutaPuebloMutation,
  useIniciarRutaPuebloMutation,
  useUpdateRutaPuebloMutation,
} from '@/modules/balones/rutas-pueblos/composables/useRutasPueblosMutations'
import { useRutasPueblosQuery } from '@/modules/balones/rutas-pueblos/composables/useRutasPueblosQuery'
import RutaPuebloCerrarModal from '@/modules/balones/rutas-pueblos/components/RutaPuebloCerrarModal.vue'
import RutaPuebloFormModal from '@/modules/balones/rutas-pueblos/components/RutaPuebloFormModal.vue'
import RutaPuebloRetornoModal from '@/modules/balones/rutas-pueblos/components/RutaPuebloRetornoModal.vue'
import type { RutaPueblo } from '@/modules/balones/rutas-pueblos/interfaces/ruta-pueblo.interface'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppConfirmDialog,
  AppListToolbar,
  AppPagination,
  AppTable,
  ListaOpcionBadge,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'

const authStore = useAuthStore()

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)
const formOpen = ref(false)
const retornoOpen = ref(false)
const cerrarOpen = ref(false)
const iniciarOpen = ref(false)
const cancelarOpen = ref(false)
const eliminarOpen = ref(false)
const rutaActivaId = ref<number | null>(null)
const rutaSeleccionada = ref<RutaPueblo | null>(null)

const filters = ref({
  buscar: '',
  pagina: 1,
  limite: 10,
})

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

function syncFilters() {
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: pagina.value,
    limite: limite.value,
  }
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    syncFilters()
  }, 300)
})

watch([pagina, limite], () => {
  syncFilters()
})

syncFilters()

const query = useRutasPueblosQuery(filters)
const iniciarMutation = useIniciarRutaPuebloMutation()
const updateMutation = useUpdateRutaPuebloMutation()
const deleteMutation = useDeleteRutaPuebloMutation()

const rows = computed(() => query.data.value?.data ?? [])
const isLoading = computed(() => query.isFetching.value)
const breadcrumbItems = balonesBreadcrumbItems('Ruta pueblos')

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.RUTAS_PUEBLOS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.RUTAS_PUEBLOS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.RUTAS_PUEBLOS_ELIMINAR))

const columns = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'nombre_almacen', label: 'Almacén' },
  { key: 'nombre_chofer', label: 'Chofer' },
  { key: 'nombre_estado', label: 'Estado' },
  { key: 'cilindros', label: 'Cil.' },
  { key: 'm3', label: 'm³' },
  { key: 'descuadre', label: 'Descuadre' },
]

function refresh() {
  void query.refetch()
}

function openRetorno(row: RutaPueblo) {
  rutaActivaId.value = row.id
  retornoOpen.value = true
}

function openCerrar(row: RutaPueblo) {
  rutaActivaId.value = row.id
  cerrarOpen.value = true
}

function askIniciar(row: RutaPueblo) {
  rutaSeleccionada.value = row
  iniciarOpen.value = true
}

function actionsFor(row: RutaPueblo) {
  const items: { key: string; label: string }[] = []
  if (canEdit.value && row.nombre_estado !== 'CERRADA' && row.nombre_estado !== 'CANCELADA') {
    items.push({ key: 'cancelar', label: 'Cancelar' })
  }
  if (canDelete.value && row.nombre_estado !== 'EN_RUTA') {
    items.push({ key: 'eliminar', label: 'Eliminar' })
  }
  return items
}

function onAction(key: string, row: RutaPueblo) {
  rutaSeleccionada.value = row
  if (key === 'cancelar') cancelarOpen.value = true
  if (key === 'eliminar') eliminarOpen.value = true
}

async function confirmarIniciar() {
  const userId = authStore.user?.id
  const row = rutaSeleccionada.value
  if (!userId || !row) return
  await iniciarMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: userId })
  iniciarOpen.value = false
}

async function confirmarCancelar() {
  const userId = authStore.user?.id
  const row = rutaSeleccionada.value
  if (!userId || !row) return
  await updateMutation.mutateAsync({
    id: row.id,
    payload: { idUsuarioAuditoria: userId, estadoNombre: 'CANCELADA' },
  })
  cancelarOpen.value = false
}

async function confirmarEliminar() {
  const userId = authStore.user?.id
  const row = rutaSeleccionada.value
  if (!userId || !row) return
  await deleteMutation.mutateAsync({ id: row.id, idUsuarioAuditoria: userId })
  eliminarOpen.value = false
}
</script>

<template>
  <div>
    <PageBreadcrumb page-title="Cuentas Bancarias" />

    <AppTable :columns="columns" :rows="rows" row-key="id" :loading="isLoading">
      <template #toolbar>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div class="w-full sm:max-w-sm">
              <AppInput
                v-model="buscar"
                type="search"
                placeholder="Buscar por titular, número de cuenta o CCI..."
              />
            </div>

            <div class="w-full sm:w-48">
              <AppSelect v-model="mostrarCuentas" :options="estadoFiltroOptions" />
            </div>
          </div>

          <button
            v-if="canCreate"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            @click="openCreateModal"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
            Nuevo
          </button>
        </div>
      </template>

      <template #cell-cuenta="{ row }">
        <p class="truncate font-medium text-gray-800 dark:text-white/90">
          {{ row.titular || '—' }}
        </p>
        <p class="text-theme-xs text-gray-500 dark:text-gray-400">
          {{ row.nombre_banco ? `${row.nombre_banco} / ${row.nombre_tipo_cuenta ?? ''}` : '' }}
           <AppBadge v-if="row.es_principal" color="neutral" size="sm">Pincipal</AppBadge>
        </p>
      </template>

      <template #cell-numero_cuenta="{ row }">
        <span class="font-mono text-sm text-gray-700 dark:text-gray-300">
          {{ row.numero_cuenta || '—' }}
        </span>
      </template>

      <template #cell-cliente="{ row }">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ row.id_cliente ? getNombreCliente(row) : '—' }}
        </span>
      </template>

      <template #cell-estado="{ row }">
        <div class="flex items-center gap-1.5">
          <AppBadge :color="row.estado === 1 ? 'success' : 'error'">
            {{ row.estado === 1 ? 'Activo' : 'Inactivo' }}
          </AppBadge>
        </div>
      </template>

      <template #actions="{ row }">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          @click="openDetailModal(row)"
        >
          <AppIcon :name="ICONS.eye" :size="16" />
        </button>

        <button
          v-if="canEdit"
          type="button"
          class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          @click="openEditModal(row)"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
        </button>

        <button
          v-if="canDelete && row.estado === 1"
          type="button"
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
          :meta="query.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <CuentaBancariaFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :cuenta="selectedCuenta"
      @saved="onSaved"
    />

    <CuentaBancariaDetailModal v-model="detailModalOpen" :cuenta="cuentaToView" />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar cuenta bancaria"
      subtitle="Esta acción desactivará la cuenta bancaria (baja lógica)."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas desactivar la cuenta de
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ cuentaToDelete?.titular || '' }}
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
import CuentaBancariaDetailModal from '@/modules/cuentas-bancarias/components/CuentaBancariaDetailModal.vue'
import CuentaBancariaFormModal from '@/modules/cuentas-bancarias/components/CuentaBancariaFormModal.vue'
import { useCuentasBancariasQuery } from '@/modules/cuentas-bancarias/composables/useCuentasBancariasQuery'
import { useDeleteCuentaBancariaMutation } from '@/modules/cuentas-bancarias/composables/useCuentaBancariaMutations'
import type {
  CuentaBancaria,
  CuentaBancariaEstadoFiltro,
  CuentaBancariaFormMode,
  CuentaBancariaListFilters,
} from '@/modules/cuentas-bancarias/interfaces/cuenta-bancaria.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppBadge,
  AppInput,
  AppModal,
  AppPagination,
  AppSelect,
  AppTable,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()

const buscar = ref('')
const mostrarCuentas = ref<CuentaBancariaEstadoFiltro>('activos')
const pagina = ref(1)
const limite = ref(10)

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]

const buildIsActivos = (value: CuentaBancariaEstadoFiltro): number | undefined => {
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

const filters = ref<CuentaBancariaListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
  isActivos: 1,
})

const query = useCuentasBancariasQuery(filters)
const deleteMutation = useDeleteCuentaBancariaMutation()

const formModalOpen = ref(false)
const formMode = ref<CuentaBancariaFormMode>('create')
const selectedCuenta = ref<CuentaBancaria | null>(null)

const detailModalOpen = ref(false)
const cuentaToView = ref<CuentaBancaria | null>(null)

const deleteModalOpen = ref(false)
const cuentaToDelete = ref<CuentaBancaria | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.CUENTAS_BANCARIAS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.CUENTAS_BANCARIAS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.CUENTAS_BANCARIAS_ELIMINAR))

const isLoading = computed(() => query.isFetching.value)
const rows = computed(() => query.data.value?.data ?? [])

const getNombreCliente = (cuenta: CuentaBancaria) => {
  if (cuenta.cliente_razon_social) return cuenta.cliente_razon_social
  const nombreCompleto = [cuenta.cliente_nombres, cuenta.cliente_apellido_paterno, cuenta.cliente_apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()
  return nombreCompleto || cuenta.cliente_numero_documento || '—'
}

const columns = computed<TableColumn<CuentaBancaria>[]>(() => [
  { key: 'cuenta', label: 'Titular / Banco' },
  { key: 'numero_cuenta', label: 'Nro. Cuenta' },
  { key: 'numero_cuenta_interbancaria', label: 'CCI' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'estado', label: 'Estado' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

watch(buscar, (value) => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    filters.value = {
      ...filters.value,
      buscar: value.trim(),
      pagina: 1,
    }
  }, 350)
})

watch(mostrarCuentas, (value) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    isActivos: buildIsActivos(value),
    pagina: 1,
  }
})

watch([pagina, limite], () => {
  filters.value = {
    ...filters.value,
    pagina: pagina.value,
    limite: limite.value,
  }
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedCuenta.value = null
  formModalOpen.value = true
}

const openEditModal = (cuenta: CuentaBancaria) => {
  formMode.value = 'edit'
  selectedCuenta.value = cuenta
  formModalOpen.value = true
}

const openDetailModal = (cuenta: CuentaBancaria) => {
  cuentaToView.value = cuenta
  detailModalOpen.value = true
}

const openDeleteModal = (cuenta: CuentaBancaria) => {
  cuentaToDelete.value = cuenta
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!cuentaToDelete.value || !currentUserId.value) return

  try {
    await deleteMutation.mutateAsync({
      id: cuentaToDelete.value.id,
      idUsuarioAuditoria: currentUserId.value,
    })
    deleteModalOpen.value = false
    cuentaToDelete.value = null
  } catch {}
}

const onSaved = () => {
  selectedCuenta.value = null
}
</script>

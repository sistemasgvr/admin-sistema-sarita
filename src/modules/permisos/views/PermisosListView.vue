<template>
  <div>
    <PageBreadcrumb
      page-title="Permisos"
      help="Las banderas se dan de alta en código (seeds SQL). Aquí solo se consultan y se asignan a roles."
    />

    <AppTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :loading="isLoading"
      :show-actions="false"
    >
      <template #toolbar>
        <AppListToolbar
          v-model:search="buscar"
          search-placeholder="Nombre o descripción..."
        />
      </template>

      <template #cell-nombre="{ row }">
        <AppBadge color="neutral">{{ row.nombre }}</AppBadge>
      </template>

      <template #footer>
        <AppPagination
          v-model:pagina="pagina"
          v-model:limite="limite"
          :meta="permisosQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { usePermisosQuery } from '@/modules/permisos/composables/usePermisosQuery'
import type { Permiso, PermisoListFilters } from '@/modules/permisos/interfaces/permiso.interface'
import { AppBadge, AppListToolbar, AppPagination, AppTable } from '@/shared/components'
import { formatDateTime } from '@/shared/utils/date'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<PermisoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const permisosQuery = usePermisosQuery(filters)

const isLoading = computed(() => permisosQuery.isFetching.value)
const rows = computed(() => permisosQuery.data.value?.data ?? [])

const columns = computed<TableColumn<Permiso>[]>(() => [
  { key: 'nombre', label: 'Bandera' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cantidad_roles', label: 'Roles' },
  {
    key: 'fecha_creacion',
    label: 'Creado',
    formatter: (value) => formatDateTime(value as string),
  },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
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
  }, 350)
})

watch([pagina, limite], () => {
  syncFilters()
})
</script>

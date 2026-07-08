<template>
  <div>
    <PageBreadcrumb page-title="Subcategorías" :items="breadcrumbItems" />

    <AppTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :loading="isLoading"
    >
      <template #toolbar>
        <div class="flex flex-col gap-4">
          <div v-if="canCreate" class="flex justify-end">
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              @click="openCreateModal"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Nueva subcategoría
            </button>
          </div>

          <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AppSelect
              v-model="idCategoriaFiltro"
              label="Categoría"
              placeholder="Todas"
              :options="categoriaFilterOptions"
            />

            <div class="sm:col-span-2 lg:col-span-1">
              <AppInput
                v-model="buscar"
                label="Buscar"
                type="search"
                placeholder="Nombre..."
              />
            </div>
          </div>
        </div>
      </template>

      <template #cell-total_productos="{ value }">
        <AppBadge variant="light">{{ value ?? 0 }}</AppBadge>
      </template>

      <template #actions="{ row }">
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
          :meta="subCategoriasQuery.data.value?.meta"
          :disabled="isLoading"
        />
      </template>
    </AppTable>

    <SubCategoriaProductoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :sub-categoria="selectedSubCategoria"
      :categorias="categorias"
      @saved="onSubCategoriaSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar subcategoría"
      subtitle="No se puede eliminar si tiene productos activos."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ subCategoriaToDelete?.nombre }}
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { categoriasProductoService } from '@/modules/productos/categorias/services/categorias-producto.service'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import SubCategoriaProductoFormModal from '@/modules/productos/sub-categorias/components/SubCategoriaProductoFormModal.vue'
import { useDeleteSubCategoriaProductoMutation } from '@/modules/productos/sub-categorias/composables/useSubCategoriaProductoMutations'
import { useSubCategoriasProductoQuery } from '@/modules/productos/sub-categorias/composables/useSubCategoriasProductoQuery'
import { productosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import type {
  SubCategoriaProducto,
  SubCategoriaProductoFormMode,
  SubCategoriaProductoListFilters,
} from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppInput, AppModal, AppPagination, AppSelect, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const authStore = useAuthStore()
const route = useRoute()
const breadcrumbItems = productosBreadcrumbItems('Subcategorías')

const categorias = ref<CategoriaProducto[]>([])
const idCategoriaFiltro = ref<string | number>('')
const buscar = ref('')
const pagina = ref(1)
const limite = ref(10)

const filters = ref<SubCategoriaProductoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 10,
})

const subCategoriasQuery = useSubCategoriasProductoQuery(filters)
const deleteMutation = useDeleteSubCategoriaProductoMutation()

const formModalOpen = ref(false)
const formMode = ref<SubCategoriaProductoFormMode>('create')
const selectedSubCategoria = ref<SubCategoriaProducto | null>(null)

const deleteModalOpen = ref(false)
const subCategoriaToDelete = ref<SubCategoriaProducto | null>(null)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_ELIMINAR))

const isLoading = computed(() => subCategoriasQuery.isFetching.value)
const rows = computed(() => subCategoriasQuery.data.value?.data ?? [])

const categoriaFilterOptions = computed(() => [
  { value: '', label: 'Todas las categorías' },
  ...categorias.value.map((categoria) => ({
    value: categoria.id,
    label: categoria.nombre,
  })),
])

const columns = computed<TableColumn<SubCategoriaProducto>[]>(() => [
  { key: 'nombre_categoria', label: 'Categoría' },
  { key: 'nombre', label: 'Subcategoría' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'total_productos', label: 'Productos' },
])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

onMounted(async () => {
  try {
    const response = await categoriasProductoService.listar({ pagina: 1, limite: 100 })
    categorias.value = response.data
  } catch {
    categorias.value = []
  }

  const idCategoriaQuery = route.query.idCategoria
  if (idCategoriaQuery) {
    idCategoriaFiltro.value = Number(idCategoriaQuery)
  }
})

watch(idCategoriaFiltro, (value) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    idCategoria: value ? Number(value) : undefined,
    pagina: 1,
  }
})

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

watch([pagina, limite], () => {
  filters.value = {
    ...filters.value,
    pagina: pagina.value,
    limite: limite.value,
  }
})

const openCreateModal = () => {
  formMode.value = 'create'
  selectedSubCategoria.value = null
  formModalOpen.value = true
}

const openEditModal = (subCategoria: SubCategoriaProducto) => {
  formMode.value = 'edit'
  selectedSubCategoria.value = subCategoria
  formModalOpen.value = true
}

const openDeleteModal = (subCategoria: SubCategoriaProducto) => {
  subCategoriaToDelete.value = subCategoria
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!subCategoriaToDelete.value) return

  try {
    await deleteMutation.mutateAsync(subCategoriaToDelete.value.id)
    deleteModalOpen.value = false
    subCategoriaToDelete.value = null
  } catch {
    // toast en mutation
  }
}

const onSubCategoriaSaved = () => {
  selectedSubCategoria.value = null
}
</script>

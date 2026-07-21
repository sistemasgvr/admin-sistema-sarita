<template>
  <AppModal
    v-model="open"
    :title="categoria ? `Subcategorías de ${categoria.nombre}` : 'Subcategorías'"
    subtitle="Agrega, edita o quita subcategorías de esta categoría."
    size="lg"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="w-full sm:max-w-sm">
          <AppInput
            v-model="buscar"
            type="search"
            placeholder="Buscar subcategoría..."
            :disabled="isLoading"
          />
        </div>

        <button
          v-if="canCreate"
          type="button"
          class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
          :disabled="!categoria"
          @click="openCreateModal"
        >
          <AppIcon :name="ICONS.plus" :size="18" />
          Nueva subcategoría
        </button>
      </div>

      <div
        v-if="isLoading"
        class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        Cargando subcategorías...
      </div>

      <div
        v-else-if="!rows.length"
        class="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center dark:border-gray-800"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Esta categoría no tiene subcategorías registradas.
        </p>
        <button
          v-if="canCreate"
          type="button"
          class="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          @click="openCreateModal"
        >
          <AppIcon :name="ICONS.plus" :size="16" />
          Agregar primera subcategoría
        </button>
      </div>

      <div
        v-else
        class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
      >
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead class="bg-gray-50 dark:bg-white/[0.03]">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Nombre
              </th>
              <th
                class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:table-cell"
              >
                Descripción
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Productos
              </th>
              <th
                v-if="canEdit || canDelete"
                class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
            <tr v-for="subCategoria in rows" :key="subCategoria.id">
              <td class="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                {{ subCategoria.nombre }}
              </td>
              <td class="hidden px-4 py-3 text-sm text-gray-500 dark:text-gray-400 sm:table-cell">
                {{ subCategoria.descripcion || '—' }}
              </td>
              <td class="px-4 py-3">
                <AppBadge variant="light">{{ subCategoria.total_productos ?? 0 }}</AppBadge>
              </td>
              <td
                v-if="canEdit || canDelete"
                class="px-4 py-3 text-right"
              >
                <div class="inline-flex items-center justify-end">
                  <AppActionMenu
                    :items="actionItemsForRow(subCategoria)"
                    :execute="(key) => onActionSelect(key, subCategoria)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="handleClose"
      >
        Cerrar
      </button>
    </template>

    <SubCategoriaProductoFormModal
      v-model="formModalOpen"
      :mode="formMode"
      :sub-categoria="selectedSubCategoria"
      :categorias="categoria ? [categoria] : []"
      :default-categoria-id="categoria?.id ?? null"
      lock-categoria
      @saved="onSubCategoriaSaved"
    />

    <AppModal
      v-model="deleteModalOpen"
      title="Eliminar subcategoría"
      :subtitle="
        deleteBlockedByProductos
          ? 'Esta subcategoría tiene productos activos.'
          : 'No se puede eliminar si tiene productos activos.'
      "
      size="sm"
    >
      <div
        v-if="deleteBlockedByProductos"
        class="rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
      >
        No puedes eliminar
        <span class="font-medium">{{ subCategoriaToDelete?.nombre }}</span>
        porque tiene productos asociados. Reasigna o elimina esos productos e
        inténtalo de nuevo.
      </div>

      <p v-else class="text-sm text-gray-600 dark:text-gray-400">
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
          {{ deleteBlockedByProductos ? 'Cerrar' : 'Cancelar' }}
        </button>
        <button
          v-if="!deleteBlockedByProductos"
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="deleteMutation.isPending.value"
          @click="confirmDelete"
        >
          {{ deleteMutation.isPending.value ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </AppModal>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import SubCategoriaProductoFormModal from '@/modules/productos/sub-categorias/components/SubCategoriaProductoFormModal.vue'
import { useDeleteSubCategoriaProductoMutation } from '@/modules/productos/sub-categorias/composables/useSubCategoriaProductoMutations'
import { useSubCategoriasProductoQuery } from '@/modules/productos/sub-categorias/composables/useSubCategoriasProductoQuery'
import type {
  SubCategoriaProducto,
  SubCategoriaProductoFormMode,
  SubCategoriaProductoListFilters,
} from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppActionMenu, AppBadge, AppInput, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'

interface CategoriaSubcategoriasModalProps {
  categoria?: CategoriaProducto | null
}

const props = defineProps<CategoriaSubcategoriasModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  changed: []
}>()

const authStore = useAuthStore()
const deleteMutation = useDeleteSubCategoriaProductoMutation()

const buscar = ref('')
const filters = ref<SubCategoriaProductoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 100,
})

const subCategoriasQuery = useSubCategoriasProductoQuery(filters)

const formModalOpen = ref(false)
const formMode = ref<SubCategoriaProductoFormMode>('create')
const selectedSubCategoria = ref<SubCategoriaProducto | null>(null)

const deleteModalOpen = ref(false)
const subCategoriaToDelete = ref<SubCategoriaProducto | null>(null)
const deleteBlockedByProductos = computed(
  () => Number(subCategoriaToDelete.value?.total_productos ?? 0) > 0,
)

const canCreate = computed(() => authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_CREAR))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_EDITAR))
const canDelete = computed(() => authStore.hasPermission(PermisoBanderas.SUB_CATEGORIAS_ELIMINAR))

const isLoading = computed(() => subCategoriasQuery.isFetching.value)
const rows = computed(() => subCategoriasQuery.data.value?.data ?? [])

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const syncFilters = () => {
  if (!props.categoria) return

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: 1,
    limite: 100,
    idCategoria: props.categoria.id,
  }
}

const resetState = () => {
  buscar.value = ''
  filters.value = { buscar: '', pagina: 1, limite: 100 }
  selectedSubCategoria.value = null
  subCategoriaToDelete.value = null
  formModalOpen.value = false
  deleteModalOpen.value = false
}

const handleClose = () => {
  open.value = false
}

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
    emit('changed')
  } catch {
    // toast en mutation
  }
}

function actionItemsForRow(row: SubCategoriaProducto): ActionMenuItem[] {
  const busy = deleteMutation.isPending.value
  const blockedByProductos = Number(row.total_productos ?? 0) > 0

  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: ICONS.pencil,
      disabled: busy,
      hidden: !canEdit.value,
    },
    {
      key: 'delete',
      label: blockedByProductos ? 'Eliminar (tiene productos)' : 'Eliminar',
      icon: ICONS.trash,
      danger: !blockedByProductos,
      disabled: busy || blockedByProductos,
      hidden: !canDelete.value,
    },
  ]
}

function onActionSelect(key: string, row: SubCategoriaProducto) {
  switch (key) {
    case 'edit':
      openEditModal(row)
      return
    case 'delete':
      openDeleteModal(row)
      return
  }
}

const onSubCategoriaSaved = () => {
  selectedSubCategoria.value = null
  emit('changed')
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    syncFilters()
  }, 350)
})

watch(open, (isOpen) => {
  if (isOpen && props.categoria) {
    buscar.value = ''
    syncFilters()
    return
  }

  if (!isOpen) {
    resetState()
  }
})

watch(
  () => props.categoria?.id,
  () => {
    if (open.value && props.categoria) {
      syncFilters()
    }
  },
)
</script>

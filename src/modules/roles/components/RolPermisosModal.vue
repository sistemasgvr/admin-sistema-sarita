<template>
  <AppModal
    v-model="open"
    title="Permisos del rol"
    :subtitle="rol ? `Gestiona los permisos asignados a ${rol.nombre}.` : undefined"
    size="lg"
    @close="handleClose"
  >
    <div v-if="isLoading" class="py-8 text-center text-sm text-gray-500">
      Cargando permisos...
    </div>

    <div v-else class="space-y-5">
      <AppInput
        v-model="buscar"
        type="search"
        placeholder="Buscar permiso..."
        :disabled="isSaving"
      />

      <div
        v-for="group in filteredGroups"
        :key="group.name"
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
      >
        <h5 class="mb-3 text-sm font-semibold capitalize text-gray-800 dark:text-white/90">
          {{ group.label }}
        </h5>

        <div class="grid gap-2 sm:grid-cols-2">
          <AppCheckbox
            v-for="permiso in group.items"
            :key="permiso.id"
            :model-value="selectedPermisoIds.has(permiso.id)"
            :disabled="!canManage || isSaving"
            @update:model-value="(checked) => togglePermiso(permiso.id, checked)"
          >
            <span class="font-medium">{{ permiso.nombre }}</span>
            <span
              v-if="permiso.descripcion"
              class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400"
            >
              {{ permiso.descripcion }}
            </span>
          </AppCheckbox>
        </div>
      </div>

      <p v-if="!filteredGroups.length" class="text-sm text-gray-500 dark:text-gray-400">
        No se encontraron permisos.
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSaving"
        @click="handleClose"
      >
        Cerrar
      </button>
      <button
        v-if="canManage"
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSaving || !hasChanges"
        @click="handleSave"
      >
        {{ isSaving ? 'Guardando...' : 'Guardar permisos' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useAsignarRolPermisoMutation,
  useQuitarRolPermisoMutation,
} from '@/modules/roles/composables/useRolMutations'
import { useRolPermisosAsignadosQuery } from '@/modules/roles/composables/useRolesQuery'
import type { Rol } from '@/modules/roles/interfaces/rol.interface'
import { permisosService } from '@/modules/permisos/services/permisos.service'
import type { Permiso } from '@/modules/permisos/interfaces/permiso.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppCheckbox, AppInput, AppModal } from '@/shared/components'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { toastSuccess } from '@/shared/composables/useToast'

interface RolPermisosModalProps {
  rol?: Rol | null
}

const props = defineProps<RolPermisosModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const asignarMutation = useAsignarRolPermisoMutation()
const quitarMutation = useQuitarRolPermisoMutation()

const allPermisos = ref<Permiso[]>([])
const asignacionByPermisoId = ref<Map<number, number>>(new Map())
const selectedPermisoIds = ref<Set<number>>(new Set())
const initialPermisoIds = ref<Set<number>>(new Set())
const buscar = ref('')
const isLoading = ref(false)
const isSaving = ref(false)

const asignadosFilters = computed(() => ({
  idRol: props.rol?.id,
  pagina: 1,
  limite: 500,
}))

const asignadosQuery = useRolPermisosAsignadosQuery(asignadosFilters)

const canManage = computed(
  () =>
    authStore.hasPermission(PermisoBanderas.ROLES_PERMISOS_ASIGNAR) &&
    authStore.hasPermission(PermisoBanderas.ROLES_PERMISOS_QUITAR),
)

const permisoGroups = computed(() => {
  const groups = new Map<string, { name: string; label: string; items: Permiso[] }>()

  for (const permiso of allPermisos.value) {
    const [moduleName = 'general'] = permiso.nombre.split('.')
    const key = moduleName

    if (!groups.has(key)) {
      groups.set(key, {
        name: key,
        label: moduleName.replace(/_/g, ' '),
        items: [],
      })
    }

    groups.get(key)!.items.push(permiso)
  }

  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label))
})

const filteredGroups = computed(() => {
  const term = buscar.value.trim().toLowerCase()
  if (!term) return permisoGroups.value

  return permisoGroups.value
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (permiso) =>
          permiso.nombre.toLowerCase().includes(term) ||
          permiso.descripcion?.toLowerCase().includes(term),
      ),
    }))
    .filter((group) => group.items.length > 0)
})

const hasChanges = computed(() => {
  if (initialPermisoIds.value.size !== selectedPermisoIds.value.size) return true

  for (const id of selectedPermisoIds.value) {
    if (!initialPermisoIds.value.has(id)) return true
  }

  return false
})

const syncAsignaciones = () => {
  const map = new Map<number, number>()
  const selected = new Set<number>()

  for (const asignacion of asignadosQuery.data.value?.data ?? []) {
    map.set(asignacion.id_permiso, asignacion.id)
    selected.add(asignacion.id_permiso)
  }

  asignacionByPermisoId.value = map
  selectedPermisoIds.value = new Set(selected)
  initialPermisoIds.value = new Set(selected)
}

const loadData = async () => {
  if (!props.rol) return

  isLoading.value = true
  buscar.value = ''

  try {
    const permisosResult = await permisosService.listar({ pagina: 1, limite: 500 })
    allPermisos.value = permisosResult.data
    await asignadosQuery.refetch()
    syncAsignaciones()
  } finally {
    isLoading.value = false
  }
}

const togglePermiso = (permisoId: number, checked: boolean) => {
  const next = new Set(selectedPermisoIds.value)

  if (checked) {
    next.add(permisoId)
  } else {
    next.delete(permisoId)
  }

  selectedPermisoIds.value = next
}

const handleClose = () => {
  open.value = false
}

const handleSave = async () => {
  if (!props.rol || !hasChanges.value) return

  isSaving.value = true

  try {
    const toAssign = [...selectedPermisoIds.value].filter(
      (id) => !initialPermisoIds.value.has(id),
    )
    const toRemove = [...initialPermisoIds.value].filter(
      (id) => !selectedPermisoIds.value.has(id),
    )

    for (const permisoId of toAssign) {
      await asignarMutation.mutateAsync({
        idRol: props.rol.id,
        idPermiso: permisoId,
      })
    }

    for (const permisoId of toRemove) {
      const asignacionId = asignacionByPermisoId.value.get(permisoId)
      if (asignacionId) {
        await quitarMutation.mutateAsync(asignacionId)
      }
    }

    initialPermisoIds.value = new Set(selectedPermisoIds.value)
    await asignadosQuery.refetch()
    syncAsignaciones()
    toastSuccess('Permisos actualizados correctamente')
    emit('saved')
  } catch {
    // toast en mutations
  } finally {
    isSaving.value = false
  }
}

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      loadData()
      return
    }

    allPermisos.value = []
    asignacionByPermisoId.value = new Map()
    selectedPermisoIds.value = new Set()
    initialPermisoIds.value = new Set()
    buscar.value = ''
  },
)
</script>

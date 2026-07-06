<template>
  <AppModal
    v-model="open"
    title="Permisos del rol"
    :subtitle="rol ? `Gestiona los permisos asignados a ${rol.nombre}.` : undefined"
    size="lg"
    @close="handleClose"
  >
    <div class="relative min-h-[12rem]">
      <div
        v-if="isLoading"
        class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 dark:bg-gray-900/80"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando permisos...</p>
      </div>

      <div
        class="space-y-5"
        :class="isLoading ? 'pointer-events-none opacity-60' : ''"
      >
        <AppInput
          v-model="buscar"
          type="search"
          placeholder="Buscar permiso..."
          :disabled="isSaving || isLoading"
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
              :model-value="isPermisoSelected(permiso.id)"
              :disabled="!canManage || isSaving || isLoading"
              @update:model-value="(checked) => setPermisoSelected(permiso.id, checked)"
            >
              <span class="font-medium text-gray-800 dark:text-white/90">
                {{ permisoLabels[permiso.id] ?? permiso.nombre }}
              </span>
              <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                {{ permiso.nombre }}
              </span>
            </AppCheckbox>
          </div>
        </div>

        <p
          v-if="!isLoading && !filteredGroups.length"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          No se encontraron permisos.
        </p>
      </div>
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
        :disabled="isSaving || isLoading || !hasChanges"
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
import type { Rol } from '@/modules/roles/interfaces/rol.interface'
import { permisosService } from '@/modules/permisos/services/permisos.service'
import { rolesService } from '@/modules/roles/services/roles.service'
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
const selectedMap = ref<Record<number, boolean>>({})
const initialSelectedIds = ref<number[]>([])
const buscar = ref('')
const isLoading = ref(false)
const isSaving = ref(false)

const canManage = computed(
  () =>
    authStore.hasPermission(PermisoBanderas.ROLES_PERMISOS_ASIGNAR) &&
    authStore.hasPermission(PermisoBanderas.ROLES_PERMISOS_QUITAR),
)

const permisoActionLabels: Record<string, string> = {
  listar: 'Listar',
  ver: 'Ver',
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
  asignar: 'Asignar',
  quitar: 'Quitar',
  cerrar: 'Cerrar',
  restaurar: 'Restaurar',
  activar: 'Activar',
}

const buildPermisoLabel = (permiso: Permiso) => {
  const descripcion =
    typeof permiso.descripcion === 'string' ? permiso.descripcion.trim() : ''

  if (descripcion) return descripcion

  const [resource = '', action = ''] = permiso.nombre.split('.')
  if (!resource || !action) return permiso.nombre

  const actionLabel = permisoActionLabels[action] ?? action
  const resourceLabel = resource
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

  return `${actionLabel} ${resourceLabel}`
}

const permisoLabels = computed(() => {
  const labels: Record<number, string> = {}

  for (const permiso of allPermisos.value) {
    labels[permiso.id] = buildPermisoLabel(permiso)
  }

  return labels
})

const getSelectedIds = () =>
  Object.entries(selectedMap.value)
    .filter(([, selected]) => selected)
    .map(([id]) => Number(id))

const isPermisoSelected = (permisoId: number) => selectedMap.value[permisoId] === true

const setPermisoSelected = (permisoId: number, checked: boolean) => {
  const next = { ...selectedMap.value }

  if (checked) {
    next[permisoId] = true
  } else {
    delete next[permisoId]
  }

  selectedMap.value = next
}

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
      items: group.items.filter((permiso) => {
        const label = permisoLabels.value[permiso.id] ?? permiso.nombre
        return (
          permiso.nombre.toLowerCase().includes(term) ||
          label.toLowerCase().includes(term)
        )
      }),
    }))
    .filter((group) => group.items.length > 0)
})

const hasChanges = computed(() => {
  const selected = [...getSelectedIds()].sort((a, b) => a - b)
  const initial = [...initialSelectedIds.value].sort((a, b) => a - b)

  if (selected.length !== initial.length) return true

  return selected.some((id, index) => id !== initial[index])
})

const applyAsignaciones = (asignaciones: { id: number; id_permiso: number }[]) => {
  const map = new Map<number, number>()
  const selected: Record<number, boolean> = {}
  const selectedIds: number[] = []

  for (const asignacion of asignaciones) {
    map.set(asignacion.id_permiso, asignacion.id)
    selected[asignacion.id_permiso] = true
    selectedIds.push(asignacion.id_permiso)
  }

  asignacionByPermisoId.value = map
  selectedMap.value = selected
  initialSelectedIds.value = [...selectedIds]
}

const resetModalState = () => {
  allPermisos.value = []
  asignacionByPermisoId.value = new Map()
  selectedMap.value = {}
  initialSelectedIds.value = []
  buscar.value = ''
  isLoading.value = false
}

let loadRequestId = 0

const loadData = async () => {
  const rolId = props.rol?.id
  if (!rolId) return

  const requestId = ++loadRequestId
  isLoading.value = true
  buscar.value = ''

  try {
    const [permisosResult, asignadosResult] = await Promise.all([
      permisosService.listar({ pagina: 1, limite: 500 }),
      rolesService.listarPermisosAsignados({ idRol: rolId, pagina: 1, limite: 500 }),
    ])

    if (requestId !== loadRequestId) return

    allPermisos.value = permisosResult.data
    applyAsignaciones(asignadosResult.data)
  } finally {
    if (requestId === loadRequestId) {
      isLoading.value = false
    }
  }
}

const handleClose = () => {
  open.value = false
}

const handleSave = async () => {
  const rolId = props.rol?.id
  if (!rolId || !hasChanges.value) return

  isSaving.value = true

  try {
    const selectedIds = getSelectedIds()
    const toAssign = selectedIds.filter((id) => !initialSelectedIds.value.includes(id))
    const toRemove = initialSelectedIds.value.filter((id) => !selectedIds.includes(id))

    for (const permisoId of toAssign) {
      await asignarMutation.mutateAsync({
        idRol: rolId,
        idPermiso: permisoId,
      })
    }

    for (const permisoId of toRemove) {
      const asignacionId = asignacionByPermisoId.value.get(permisoId)
      if (asignacionId) {
        await quitarMutation.mutateAsync(asignacionId)
      }
    }

    const asignadosResult = await rolesService.listarPermisosAsignados({
      idRol: rolId,
      pagina: 1,
      limite: 500,
    })
    applyAsignaciones(asignadosResult.data)
    toastSuccess('Permisos actualizados correctamente')
    emit('saved')
  } catch {
    // toast en mutations
  } finally {
    isSaving.value = false
  }
}

watch(open, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    void loadData()
    return
  }

  if (!isOpen && wasOpen) {
    loadRequestId += 1
    resetModalState()
  }
})

watch(
  () => props.rol?.id,
  (rolId, prevRolId) => {
    if (open.value && rolId && rolId !== prevRolId) {
      void loadData()
    }
  },
)
</script>

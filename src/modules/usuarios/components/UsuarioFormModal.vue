<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'"
    :subtitle="
      mode === 'create'
        ? 'Registra un nuevo usuario del sistema.'
        : 'Actualiza los datos del usuario seleccionado.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="usuario-form"
      class="space-y-5"
      autocomplete="off"
      @submit="onSubmit"
    >
      <div class="space-y-4">
        <AppInput
          v-model="nombre"
          label="Nombre"
          placeholder="Nombre completo"
          required
          v-bind="nombreAttrs"
          :disabled="isSubmitting"
          :error="errors.nombre"
        />

        <AppInput
          v-model="correo"
          type="email"
          label="Correo"
          placeholder="correo@ejemplo.com"
          name="usuario-correo"
          autocomplete="off"
          required
          v-bind="correoAttrs"
          :disabled="isSubmitting"
          :error="errors.correo"
        />

        <AppInput
          v-model="contrasena"
          type="password"
          :label="mode === 'create' ? 'Contraseña' : 'Nueva contraseña'"
          :placeholder="mode === 'create' ? 'Mínimo 6 caracteres' : 'Dejar vacío para no cambiar'"
          name="usuario-contrasena"
          autocomplete="new-password"
          :required="mode === 'create'"
          v-bind="contrasenaAttrs"
          :disabled="isSubmitting"
          :error="errors.contrasena"
          :hint="mode === 'edit' ? 'Solo completa si deseas cambiar la contraseña.' : undefined"
        />

        <SearchableSelect
          v-model="idTrabajador"
          label="Trabajador vinculado"
          placeholder="Buscar trabajador..."
          empty-option-label="Sin trabajador asignado"
          :model-label="trabajadorLabelActual"
          :search-fn="searchTrabajadores"
          :disabled="isSubmitting"
          :error="errors.idTrabajador"
        />
      </div>

      <div
        v-if="showRolesSection"
        class="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-800"
      >
        <div>
          <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Roles</h5>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {{
              canManageRoles
                ? 'Selecciona los roles que tendrá este usuario.'
                : 'Roles asignados al usuario.'
            }}
          </p>
        </div>

        <div v-if="isLoadingRoles" class="py-4 text-center text-sm text-gray-500">
          Cargando roles...
        </div>

        <div v-else class="grid gap-2 sm:grid-cols-2">
          <AppCheckbox
            v-for="rol in availableRoles"
            :key="rol.id"
            :model-value="selectedRolIds.has(rol.id)"
            :disabled="!canManageRoles || isSubmitting"
            @update:model-value="(checked) => toggleRol(rol.id, checked)"
          >
            <span class="font-medium">{{ rol.nombre }}</span>
            <span
              v-if="rol.descripcion"
              class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400"
            >
              {{ rol.descripcion }}
            </span>
          </AppCheckbox>
        </div>

        <p v-if="!isLoadingRoles && !availableRoles.length" class="text-sm text-gray-500">
          No hay roles disponibles.
        </p>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="usuario-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  useAsignarUsuarioRolMutation,
  useQuitarUsuarioRolMutation,
} from '@/modules/usuarios/composables/useUsuarioRolMutations'
import { useUsuarioRolesAsignadosQuery } from '@/modules/usuarios/composables/useUsuarioRolesQuery'
import {
  useCreateUsuarioMutation,
  useUpdateUsuarioMutation,
} from '@/modules/usuarios/composables/useUsuarioMutations'
import type {
  Usuario,
  UsuarioFormMode,
} from '@/modules/usuarios/interfaces/usuario.interface'
import { rolesService } from '@/modules/roles/services/roles.service'
import type { Rol } from '@/modules/roles/interfaces/rol.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppCheckbox, AppInput, AppModal } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import { trabajadoresService } from '@/modules/trabajadores/services/trabajadores.service'
import type { Trabajador } from '@/modules/trabajadores/interfaces/trabajador.interface'
import { PermisoBanderas } from '@/shared/constants/permissions'
import {
  optionalPasswordMin,
  requiredEmail,
  requiredPasswordMin,
  requiredString,
} from '@/shared/validation'
import type { SelectOption } from '@/shared/interfaces/form.interface'

interface UsuarioFormModalProps {
  mode: UsuarioFormMode
  usuario?: Usuario | null
}

const props = defineProps<UsuarioFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateUsuarioMutation()
const updateMutation = useUpdateUsuarioMutation()
const asignarRolMutation = useAsignarUsuarioRolMutation()
const quitarRolMutation = useQuitarUsuarioRolMutation()

const isLoadingRoles = ref(false)
const availableRoles = ref<Rol[]>([])
const asignacionByRolId = ref<Map<number, number>>(new Map())
const selectedRolIds = ref<Set<number>>(new Set())
const initialRolIds = ref<Set<number>>(new Set())

const rolesFilters = computed(() => ({
  idUsuario: props.usuario?.id,
  pagina: 1,
  limite: 100,
}))

const asignadosQuery = useUsuarioRolesAsignadosQuery(rolesFilters)

const validationSchema = computed(() =>
  toTypedSchema(
    yup.object({
      nombre: requiredString('El nombre'),
      correo: requiredEmail(),
      contrasena:
        props.mode === 'create' ? requiredPasswordMin(6) : optionalPasswordMin(6),
      idTrabajador: yup.number().optional().nullable(),
    }),
  ),
)

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema,
  initialValues: {
    nombre: '',
    correo: '',
    contrasena: '',
    idTrabajador: undefined as number | undefined,
  },
})

const [nombre, nombreAttrs] = defineField('nombre')
const [correo, correoAttrs] = defineField('correo')
const [contrasena, contrasenaAttrs] = defineField('contrasena')
const [idTrabajador] = defineField('idTrabajador')

const getTrabajadorNombre = (t: Trabajador) =>
  [t.nombres, t.apellido_paterno, t.apellido_materno].filter(Boolean).join(' ').trim() || t.nombres

const searchTrabajadores = async (query: string): Promise<SelectOption[]> => {
  const response = await trabajadoresService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
    soloSinUsuario: true,
  })
  return response.data.map((t) => ({ value: t.id, label: getTrabajadorNombre(t) }))
}

const trabajadorLabelActual = ref<string | null>(null)

const showRolesSection = computed(() =>
  authStore.hasPermission(PermisoBanderas.USUARIOS_ROLES_LISTAR),
)

const canManageRoles = computed(
  () =>
    authStore.hasPermission(PermisoBanderas.USUARIOS_ROLES_ASIGNAR) &&
    authStore.hasPermission(PermisoBanderas.USUARIOS_ROLES_QUITAR),
)

const hasRoleChanges = computed(() => {
  if (initialRolIds.value.size !== selectedRolIds.value.size) return true

  for (const id of selectedRolIds.value) {
    if (!initialRolIds.value.has(id)) return true
  }

  return false
})

const syncAsignaciones = () => {
  const map = new Map<number, number>()
  const selected = new Set<number>()

  for (const asignacion of asignadosQuery.data.value?.data ?? []) {
    map.set(asignacion.id_rol, asignacion.id)
    selected.add(asignacion.id_rol)
  }

  asignacionByRolId.value = map
  selectedRolIds.value = new Set(selected)
  initialRolIds.value = new Set(selected)
}

const initRolesFromUsuario = () => {
  const selected = new Set(props.usuario?.roles.map((rol) => rol.id) ?? [])
  selectedRolIds.value = new Set(selected)
  initialRolIds.value = new Set(selected)
}

const loadRoles = async () => {
  if (!showRolesSection.value) return

  isLoadingRoles.value = true

  try {
    const rolesResult = await rolesService.listar({ pagina: 1, limite: 100 })
    availableRoles.value = rolesResult.data

    if (props.mode === 'edit' && props.usuario) {
      await asignadosQuery.refetch()
      syncAsignaciones()
    } else {
      asignacionByRolId.value = new Map()
      selectedRolIds.value = new Set()
      initialRolIds.value = new Set()
    }
  } finally {
    isLoadingRoles.value = false
  }
}

const toggleRol = (rolId: number, checked: boolean) => {
  const next = new Set(selectedRolIds.value)

  if (checked) {
    next.add(rolId)
  } else {
    next.delete(rolId)
  }

  selectedRolIds.value = next
}

const syncFormValues = () => {
  resetForm({
    values: {
      nombre: props.usuario?.nombre ?? '',
      correo: props.usuario?.correo ?? '',
      contrasena: '',
      idTrabajador: props.usuario?.id_trabajador ?? undefined,
    },
  })

  if (props.usuario?.id_trabajador) {
    trabajadoresService
      .obtenerPorId(props.usuario.id_trabajador)
      .then((t) => {
        trabajadorLabelActual.value = getTrabajadorNombre(t)
      })
      .catch(() => {
        trabajadorLabelActual.value = null
      })
  } else {
    trabajadorLabelActual.value = null
  }

  if (props.mode === 'edit') {
    initRolesFromUsuario()
  }
}

const syncRoles = async (usuarioId: number) => {
  if (!canManageRoles.value || !hasRoleChanges.value) return

  const toAssign = [...selectedRolIds.value].filter((id) => !initialRolIds.value.has(id))
  const toRemove = [...initialRolIds.value].filter((id) => !selectedRolIds.value.has(id))

  for (const rolId of toAssign) {
    await asignarRolMutation.mutateAsync({
      idUsuario: usuarioId,
      idRol: rolId,
    })
  }

  for (const rolId of toRemove) {
    const asignacionId = asignacionByRolId.value.get(rolId)
    if (asignacionId) {
      await quitarRolMutation.mutateAsync(asignacionId)
    }
  }
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    let usuarioId: number

    if (props.mode === 'create') {
      if (!values.contrasena) return

      const usuario = await createMutation.mutateAsync({
        nombre: values.nombre,
        correo: values.correo,
        contrasena: values.contrasena,
        idTrabajador: values.idTrabajador ?? undefined,
      })
      usuarioId = usuario.id
    } else if (props.usuario) {
      const payload: {
        nombre: string
        correo: string
        contrasena?: string
        idTrabajador?: number
      } = {
        nombre: values.nombre,
        correo: values.correo,
        idTrabajador: values.idTrabajador ?? undefined,
      }

      if (values.contrasena) {
        payload.contrasena = values.contrasena
      }

      await updateMutation.mutateAsync({
        id: props.usuario.id,
        payload,
      })
      usuarioId = props.usuario.id
    } else {
      return
    }

    await syncRoles(usuarioId)

    emit('saved')
    open.value = false
  } catch {
    // El toast lo maneja la mutation
  }
})

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      syncFormValues()
      loadRoles()
      return
    }

    availableRoles.value = []
    asignacionByRolId.value = new Map()
    selectedRolIds.value = new Set()
    initialRolIds.value = new Set()
  },
)

watch(
  () => props.usuario,
  () => {
    if (open.value) {
      syncFormValues()
      if (props.mode === 'edit' && props.usuario) {
        asignadosQuery.refetch().then(() => syncAsignaciones())
      }
    }
  },
)
</script>

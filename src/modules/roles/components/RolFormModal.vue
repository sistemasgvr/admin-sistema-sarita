<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo rol' : 'Editar rol'"
    :subtitle="
      mode === 'create'
        ? 'Registra un nuevo rol del sistema.'
        : 'Actualiza los datos del rol seleccionado.'
    "
    @close="handleClose"
  >
    <form id="rol-form" class="space-y-4" @submit.prevent="handleSubmit">
      <AppInput
        v-model="form.nombre"
        label="Nombre"
        placeholder="Ej. Vendedor"
        required
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppTextarea
        v-model="form.descripcion"
        label="Descripción"
        placeholder="Describe el propósito del rol"
        :disabled="isSubmitting"
        :error="errors.descripcion"
      />
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
        form="rol-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear rol' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import {
  useCreateRolMutation,
  useUpdateRolMutation,
} from '@/modules/roles/composables/useRolMutations'
import type { Rol, RolFormMode } from '@/modules/roles/interfaces/rol.interface'
import { AppInput, AppModal, AppTextarea } from '@/shared/components'

interface RolFormModalProps {
  mode: RolFormMode
  rol?: Rol | null
}

const props = defineProps<RolFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateRolMutation()
const updateMutation = useUpdateRolMutation()

const form = reactive({
  nombre: '',
  descripcion: '',
})

const errors = reactive({
  nombre: '',
  descripcion: '',
})

const isSubmitting = ref(false)

const resetForm = () => {
  form.nombre = props.rol?.nombre ?? ''
  form.descripcion = props.rol?.descripcion ?? ''
  errors.nombre = ''
  errors.descripcion = ''
}

const validate = () => {
  errors.nombre = ''
  errors.descripcion = ''

  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio'
  }

  return !errors.nombre
}

const handleClose = () => {
  open.value = false
}

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true

  try {
    if (props.mode === 'create') {
      await createMutation.mutateAsync({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
      })
    } else if (props.rol) {
      await updateMutation.mutateAsync({
        id: props.rol.id,
        payload: {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || undefined,
        },
      })
    }

    emit('saved')
    open.value = false
  } catch {
    // toast en mutation
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  },
)

watch(
  () => props.rol,
  () => {
    if (open.value) {
      resetForm()
    }
  },
)
</script>

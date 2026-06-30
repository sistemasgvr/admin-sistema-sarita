<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva sucursal' : 'Editar sucursal'"
    :subtitle="
      mode === 'create'
        ? 'Registra una nueva sucursal.'
        : 'Actualiza los datos de la sucursal seleccionada.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="sucursal-form"
      class="space-y-4"
      autocomplete="off"
      @submit.prevent="handleSubmit"
    >
      <AppInput
        v-model="form.codigo"
        label="Código"
        placeholder="SUC-001"
        required
        :disabled="isSubmitting"
        :error="errors.codigo"
      />

      <AppInput
        v-model="form.nombre"
        label="Nombre"
        placeholder="Sucursal Principal"
        required
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppInput
        v-model="form.direccion"
        label="Dirección"
        placeholder="Av. Principal 123"
        :disabled="isSubmitting"
      />

      <AppInput
        v-model="form.telefono"
        label="Teléfono"
        placeholder="999 999 999"
        :disabled="isSubmitting"
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
        form="sucursal-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear sucursal' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import {
  useCreateSucursalMutation,
  useUpdateSucursalMutation,
} from '@/modules/configuracion/sucursales/composables/useSucursalMutations'
import type {
  Sucursal,
  SucursalFormMode,
} from '@/modules/configuracion/sucursales/interfaces/sucursal.interface'
import { AppInput, AppModal } from '@/shared/components'

interface SucursalFormModalProps {
  mode: SucursalFormMode
  sucursal?: Sucursal | null
}

const props = defineProps<SucursalFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateSucursalMutation()
const updateMutation = useUpdateSucursalMutation()

const form = reactive({
  codigo: '',
  nombre: '',
  direccion: '',
  telefono: '',
})

const errors = reactive({
  codigo: '',
  nombre: '',
})

const isSubmitting = ref(false)

const resetForm = () => {
  form.codigo = props.sucursal?.codigo ?? ''
  form.nombre = props.sucursal?.nombre ?? ''
  form.direccion = props.sucursal?.direccion ?? ''
  form.telefono = props.sucursal?.telefono ?? ''
  errors.codigo = ''
  errors.nombre = ''
}

const validate = () => {
  errors.codigo = ''
  errors.nombre = ''

  if (!form.codigo.trim()) {
    errors.codigo = 'El código es obligatorio'
  }

  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio'
  }

  return !errors.codigo && !errors.nombre
}

const handleClose = () => {
  open.value = false
}

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true

  try {
    const payload = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.sucursal) {
      await updateMutation.mutateAsync({
        id: props.sucursal.id,
        payload,
      })
    } else {
      return
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
  () => props.sucursal,
  () => {
    if (open.value) {
      resetForm()
    }
  },
)
</script>

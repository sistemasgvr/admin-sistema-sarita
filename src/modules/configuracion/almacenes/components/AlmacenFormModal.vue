<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo almacén' : 'Editar almacén'"
    :subtitle="
      mode === 'create'
        ? 'Registra un nuevo almacén.'
        : 'Actualiza los datos del almacén seleccionado.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="almacen-form"
      class="space-y-4"
      autocomplete="off"
      @submit.prevent="handleSubmit"
    >
      <AppSelect
        v-model="form.id_sucursal"
        label="Sucursal"
        placeholder="Selecciona una sucursal"
        :options="sucursalOptions"
        required
        :disabled="isSubmitting || isLoadingSucursales"
        :error="errors.id_sucursal"
      />

      <AppInput
        v-model="form.nombre"
        label="Nombre"
        placeholder="Almacén Central"
        required
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppInput
        v-model="form.ubicacion"
        label="Ubicación"
        placeholder="Piso 2, sector A"
        :disabled="isSubmitting"
      />

      <AppInput
        v-model="form.descripcion"
        label="Descripción"
        placeholder="Descripción del almacén"
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
        form="almacen-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear almacén' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  useCreateAlmacenMutation,
  useUpdateAlmacenMutation,
} from '@/modules/configuracion/almacenes/composables/useAlmacenMutations'
import type {
  Almacen,
  AlmacenFormMode,
} from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import { sucursalesService } from '@/modules/configuracion/sucursales/services/sucursales.service'
import type { Sucursal } from '@/modules/configuracion/sucursales/interfaces/sucursal.interface'
import { AppInput, AppModal, AppSelect } from '@/shared/components'

interface AlmacenFormModalProps {
  mode: AlmacenFormMode
  almacen?: Almacen | null
}

const props = defineProps<AlmacenFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateAlmacenMutation()
const updateMutation = useUpdateAlmacenMutation()

const form = reactive({
  id_sucursal: '' as string | number,
  nombre: '',
  ubicacion: '',
  descripcion: '',
})

const errors = reactive({
  id_sucursal: '',
  nombre: '',
})

const isSubmitting = ref(false)
const isLoadingSucursales = ref(false)
const sucursales = ref<Sucursal[]>([])

const sucursalOptions = computed(() =>
  sucursales.value.map((sucursal) => ({
    value: sucursal.id,
    label: `${sucursal.codigo} — ${sucursal.nombre}`,
  })),
)

const loadSucursales = async () => {
  isLoadingSucursales.value = true

  try {
    const result = await sucursalesService.listar({ pagina: 1, limite: 100 })
    sucursales.value = result.data
  } finally {
    isLoadingSucursales.value = false
  }
}

const resetForm = () => {
  form.id_sucursal = props.almacen?.id_sucursal ?? ''
  form.nombre = props.almacen?.nombre ?? ''
  form.ubicacion = props.almacen?.ubicacion ?? ''
  form.descripcion = props.almacen?.descripcion ?? ''
  errors.id_sucursal = ''
  errors.nombre = ''
}

const validate = () => {
  errors.id_sucursal = ''
  errors.nombre = ''

  if (!form.id_sucursal) {
    errors.id_sucursal = 'La sucursal es obligatoria'
  }

  if (!form.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio'
  }

  return !errors.id_sucursal && !errors.nombre
}

const handleClose = () => {
  open.value = false
}

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true

  try {
    const payload = {
      idSucursal: Number(form.id_sucursal),
      nombre: form.nombre.trim(),
      ubicacion: form.ubicacion.trim() || undefined,
      descripcion: form.descripcion.trim() || undefined,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.almacen) {
      await updateMutation.mutateAsync({
        id: props.almacen.id,
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
      loadSucursales()
    }
  },
)

watch(
  () => props.almacen,
  () => {
    if (open.value) {
      resetForm()
    }
  },
)
</script>

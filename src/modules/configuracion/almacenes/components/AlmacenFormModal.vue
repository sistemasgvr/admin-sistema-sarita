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
      @submit="onSubmit"
    >
      <AppSelect
        v-model="id_sucursal"
        label="Sucursal"
        placeholder="Selecciona una sucursal"
        :options="sucursalOptions"
        required
        v-bind="idSucursalAttrs"
        :disabled="isSubmitting || isLoadingSucursales"
        :error="errors.id_sucursal"
      />

      <AppInput
        v-model="nombre"
        label="Nombre"
        placeholder="Almacén Central"
        required
        v-bind="nombreAttrs"
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppInput
        v-model="ubicacion"
        label="Ubicación"
        placeholder="Piso 2, sector A"
        v-bind="ubicacionAttrs"
        :disabled="isSubmitting"
      />

      <AppInput
        v-model="descripcion"
        label="Descripción"
        placeholder="Descripción del almacén"
        v-bind="descripcionAttrs"
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
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
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
import { optionalString, requiredSelect, requiredString } from '@/shared/validation'

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

const isLoadingSucursales = ref(false)
const sucursales = ref<Sucursal[]>([])

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      id_sucursal: requiredSelect('La sucursal'),
      nombre: requiredString('El nombre'),
      ubicacion: optionalString(),
      descripcion: optionalString(),
    }),
  ),
  initialValues: {
    id_sucursal: '' as string | number,
    nombre: '',
    ubicacion: '',
    descripcion: '',
  },
})

const [id_sucursal, idSucursalAttrs] = defineField('id_sucursal')
const [nombre, nombreAttrs] = defineField('nombre')
const [ubicacion, ubicacionAttrs] = defineField('ubicacion')
const [descripcion, descripcionAttrs] = defineField('descripcion')

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

const syncFormValues = () => {
  resetForm({
    values: {
      id_sucursal: props.almacen?.id_sucursal ?? '',
      nombre: props.almacen?.nombre ?? '',
      ubicacion: props.almacen?.ubicacion ?? '',
      descripcion: props.almacen?.descripcion ?? '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      idSucursal: Number(values.id_sucursal),
      nombre: values.nombre,
      ubicacion: values.ubicacion || undefined,
      descripcion: values.descripcion || undefined,
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
  }
})

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      syncFormValues()
      loadSucursales()
    }
  },
)

watch(
  () => props.almacen,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>

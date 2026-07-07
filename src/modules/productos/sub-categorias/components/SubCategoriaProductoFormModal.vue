<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva subcategoría' : 'Editar subcategoría'"
    :subtitle="
      mode === 'create'
        ? 'Define un subtipo dentro de una categoría (ej. Oxígeno, Reguladores).'
        : 'Actualiza los datos de la subcategoría seleccionada.'
    "
    size="md"
    @close="handleClose"
  >
    <form
      id="sub-categoria-producto-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <AppSelect
        v-model="idCategoria"
        label="Categoría"
        placeholder="Selecciona una categoría"
        required
        v-bind="idCategoriaAttrs"
        :disabled="isSubmitting || isCategoriaLocked"
        :error="errors.idCategoria"
        :options="categoriaOptions"
      />

      <AppInput
        v-model="nombre"
        label="Nombre"
        placeholder="Oxígeno industrial"
        required
        v-bind="nombreAttrs"
        :disabled="isSubmitting"
        :error="errors.nombre"
      />

      <AppTextarea
        v-model="descripcion"
        label="Descripción"
        placeholder="Descripción opcional"
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
        form="sub-categoria-producto-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear subcategoría' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  useCreateSubCategoriaProductoMutation,
  useUpdateSubCategoriaProductoMutation,
} from '@/modules/productos/sub-categorias/composables/useSubCategoriaProductoMutations'
import type {
  SubCategoriaProducto,
  SubCategoriaProductoFormMode,
} from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { AppInput, AppModal, AppSelect, AppTextarea } from '@/shared/components'
import { optionalString, requiredString } from '@/shared/validation'

interface SubCategoriaProductoFormModalProps {
  mode: SubCategoriaProductoFormMode
  subCategoria?: SubCategoriaProducto | null
  categorias: CategoriaProducto[]
  defaultCategoriaId?: number | null
  lockCategoria?: boolean
}

const props = defineProps<SubCategoriaProductoFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const createMutation = useCreateSubCategoriaProductoMutation()
const updateMutation = useUpdateSubCategoriaProductoMutation()

const categoriaOptions = computed(() =>
  props.categorias.map((categoria) => ({
    value: categoria.id,
    label: categoria.nombre,
  })),
)

const isCategoriaLocked = computed(
  () => props.mode === 'create' && props.lockCategoria && !!props.defaultCategoriaId,
)

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idCategoria: yup.number().required('La categoría es obligatoria'),
      nombre: requiredString('El nombre'),
      descripcion: optionalString(),
    }),
  ),
  initialValues: {
    idCategoria: undefined as number | undefined,
    nombre: '',
    descripcion: '',
  },
})

const [idCategoria, idCategoriaAttrs] = defineField('idCategoria')
const [nombre, nombreAttrs] = defineField('nombre')
const [descripcion, descripcionAttrs] = defineField('descripcion')

const syncFormValues = () => {
  resetForm({
    values: {
      idCategoria:
        props.subCategoria?.id_categoria ??
        props.defaultCategoriaId ??
        undefined,
      nombre: props.subCategoria?.nombre ?? '',
      descripcion: props.subCategoria?.descripcion ?? '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      idCategoria: Number(values.idCategoria),
      nombre: values.nombre,
      descripcion: values.descripcion || undefined,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.subCategoria) {
      await updateMutation.mutateAsync({
        id: props.subCategoria.id,
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
    }
  },
)

watch(
  () => props.subCategoria,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)

watch(
  () => props.defaultCategoriaId,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>

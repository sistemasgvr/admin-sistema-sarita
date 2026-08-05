<template>
  <AppModal
    v-model="open"
    :title="title"
    :subtitle="subtitle"
    size="sm"
    :z-index="100050"
    @close="handleClose"
  >
    <form id="lista-opcion-form" autocomplete="off" @submit="onSubmit">
      <div class="space-y-4">
        <AppInput
          v-model="nombre"
          label="Nombre"
          :placeholder="nombrePlaceholder"
          required
          v-bind="nombreAttrs"
          :disabled="isSubmitting"
          :error="errors.nombre"
        />

        <AppInput
          v-model="descripcion"
          label="Descripción"
          placeholder="Opcional"
          v-bind="descripcionAttrs"
          :disabled="isSubmitting"
          :error="errors.descripcion"
        />
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="lista-opcion-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : 'Crear' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { catalogosQueryKeys } from '@/modules/catalogos/constants/catalogosQueryKeys'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import { catalogosService } from '@/modules/catalogos/services/catalogos.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal } from '@/shared/components'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'
import { optionalString, requiredString } from '@/shared/validation'

const props = withDefaults(
  defineProps<{
    idLista: number
    title?: string
    subtitle?: string
    nombrePlaceholder?: string
  }>(),
  {
    title: 'Nueva opción',
    subtitle: 'Se agregará al catálogo para usarla en formularios.',
    nombrePlaceholder: 'Ej. m³',
  },
)

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: [opcion: ListaOpcion]
}>()

const authStore = useAuthStore()
const queryClient = useQueryClient()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      nombre: requiredString('El nombre'),
      descripcion: optionalString(),
    }),
  ),
  initialValues: {
    nombre: '',
    descripcion: '',
  },
})

const [nombre, nombreAttrs] = defineField('nombre')
const [descripcion, descripcionAttrs] = defineField('descripcion')

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const opcion = await catalogosService.crearListaOpcion(props.idLista, {
      nombre: values.nombre,
      descripcion: values.descripcion || undefined,
      idUsuarioAuditoria: authStore.user?.id,
    })
    await queryClient.invalidateQueries({
      queryKey: catalogosQueryKeys.listaOpciones(props.idLista),
    })
    toastSuccess('Opción creada')
    emit('saved', opcion)
    open.value = false
  } catch (error) {
    toastApiError(error, 'No se pudo crear la opción')
  }
})

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      resetForm({ values: { nombre: '', descripcion: '' } })
    }
  },
)
</script>

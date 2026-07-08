<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Agregar cilindro' : 'Editar cilindro'"
    :subtitle="
      mode === 'create'
        ? 'Selecciona el cilindro a incluir en este alquiler.'
        : 'Cambia el cilindro asignado a esta línea.'
    "
    size="sm"
    @close="handleClose"
  >
    <div
      v-if="isLoadingDetalle"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando detalle...
    </div>

    <form
      v-else
      id="alquiler-detalle-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <AppSelect
        v-model="idBalon"
        label="Cilindro"
        placeholder="Selecciona cilindro"
        required
        v-bind="idBalonAttrs"
        :disabled="isSubmitting || balonesQuery.isLoading.value"
        :error="errors.idBalon"
        :options="balonOptions"
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
        form="alquiler-detalle-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{
          isSubmitting
            ? 'Guardando...'
            : mode === 'create'
              ? 'Agregar cilindro'
              : 'Guardar cambios'
        }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import {
  useCreateAlquilerDetalleMutation,
  useUpdateAlquilerDetalleMutation,
} from '@/modules/balones/alquileres/composables/useAlquilerDetalleMutations'
import { useAlquilerDetalleQuery } from '@/modules/balones/alquileres/composables/useAlquileresDetalleQuery'
import type { AlquilerDetalleFormMode } from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppModal, AppSelect } from '@/shared/components'
import { requiredSelect } from '@/shared/validation'

interface AlquilerDetalleFormModalProps {
  mode: AlquilerDetalleFormMode
  alquilerId: number
  detalleId?: number | null
}

const props = defineProps<AlquilerDetalleFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateAlquilerDetalleMutation()
const updateMutation = useUpdateAlquilerDetalleMutation()

const detalleIdRef = computed(() => (props.mode === 'edit' ? props.detalleId : null))
const detalleQuery = useAlquilerDetalleQuery(detalleIdRef)
const isLoadingDetalle = computed(
  () => props.mode === 'edit' && open.value && detalleQuery.isFetching.value,
)

const balonesFilters = ref({ pagina: 1, limite: 200 })
const balonesQuery = useBalonesQuery(balonesFilters)

const balonOptions = computed(() =>
  (balonesQuery.data.value?.data ?? []).map((balon) => ({
    value: balon.id,
    label: balon.codigo_balon,
  })),
)

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idBalon: requiredSelect('El cilindro'),
    }),
  ),
  initialValues: {
    idBalon: '' as string | number,
  },
})

const [idBalon, idBalonAttrs] = defineField('idBalon')

const syncFormValues = () => {
  const data = detalleQuery.data.value
  resetForm({
    values: {
      idBalon: data?.id_balon ?? '',
    },
  })
}

const resetCreateForm = () => {
  resetForm({
    values: {
      idBalon: '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  const idBalonValue = Number(values.idBalon)
  if (!idBalonValue) return

  try {
    if (props.mode === 'create') {
      await createMutation.mutateAsync({
        idUsuarioAuditoria: currentUserId,
        idAlquiler: props.alquilerId,
        idBalon: idBalonValue,
      })
    } else if (props.detalleId) {
      await updateMutation.mutateAsync({
        id: props.detalleId,
        payload: {
          idUsuarioAuditoria: currentUserId,
          idBalon: idBalonValue,
        },
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
  () => [open.value, props.mode, props.detalleId] as const,
  ([isOpen, mode]) => {
    if (!isOpen) return
    if (mode === 'edit') {
      syncFormValues()
    } else {
      resetCreateForm()
    }
  },
  { immediate: true },
)

watch(
  () => detalleQuery.data.value,
  () => {
    if (open.value && props.mode === 'edit') {
      syncFormValues()
    }
  },
)
</script>

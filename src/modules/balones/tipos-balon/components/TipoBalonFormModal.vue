<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo tipo de balón' : 'Editar tipo de balón'"
    :subtitle="
      mode === 'create'
        ? 'Define la capacidad y gas asociado a un tipo de cilindro.'
        : 'Actualiza los datos del tipo seleccionado.'
    "
    size="md"
    @close="handleClose"
  >
    <form id="tipo-balon-form" autocomplete="off" @submit="onSubmit">
      <FormCardsLayout>
        <DetailSectionCard title="Datos del tipo" :icon="ICONS.layers" :full-width="true">
          <div class="space-y-4">
            <AppInput
              v-model="nombre"
              label="Nombre"
              placeholder="Oxígeno Industrial 10m³"
              required
              v-bind="nombreAttrs"
              :disabled="isSubmitting"
              :error="errors.nombre"
            />

            <AppSelect
              v-model="idGas"
              label="Gas (producto)"
              :placeholder="productosQuery.isLoading.value ? 'Cargando...' : 'Selecciona un gas...'"
              :options="gasOptions"
              :disabled="isSubmitting || productosQuery.isLoading.value"
              v-bind="idGasAttrs"
              :error="errors.idGas"
              hint="Solo productos marcados como gas."
            />

            <div class="grid gap-4 sm:grid-cols-2">
              <AppInput
                v-model="capacidad"
                label="Capacidad"
                type="number"
                :min="NUMBER_MIN.measure"
                :step="NUMBER_STEP.measure"
                placeholder="10"
                v-bind="capacidadAttrs"
                :disabled="isSubmitting"
                :error="errors.capacidad"
              />

              <AppSelect
                v-model="idUnidadMedida"
                label="Unidad de medida"
                :placeholder="unidadMedidaQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
                :options="unidadMedidaOptions"
                :disabled="isSubmitting || unidadMedidaQuery.isLoading.value"
                v-bind="idUnidadMedidaAttrs"
                :error="errors.idUnidadMedida"
              />
            </div>

            <AppInput
              v-model="peso"
              label="Peso tara (kg)"
              type="number"
              :min="NUMBER_MIN.measure"
              :step="NUMBER_STEP.measure"
              placeholder="0"
              v-bind="pesoAttrs"
              :disabled="isSubmitting"
              :error="errors.peso"
            />

            <AppSelect
              v-model="vigenciaPhAnios"
              label="Vigencia P.H. (años)"
              placeholder="Selecciona..."
              :options="vigenciaPhOptions"
              :disabled="isSubmitting"
              v-bind="vigenciaPhAniosAttrs"
              :error="errors.vigenciaPhAnios"
              hint="Plazo de renovación de prueba hidrostática según normativa del tipo de gas."
            />
          </div>
        </DetailSectionCard>
      </FormCardsLayout>
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
        form="tipo-balon-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{
          isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear tipo' : 'Guardar cambios'
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
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import {
  useCreateTipoBalonMutation,
  useUpdateTipoBalonMutation,
} from '@/modules/balones/tipos-balon/composables/useTipoBalonMutations'
import type {
  TipoBalon,
  TipoBalonFormMode,
} from '@/modules/balones/tipos-balon/interfaces/tipo-balon.interface'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalNumber, requiredString } from '@/shared/validation'

interface TipoBalonFormModalProps {
  mode: TipoBalonFormMode
  tipoBalon?: TipoBalon | null
}

const props = defineProps<TipoBalonFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateTipoBalonMutation()
const updateMutation = useUpdateTipoBalonMutation()

const productosFilters = ref({ pagina: 1, limite: 200, esGas: true })
const productosQuery = useProductosQuery(productosFilters)

const listaUnidadMedidaId = ref(ListaIds.UNIDAD_MEDIDA)
const unidadMedidaQuery = useListaOpcionesQuery(listaUnidadMedidaId)

const gasOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((producto) => ({
    label: `${producto.codigo} — ${producto.nombre}`,
    value: producto.id,
  })),
)

const unidadMedidaOptions = computed(() => toSelectOptions(unidadMedidaQuery.data.value))

const vigenciaPhOptions = [
  { label: '5 años', value: 5 },
  { label: '10 años', value: 10 },
]

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      nombre: requiredString('El nombre'),
      idGas: optionalNumber(),
      capacidad: optionalNumber(),
      idUnidadMedida: optionalNumber(),
      peso: optionalNumber(),
      vigenciaPhAnios: optionalNumber(),
    }),
  ),
  initialValues: {
    nombre: '',
    idGas: undefined as number | undefined,
    capacidad: undefined as number | undefined,
    idUnidadMedida: undefined as number | undefined,
    peso: undefined as number | undefined,
    vigenciaPhAnios: 5 as number | undefined,
  },
})

const [nombre, nombreAttrs] = defineField('nombre')
const [idGas, idGasAttrs] = defineField('idGas')
const [capacidad, capacidadAttrs] = defineField('capacidad')
const [idUnidadMedida, idUnidadMedidaAttrs] = defineField('idUnidadMedida')
const [peso, pesoAttrs] = defineField('peso')
const [vigenciaPhAnios, vigenciaPhAniosAttrs] = defineField('vigenciaPhAnios')

const syncFormValues = () => {
  resetForm({
    values: {
      nombre: props.tipoBalon?.nombre ?? '',
      idGas: props.tipoBalon?.id_gas ?? undefined,
      capacidad: props.tipoBalon?.capacidad ?? undefined,
      idUnidadMedida: props.tipoBalon?.id_unidad_medida ?? undefined,
      peso: props.tipoBalon?.peso ?? undefined,
      vigenciaPhAnios: props.tipoBalon?.vigencia_ph_anios ?? 5,
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  const payload = {
    idUsuarioAuditoria: currentUserId,
    nombre: values.nombre,
    idGas: values.idGas,
    capacidad: values.capacidad,
    idUnidadMedida: values.idUnidadMedida,
    peso: values.peso,
    vigenciaPhAnios: values.vigenciaPhAnios,
  }

  try {
    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.tipoBalon) {
      await updateMutation.mutateAsync({
        id: props.tipoBalon.id,
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
  () => props.tipoBalon,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>

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

            <ProductoSelectField
              v-model="idGas"
              v-model:search="gasBuscar"
              label="Gas (producto)"
              placeholder="Buscar y seleccionar gas..."
              search-placeholder="Código o nombre..."
              :es-gas="true"
              :options="gasSelectedOptions"
              :disabled="isSubmitting"
              :error="errors.idGas"
              hint="Solo productos marcados como gas. Borra el buscador para ver el listado."
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

              <AppSelectWithCreate
                :can-create="canCreateUnidad"
                create-title="Nueva unidad de medida"
                :disabled="isSubmitting || isLoadingUnidadMedida"
                @create="unidadModalOpen = true"
              >
                <AppSelect
                  v-model="idUnidadMedida"
                  label="Unidad de medida"
                  :placeholder="isLoadingUnidadMedida ? 'Cargando...' : 'Selecciona...'"
                  :options="unidadMedidaOptions"
                  :disabled="isSubmitting || isLoadingUnidadMedida"
                  v-bind="idUnidadMedidaAttrs"
                  :error="errors.idUnidadMedida"
                />
              </AppSelectWithCreate>
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

            <AppSelectWithCreate
              can-create
              create-title="Agregar vigencia P.H."
              :disabled="isSubmitting"
              @create="vigenciaModalOpen = true"
            >
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
            </AppSelectWithCreate>
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

  <ListaOpcionFormModal
    v-model="unidadModalOpen"
    :id-lista="ListaIds.UNIDAD_MEDIDA"
    title="Nueva unidad de medida"
    subtitle="Quedará disponible en tipos de balón y productos."
    nombre-placeholder="Ej. m³, L, kg"
    @saved="onUnidadCreated"
  />

  <AppModal
    v-model="vigenciaModalOpen"
    title="Agregar vigencia P.H."
    subtitle="Indica los años de renovación de la prueba hidrostática."
    size="sm"
    :z-index="100050"
  >
    <form id="vigencia-ph-form" autocomplete="off" @submit.prevent="addVigenciaCustom">
      <AppInput
        v-model="nuevaVigenciaAnios"
        label="Años"
        type="number"
        :min="1"
        :max="50"
        :step="1"
        placeholder="Ej. 3, 7, 15"
        required
        :error="vigenciaCustomError"
      />
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        @click="vigenciaModalOpen = false"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="vigencia-ph-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
      >
        Agregar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import {
  useCreateTipoBalonMutation,
  useUpdateTipoBalonMutation,
} from '@/modules/balones/tipos-balon/composables/useTipoBalonMutations'
import type {
  TipoBalon,
  TipoBalonFormMode,
} from '@/modules/balones/tipos-balon/interfaces/tipo-balon.interface'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppSelectWithCreate } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalNumber, requiredString } from '@/shared/validation'

interface TipoBalonFormModalProps {
  mode: TipoBalonFormMode
  tipoBalon?: TipoBalon | null
}

const props = defineProps<TipoBalonFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: [tipo: TipoBalon]
}>()

const authStore = useAuthStore()
const createMutation = useCreateTipoBalonMutation()
const updateMutation = useUpdateTipoBalonMutation()

const gasBuscar = ref('')
const unidadModalOpen = ref(false)
const vigenciaModalOpen = ref(false)
const nuevaVigenciaAnios = ref<number | string>('')
const vigenciaCustomError = ref('')
const extraVigenciaOptions = ref<SelectOption[]>([])

const listaUnidadMedidaId = ref(ListaIds.UNIDAD_MEDIDA)
const unidadMedidaQuery = useListaOpcionesQuery(listaUnidadMedidaId)
const isLoadingUnidadMedida = computed(() => unidadMedidaQuery.isLoading.value)
const canCreateUnidad = computed(() => Boolean(authStore.user?.id))

const unidadMedidaOptions = computed(() => toSelectOptions(unidadMedidaQuery.data.value))

const gasSelectedOptions = computed(() => {
  const id = props.tipoBalon?.id_gas
  const nombre = props.tipoBalon?.nombre_gas
  if (id == null || !nombre) return []
  return [{ value: id, label: nombre }]
})

const baseVigenciaPhOptions: SelectOption[] = [
  { label: '5 años', value: 5 },
  { label: '10 años', value: 10 },
]

const vigenciaPhOptions = computed(() => {
  const map = new Map<number, SelectOption>()
  for (const option of [...baseVigenciaPhOptions, ...extraVigenciaOptions.value]) {
    map.set(Number(option.value), option)
  }
  const current = Number(vigenciaPhAnios.value)
  if (Number.isFinite(current) && current > 0 && !map.has(current)) {
    map.set(current, { label: `${current} años`, value: current })
  }
  return [...map.values()].sort((a, b) => Number(a.value) - Number(b.value))
})

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
const [idGas] = defineField('idGas')
const [capacidad, capacidadAttrs] = defineField('capacidad')
const [idUnidadMedida, idUnidadMedidaAttrs] = defineField('idUnidadMedida')
const [peso, pesoAttrs] = defineField('peso')
const [vigenciaPhAnios, vigenciaPhAniosAttrs] = defineField('vigenciaPhAnios')

const syncFormValues = () => {
  gasBuscar.value = ''
  extraVigenciaOptions.value = []
  vigenciaCustomError.value = ''
  nuevaVigenciaAnios.value = ''
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

const onUnidadCreated = (opcion: ListaOpcion) => {
  idUnidadMedida.value = opcion.id
}

const addVigenciaCustom = () => {
  const anios = Number(nuevaVigenciaAnios.value)
  if (!Number.isInteger(anios) || anios < 1 || anios > 50) {
    vigenciaCustomError.value = 'Ingresa un número entero entre 1 y 50'
    return
  }

  vigenciaCustomError.value = ''
  if (!extraVigenciaOptions.value.some((item) => Number(item.value) === anios)) {
    extraVigenciaOptions.value = [
      ...extraVigenciaOptions.value,
      { label: `${anios} años`, value: anios },
    ]
  }
  vigenciaPhAnios.value = anios
  vigenciaModalOpen.value = false
  nuevaVigenciaAnios.value = ''
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
    let tipoGuardado: TipoBalon

    if (props.mode === 'create') {
      tipoGuardado = await createMutation.mutateAsync(payload)
    } else if (props.tipoBalon) {
      tipoGuardado = await updateMutation.mutateAsync({
        id: props.tipoBalon.id,
        payload,
      })
    } else {
      return
    }

    emit('saved', tipoGuardado)
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

watch(vigenciaModalOpen, (isOpen) => {
  if (isOpen) {
    nuevaVigenciaAnios.value = ''
    vigenciaCustomError.value = ''
  }
})
</script>

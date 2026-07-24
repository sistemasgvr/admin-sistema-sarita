<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva sucursal' : 'Editar sucursal'"
    :subtitle="
      mode === 'create'
        ? 'Registra una nueva sucursal con su ubicación (punto de partida de guías).'
        : 'Actualiza los datos de la sucursal seleccionada.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="sucursal-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <AppInput
          v-model="codigo"
          label="Código"
          placeholder="SUC-001"
          required
          v-bind="codigoAttrs"
          :disabled="isSubmitting"
          :error="errors.codigo"
        />

        <AppInput
          v-model="nombre"
          label="Nombre"
          placeholder="Sucursal Principal"
          required
          v-bind="nombreAttrs"
          :disabled="isSubmitting"
          :error="errors.nombre"
        />
      </div>

      <AppInput
        v-model="direccion"
        label="Dirección"
        placeholder="Av. Principal 123"
        v-bind="direccionAttrs"
        :disabled="isSubmitting"
      />

      <div class="grid grid-cols-2 gap-3">
        <AppSelect
          v-model="idPaisUI"
          label="País"
          :placeholder="paisesQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
          :options="paisesOptions"
          :disabled="isSubmitting || paisesQuery.isLoading.value"
        />
        <AppSelect
          v-model="idDepartamentoUI"
          label="Departamento"
          :placeholder="
            !idPaisUI
              ? 'Selecciona un país'
              : departamentosQuery.isLoading.value
                ? 'Cargando...'
                : 'Selecciona...'
          "
          :options="departamentosOptions"
          :disabled="isSubmitting || !idPaisUI || departamentosQuery.isLoading.value"
        />
        <AppSelect
          v-model="idProvinciaUI"
          label="Provincia"
          :placeholder="
            !idDepartamentoUI
              ? 'Selecciona un departamento'
              : provinciasQuery.isLoading.value
                ? 'Cargando...'
                : 'Selecciona...'
          "
          :options="provinciasOptions"
          :disabled="isSubmitting || !idDepartamentoUI || provinciasQuery.isLoading.value"
        />
        <AppSelect
          v-model="idDistritoUI"
          label="Distrito"
          :placeholder="
            !idProvinciaUI
              ? 'Selecciona una provincia'
              : distritosQuery.isLoading.value
                ? 'Cargando...'
                : 'Selecciona...'
          "
          :options="distritosOptions"
          :disabled="isSubmitting || !idProvinciaUI || distritosQuery.isLoading.value"
        />
      </div>

      <AppInput
        v-model="telefono"
        label="Teléfono"
        placeholder="999 999 999"
        v-bind="telefonoAttrs"
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
import { computed, nextTick, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  useDepartamentosQuery,
  useDistritosQuery,
  usePaisesQuery,
  useProvinciasQuery,
} from '@/modules/catalogos/composables/useUbigeoQueries'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import {
  useCreateSucursalMutation,
  useUpdateSucursalMutation,
} from '@/modules/configuracion/sucursales/composables/useSucursalMutations'
import type {
  Sucursal,
  SucursalFormMode,
} from '@/modules/configuracion/sucursales/interfaces/sucursal.interface'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import { optionalString, requiredString } from '@/shared/validation'

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

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      codigo: requiredString('El código'),
      nombre: requiredString('El nombre'),
      direccion: optionalString(),
      telefono: optionalString(),
    }),
  ),
  initialValues: {
    codigo: '',
    nombre: '',
    direccion: '',
    telefono: '',
  },
})

const [codigo, codigoAttrs] = defineField('codigo')
const [nombre, nombreAttrs] = defineField('nombre')
const [direccion, direccionAttrs] = defineField('direccion')
const [telefono, telefonoAttrs] = defineField('telefono')

const idPaisUI = ref<number | ''>('')
const idDepartamentoUI = ref<number | ''>('')
const idProvinciaUI = ref<number | ''>('')
const idDistritoUI = ref<number | ''>('')
let isSyncingUbigeo = false

const paisesQuery = usePaisesQuery()
const departamentosQuery = useDepartamentosQuery(idPaisUI)
const provinciasQuery = useProvinciasQuery(idDepartamentoUI)
const distritosQuery = useDistritosQuery(idProvinciaUI)

const paisesOptions = computed(() => toSelectOptions(paisesQuery.data.value))
const departamentosOptions = computed(() => toSelectOptions(departamentosQuery.data.value))
const provinciasOptions = computed(() => toSelectOptions(provinciasQuery.data.value))
const distritosOptions = computed(() => toSelectOptions(distritosQuery.data.value))

watch(idPaisUI, () => {
  if (isSyncingUbigeo) return
  idDepartamentoUI.value = ''
  idProvinciaUI.value = ''
  idDistritoUI.value = ''
})

watch(idDepartamentoUI, () => {
  if (isSyncingUbigeo) return
  idProvinciaUI.value = ''
  idDistritoUI.value = ''
})

watch(idProvinciaUI, () => {
  if (isSyncingUbigeo) return
  idDistritoUI.value = ''
})

const syncFormValues = async () => {
  const s = props.sucursal
  resetForm({
    values: {
      codigo: s?.codigo ?? '',
      nombre: s?.nombre ?? '',
      direccion: s?.direccion ?? '',
      telefono: s?.telefono ?? '',
    },
  })

  isSyncingUbigeo = true
  idPaisUI.value = paisesQuery.data.value?.[0]?.id ?? ''
  idDepartamentoUI.value = s?.id_departamento ?? ''
  idProvinciaUI.value = s?.id_provincia ?? ''
  idDistritoUI.value = s?.id_distrito ?? ''
  await nextTick()
  isSyncingUbigeo = false
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      codigo: values.codigo,
      nombre: values.nombre,
      direccion: values.direccion || undefined,
      idDepartamento: idDepartamentoUI.value ? Number(idDepartamentoUI.value) : undefined,
      idProvincia: idProvinciaUI.value ? Number(idProvinciaUI.value) : undefined,
      idDistrito: idDistritoUI.value ? Number(idDistritoUI.value) : undefined,
      telefono: values.telefono || undefined,
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
  }
})

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      void syncFormValues()
    }
  },
)

watch(
  () => props.sucursal,
  () => {
    if (open.value) {
      void syncFormValues()
    }
  },
)

watch(
  () => paisesQuery.data.value,
  (paises) => {
    if (open.value && !idPaisUI.value && paises?.[0]?.id) {
      idPaisUI.value = paises[0].id
    }
  },
)
</script>

<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva dirección' : 'Editar dirección'"
    :subtitle="
      mode === 'create'
        ? 'Registra una dirección para un cliente o proveedor.'
        : 'Actualiza los datos de la dirección seleccionada.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="direccion-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <SearchableSelect
        v-model="idCliente"
        label="Cliente / Proveedor"
        placeholder="Busca por razón social, nombres o documento..."
        required
        :clearable="false"
        :model-label="clienteLabelActual"
        v-bind="idClienteAttrs"
        :disabled="isSubmitting"
        :error="errors.idCliente"
        :search-fn="searchClientes"
      />
      <p
        v-if="isClienteLocked"
        class="-mt-2 text-theme-xs text-gray-500 dark:text-gray-400"
      >
      </p>

      <div class="grid gap-3 sm:grid-cols-2">
        <AppInput
          v-model="descripcion"
          label="Descripción"
          placeholder="Oficina Administrativa"
          v-bind="descripcionAttrs"
          :disabled="isSubmitting"
          :error="errors.descripcion"
        />

        <AppInput
          v-model="direccion"
          label="Dirección"
          placeholder="Calle Las Magnolias 145, Urb. El Recreo"
          required
          v-bind="direccionAttrs"
          :disabled="isSubmitting"
          :error="errors.direccion"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <AppSelect
          v-model="idPais"
          label="País"
          :placeholder="paisesQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
          required
          v-bind="idPaisAttrs"
          :options="paisesOptions"
          :disabled="isSubmitting || paisesQuery.isLoading.value"
          :error="errors.idPais"
        />
        <AppSelect
          v-model="idDepartamento"
          label="Departamento"
          :placeholder="
            !idPais
              ? 'Selecciona un país'
              : departamentosQuery.isLoading.value
                ? 'Cargando...'
                : 'Selecciona...'
          "
          required
          v-bind="idDepartamentoAttrs"
          :options="departamentosOptions"
          :disabled="isSubmitting || !idPais || departamentosQuery.isLoading.value"
          :error="errors.idDepartamento"
        />
        <AppSelect
          v-model="idProvincia"
          label="Provincia"
          :placeholder="
            !idDepartamento
              ? 'Selecciona un departamento'
              : provinciasQuery.isLoading.value
                ? 'Cargando...'
                : 'Selecciona...'
          "
          required
          v-bind="idProvinciaAttrs"
          :options="provinciasOptions"
          :disabled="isSubmitting || !idDepartamento || provinciasQuery.isLoading.value"
          :error="errors.idProvincia"
        />
        <AppSelect
          v-model="idDistrito"
          label="Distrito"
          :placeholder="
            !idProvincia
              ? 'Selecciona una provincia'
              : distritosQuery.isLoading.value
                ? 'Cargando...'
                : 'Selecciona...'
          "
          required
          v-bind="idDistritoAttrs"
          :options="distritosOptions"
          :disabled="isSubmitting || !idProvincia || distritosQuery.isLoading.value"
          :error="errors.idDistrito"
        />
      </div>

      <AppInput
        v-model="referencia"
        label="Referencia"
        placeholder="A dos cuadras de la plaza"
        v-bind="referenciaAttrs"
        :disabled="isSubmitting"
        :error="errors.referencia"
      />

      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ubicación en el mapa<span class="text-red-500"> *</span>
        </label>
        <MapaLeaflet
          v-model:latitud="latitud"
          v-model:longitud="longitud"
          height="320px"
          :searchable="true"
          :draggable-marker="true"
          :readonly="false"
          :resolve-google-maps-link="resolverCoordenadasDesdeLink"
        />
        <p v-if="errors.latitud" class="mt-1.5 text-xs text-red-500">{{ errors.latitud }}</p>
      </div>

      <AppCheckbox
        v-model="esPrincipal"
        :disabled="isSubmitting"
        label="Establecer como dirección principal"
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
        form="direccion-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear dirección' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  useDepartamentosQuery,
  usePaisesQuery,
  useProvinciasQuery,
  useDistritosQuery,
} from '@/modules/catalogos/composables/useUbigeoQueries'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import {
  useCreateDireccionMutation,
  useUpdateDireccionMutation,
} from '@/modules/direcciones/composables/useDireccionMutations'
import { useDireccionDetailQuery } from '@/modules/direcciones/composables/useDireccionDetailQuery'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'
import type {
  Direccion,
  DireccionFormMode,
} from '@/modules/direcciones/interfaces/direccion.interface'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { getClienteNombrePrincipal } from '@/modules/clientes/utils/clienteNombre'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppCheckbox, AppInput, AppModal, AppSelect, MapaLeaflet } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalString, requiredString } from '@/shared/validation'

interface DireccionFormModalProps {
  mode: DireccionFormMode
  direccion?: Direccion | null
  defaultClienteId?: number | null
  lockCliente?: boolean
}

const props = defineProps<DireccionFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()

const createMutation = useCreateDireccionMutation()
const updateMutation = useUpdateDireccionMutation()

const idReferencia = computed(() => props.direccion?.id)
const direccionDetailQuery = useDireccionDetailQuery(idReferencia, open)
const direccionActual = computed<Direccion | null>(
  () => direccionDetailQuery.data.value ?? props.direccion ?? null,
)

const getClienteNombre = (cliente: Cliente) => getClienteNombrePrincipal(cliente)

const searchClientes = async (query: string): Promise<SelectOption[]> => {
  const response = await clientesService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
    soloActivos: 1,
  })

  return response.data.map((cliente) => ({
    value: cliente.id,
    label: getClienteNombre(cliente),
  }))
}

const clienteLabelActual = computed(() => {
  const d = direccionActual.value
  if (!d) return null
  if (d.cliente_razon_social) return d.cliente_razon_social

  const nombreCompleto = [d.cliente_nombres, d.cliente_apellido_paterno, d.cliente_apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || d.cliente_numero_documento || null
})

const isClienteLocked = computed(
  () =>
    props.mode === 'edit' ||
    (props.mode === 'create' && props.lockCliente && !!props.defaultClienteId),
)

const resolverCoordenadasDesdeLink = async (link: string) => {
  try {
    const { latitud, longitud } = await direccionesService.coordenadasDesdeLink(link)
    return { lat: latitud, lng: longitud }
  } catch {
    return null
  }
}

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idCliente: yup.number().required('El cliente es obligatorio'),
      descripcion: optionalString(),
      direccion: requiredString('La dirección'),
      idPais: yup.number().required('El país es obligatorio'),
      idDepartamento: yup.number().required('El departamento es obligatorio'),
      idProvincia: yup.number().required('La provincia es obligatoria'),
      idDistrito: yup.number().required('El distrito es obligatorio'),
      referencia: optionalString(),
      latitud: yup
        .number()
        .test('ubicacion-requerida', 'Selecciona la ubicación en el mapa', function (value) {
          const longitud = (this.parent as { longitud?: number }).longitud
          return value != null && longitud != null
        }),
      longitud: yup.number().optional(),
      esPrincipal: yup.boolean().default(false),
    }),
  ),
  initialValues: {
    idCliente: undefined as number | undefined,
    descripcion: '',
    direccion: '',
    idPais: undefined as number | undefined,
    idDepartamento: undefined as number | undefined,
    idProvincia: undefined as number | undefined,
    idDistrito: undefined as number | undefined,
    referencia: '',
    latitud: undefined as number | undefined,
    longitud: undefined as number | undefined,
    esPrincipal: false,
  },
})

const [idCliente, idClienteAttrs] = defineField('idCliente')
const [descripcion, descripcionAttrs] = defineField('descripcion')
const [direccion, direccionAttrs] = defineField('direccion')
const [idPais, idPaisAttrs] = defineField('idPais')
const [idDepartamento, idDepartamentoAttrs] = defineField('idDepartamento')
const [idProvincia, idProvinciaAttrs] = defineField('idProvincia')
const [idDistrito, idDistritoAttrs] = defineField('idDistrito')
const [referencia, referenciaAttrs] = defineField('referencia')
const [latitud] = defineField('latitud')
const [longitud] = defineField('longitud')
const [esPrincipal] = defineField('esPrincipal')

const paisesQuery = usePaisesQuery()
const departamentosQuery = useDepartamentosQuery(idPais)
const provinciasQuery = useProvinciasQuery(idDepartamento)
const distritosQuery = useDistritosQuery(idProvincia)

const paisesOptions = computed(() => toSelectOptions(paisesQuery.data.value))
const departamentosOptions = computed(() => toSelectOptions(departamentosQuery.data.value))
const provinciasOptions = computed(() => toSelectOptions(provinciasQuery.data.value))
const distritosOptions = computed(() => toSelectOptions(distritosQuery.data.value))
let isSyncingUbigeo = false

watch(idPais, () => {
  if (isSyncingUbigeo) return
  idDepartamento.value = undefined
  idProvincia.value = undefined
  idDistrito.value = undefined
})

watch(idDepartamento, () => {
  if (isSyncingUbigeo) return
  idProvincia.value = undefined
  idDistrito.value = undefined
})

watch(idProvincia, () => {
  if (isSyncingUbigeo) return
  idDistrito.value = undefined
})

const syncFormValues = async () => {
  const d = direccionActual.value

  isSyncingUbigeo = true
  resetForm({
    values: {
      idCliente: d?.id_cliente ?? props.defaultClienteId ?? undefined,
      descripcion: d?.descripcion ?? '',
      direccion: d?.direccion ?? '',
      idPais: d?.id_pais ?? paisesQuery.data.value?.[0]?.id ?? undefined,
      idDepartamento: d?.id_departamento ?? undefined,
      idProvincia: d?.id_provincia ?? undefined,
      idDistrito: d?.id_distrito ?? undefined,
      referencia: d?.referencia ?? '',
      latitud: d?.latitud ?? undefined,
      longitud: d?.longitud ?? undefined,
      esPrincipal: d?.es_principal ?? false,
    },
  })
  await nextTick()
  isSyncingUbigeo = false
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  try {
    if (props.mode === 'create') {
      await createMutation.mutateAsync({
        idUsuarioAuditoria: currentUserId,
        idCliente: Number(values.idCliente),
        direccion: values.direccion,
        descripcion: values.descripcion || undefined,
        idPais: Number(values.idPais),
        idDepartamento: Number(values.idDepartamento),
        idProvincia: Number(values.idProvincia),
        idDistrito: Number(values.idDistrito),
        referencia: values.referencia || undefined,
        latitud: values.latitud,
        longitud: values.longitud,
        esPrincipal: values.esPrincipal ?? false,
      })
    } else if (props.direccion) {
      await updateMutation.mutateAsync({
        id: props.direccion.id,
        payload: {
          idUsuarioAuditoria: currentUserId,
          direccion: values.direccion,
          descripcion: values.descripcion || undefined,
          idPais: Number(values.idPais),
          idDepartamento: Number(values.idDepartamento),
          idProvincia: Number(values.idProvincia),
          idDistrito: Number(values.idDistrito),
          referencia: values.referencia || undefined,
          latitud: values.latitud,
          longitud: values.longitud,
          esPrincipal: values.esPrincipal ?? false,
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
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      syncFormValues()
    }
  },
)

watch(
  () => direccionDetailQuery.data.value,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)

watch(
  () => props.direccion,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)

watch(
  () => props.defaultClienteId,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>
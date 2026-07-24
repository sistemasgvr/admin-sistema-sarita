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
        :disabled="isSubmitting || isClienteLocked"
        :error="errors.idCliente"
        :search-fn="searchClientes"
      />
      <p
        v-if="isClienteLocked && mode === 'create'"
        class="-mt-2 text-theme-xs text-gray-500 dark:text-gray-400"
      >
        Cliente preseleccionado; no es necesario buscarlo de nuevo.
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
          v-model="idDistrito"
          label="Distrito"
          :placeholder="
            !idProvinciaUI
              ? 'Selecciona una provincia'
              : distritosQuery.isLoading.value
                ? 'Cargando...'
                : 'Selecciona...'
          "
          v-bind="idDistritoAttrs"
          :options="distritosOptions"
          :disabled="isSubmitting || !idProvinciaUI || distritosQuery.isLoading.value"
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
          Ubicación en el mapa
        </label>
        <MapaLeaflet
          v-model:latitud="latitud"
          v-model:longitud="longitud"
          height="320px"
          :searchable="true"
          :draggable-marker="true"
          :readonly="false"
          :resolve-google-maps-link="resolverCoordenadasDesdeLink"
          @location-confirmed="onMapLocationConfirmed"
        />
        <p v-if="ubicacionHint" class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
          {{ ubicacionHint }}
        </p>
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
import { computed, nextTick, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  useDepartamentosQuery,
  usePaisesQuery,
  useProvinciasQuery,
  useDistritosQuery,
} from '@/modules/catalogos/composables/useUbigeoQueries'
import { buscarIdsUbigeoPorNombre } from '@/modules/catalogos/services/ubigeo.service'
import { extractUbigeoDesdeNominatim } from '@/modules/catalogos/utils/ubigeoFromNominatim'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import type {
  MapaLocationAddress,
  MapaLocationConfirmed,
} from '@/shared/components/map/MapaLeaflet.vue'
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
  defaultClienteLabel?: string | null
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

const clienteLabelFallback = ref<string | null>(null)
const clienteLabelFallbackId = ref<number | null>(null)
const ubicacionHint = ref('')

const clienteLabelActual = computed(() => {
  const d = direccionActual.value
  if (d) {
    if (d.cliente_razon_social) return d.cliente_razon_social

    const nombreCompleto = [d.cliente_nombres, d.cliente_apellido_paterno, d.cliente_apellido_materno]
      .filter(Boolean)
      .join(' ')
      .trim()

    return nombreCompleto || d.cliente_numero_documento || null
  }

  return props.defaultClienteLabel ?? clienteLabelFallback.value
})

const isClienteLocked = computed(
  () =>
    props.mode === 'edit' ||
    (props.mode === 'create' && props.lockCliente && !!props.defaultClienteId),
)

async function ensureClienteLabel() {
  const id = props.defaultClienteId
  if (!id) {
    clienteLabelFallback.value = null
    clienteLabelFallbackId.value = null
    return
  }
  if (props.defaultClienteLabel?.trim()) {
    clienteLabelFallback.value = props.defaultClienteLabel.trim()
    clienteLabelFallbackId.value = id
    return
  }
  if (clienteLabelFallbackId.value === id && clienteLabelFallback.value) return

  try {
    const cliente = await clientesService.obtenerPorId(id)
    clienteLabelFallback.value = getClienteNombre(cliente)
    clienteLabelFallbackId.value = id
  } catch {
    clienteLabelFallback.value = null
    clienteLabelFallbackId.value = null
  }
}

function buildDireccionTexto(address: MapaLocationAddress | null | undefined, fallback?: string | null) {
  if (!address) return (fallback ?? '').trim()
  const partes = [
    [address.road, address.house_number].filter(Boolean).join(' ').trim(),
    address.suburb || address.neighbourhood,
  ].filter(Boolean)
  return partes.join(', ') || (fallback ?? '').trim()
}

async function waitForOptions(
  getOptions: () => Array<{ value: string | number }>,
  id: number,
  attempts = 20,
) {
  for (let i = 0; i < attempts; i += 1) {
    if (getOptions().some((option) => Number(option.value) === id)) return true
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  return false
}

async function onMapLocationConfirmed(location: MapaLocationConfirmed) {
  ubicacionHint.value = ''
  const address = location.address
  const textoDireccion = buildDireccionTexto(address, location.displayName)
  if (textoDireccion && !String(direccion.value ?? '').trim()) {
    direccion.value = textoDireccion
  }

  const extraido = extractUbigeoDesdeNominatim(address, location.displayName)
  const idPaisPeru = Number(idPaisUI.value || paisesQuery.data.value?.[0]?.id || 1)

  isSyncingUbigeo = true
  try {
    // Limpiar siempre: si no hay match, el usuario completa a mano (sin valores viejos).
    idPaisUI.value = idPaisPeru
    idDepartamentoUI.value = ''
    idProvinciaUI.value = ''
    idDistrito.value = undefined

    if (!extraido.departamento && !extraido.provincias.length && !extraido.distritos.length) {
      ubicacionHint.value =
        'Ubicación marcada. Completa departamento, provincia y distrito manualmente.'
      return
    }

    const coincidencias = await buscarIdsUbigeoPorNombre({
      idPais: idPaisPeru,
      departamento: extraido.departamento,
      provincias: extraido.provincias,
      distritos: extraido.distritos,
    })

    if (coincidencias.idDepartamento) {
      idDepartamentoUI.value = coincidencias.idDepartamento
      await waitForOptions(() => departamentosOptions.value, coincidencias.idDepartamento)
    }
    if (coincidencias.idProvincia) {
      idProvinciaUI.value = coincidencias.idProvincia
      await waitForOptions(() => provinciasOptions.value, coincidencias.idProvincia)
    }
    if (coincidencias.idDistrito) {
      idDistrito.value = coincidencias.idDistrito
      await waitForOptions(() => distritosOptions.value, coincidencias.idDistrito)
    }

    const aplicados = [
      coincidencias.idDepartamento ? 'departamento' : null,
      coincidencias.idProvincia ? 'provincia' : null,
      coincidencias.idDistrito ? 'distrito' : null,
    ].filter(Boolean)

    if (aplicados.length === 3) {
      ubicacionHint.value = 'Ubigeo cargado desde el mapa. Puedes ajustarlo si hace falta.'
    } else if (aplicados.length > 0) {
      ubicacionHint.value = `Se cargó ${aplicados.join(', ')}. Completa el resto manualmente.`
    } else {
      ubicacionHint.value =
        'No hubo coincidencia de ubigeo. Selecciona departamento, provincia y distrito manualmente.'
    }
  } finally {
    await nextTick()
    isSyncingUbigeo = false
  }
}

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
      idDistrito: yup.number().optional(),
      referencia: optionalString(),
      latitud: yup.number().optional(),
      longitud: yup.number().optional(),
      esPrincipal: yup.boolean().default(false),
    }),
  ),
  initialValues: {
    idCliente: undefined as number | undefined,
    descripcion: '',
    direccion: '',
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
const [idDistrito, idDistritoAttrs] = defineField('idDistrito')
const [referencia, referenciaAttrs] = defineField('referencia')
const [latitud] = defineField('latitud')
const [longitud] = defineField('longitud')
const [esPrincipal] = defineField('esPrincipal')

const idPaisUI = ref<number | ''>('')
const idDepartamentoUI = ref<number | ''>('')
const idProvinciaUI = ref<number | ''>('')

const paisesQuery = usePaisesQuery()
const departamentosQuery = useDepartamentosQuery(idPaisUI)
const provinciasQuery = useProvinciasQuery(idDepartamentoUI)
const distritosQuery = useDistritosQuery(idProvinciaUI)

const paisesOptions = computed(() => toSelectOptions(paisesQuery.data.value))
const departamentosOptions = computed(() => toSelectOptions(departamentosQuery.data.value))
const provinciasOptions = computed(() => toSelectOptions(provinciasQuery.data.value))
const distritosOptions = computed(() => toSelectOptions(distritosQuery.data.value))
let isSyncingUbigeo = false

watch(idPaisUI, () => {
  if (isSyncingUbigeo) return
  idDepartamentoUI.value = ''
  idProvinciaUI.value = ''
  idDistrito.value = undefined
})

watch(idDepartamentoUI, () => {
  if (isSyncingUbigeo) return
  idProvinciaUI.value = ''
  idDistrito.value = undefined
})

watch(idProvinciaUI, () => {
  if (isSyncingUbigeo) return
  idDistrito.value = undefined
})

const syncFormValues = async () => {
  const d = direccionActual.value
  ubicacionHint.value = ''
  await ensureClienteLabel()

  resetForm({
    values: {
      idCliente: d?.id_cliente ?? props.defaultClienteId ?? undefined,
      descripcion: d?.descripcion ?? '',
      direccion: d?.direccion ?? '',
      idDistrito: d?.id_distrito ?? undefined,
      referencia: d?.referencia ?? '',
      latitud: d?.latitud ?? undefined,
      longitud: d?.longitud ?? undefined,
      esPrincipal: d?.es_principal ?? false,
    },
  })

  isSyncingUbigeo = true
  idPaisUI.value = d?.id_pais ?? paisesQuery.data.value?.[0]?.id ?? ''
  idDepartamentoUI.value = d?.id_departamento ?? ''
  idProvinciaUI.value = d?.id_provincia ?? ''
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
        idPais: idPaisUI.value ? Number(idPaisUI.value) : undefined,
        idDepartamento: idDepartamentoUI.value ? Number(idDepartamentoUI.value) : undefined,
        idProvincia: idProvinciaUI.value ? Number(idProvinciaUI.value) : undefined,
        idDistrito: values.idDistrito ? Number(values.idDistrito) : undefined,
        referencia: values.referencia || undefined,
        latitud: values.latitud || undefined,
        longitud: values.longitud  || undefined,
        esPrincipal: values.esPrincipal ?? false,
      })
    } else if (props.direccion) {
      await updateMutation.mutateAsync({
        id: props.direccion.id,
        payload: {
          idUsuarioAuditoria: currentUserId,
          direccion: values.direccion,
          descripcion: values.descripcion || undefined,
          idPais: idPaisUI.value ? Number(idPaisUI.value) : undefined,
          idDepartamento: idDepartamentoUI.value ? Number(idDepartamentoUI.value) : undefined,
          idProvincia: idProvinciaUI.value ? Number(idProvinciaUI.value) : undefined,
          idDistrito: values.idDistrito ? Number(values.idDistrito) : undefined,
          referencia: values.referencia || undefined,
          latitud: values.latitud || undefined,
          longitud: values.longitud  || undefined,
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
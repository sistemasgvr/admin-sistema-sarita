<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo cilindro' : 'Editar cilindro'"
    :subtitle="
      mode === 'create'
        ? 'Registra un cilindro en el libro de trazabilidad.'
        : 'Actualiza los datos del cilindro seleccionado.'
    "
    size="xl"
    @close="handleClose"
  >
    <form
      v-if="!isLoadingBalon"
      id="balon-form"
      class="space-y-6"
      autocomplete="off"
      @submit="onSubmit"
    >
      <div class="space-y-4">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Identificación</h5>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="codigoBalon"
            label="Código de balón"
            placeholder="20K650076"
            required
            v-bind="codigoBalonAttrs"
            :disabled="isSubmitting || isLoadingBalon"
            :error="errors.codigoBalon"
          />
          <AppInput
            v-model="numeroRecepcion"
            label="Número de recepción"
            v-bind="numeroRecepcionAttrs"
            :disabled="isSubmitting || isLoadingBalon"
            :error="errors.numeroRecepcion"
          />
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <AppInput
            v-model="libroCilindro"
            label="Libro cilindro"
            placeholder="LIBRO 1"
            v-bind="libroCilindroAttrs"
            :disabled="isSubmitting || isLoadingBalon"
            :error="errors.libroCilindro"
          />
          <AppInput
            v-model="paginaLibro"
            label="Página"
            type="number"
            min="0"
            v-bind="paginaLibroAttrs"
            :disabled="isSubmitting || isLoadingBalon"
            :error="errors.paginaLibro"
          />
          <AppInput
            v-model="fechaRegistro"
            label="Fecha registro"
            type="date"
            v-bind="fechaRegistroAttrs"
            :disabled="isSubmitting || isLoadingBalon"
            :error="errors.fechaRegistro"
          />
        </div>
      </div>

      <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Clasificación</h5>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppSelect
            v-model="idTipoBalon"
            label="Tipo de balón"
            :placeholder="tiposBalonQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="tipoBalonOptions"
            :disabled="isSubmitting || tiposBalonQuery.isLoading.value"
            v-bind="idTipoBalonAttrs"
            :error="errors.idTipoBalon"
          />
          <AppSelect
            v-model="idProductoGas"
            label="Gas (producto)"
            :placeholder="productosQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="gasOptions"
            :disabled="isSubmitting || productosQuery.isLoading.value"
            v-bind="idProductoGasAttrs"
            :error="errors.idProductoGas"
          />
          <AppSelect
            v-model="idEstadoBalon"
            label="Estado del balón"
            :placeholder="estadoBalonQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="estadoBalonOptions"
            :disabled="isSubmitting || estadoBalonQuery.isLoading.value"
            v-bind="idEstadoBalonAttrs"
            :error="errors.idEstadoBalon"
          />
          <AppSelect
            v-model="idReferencia"
            label="Referencia"
            :placeholder="referenciaQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="referenciaOptions"
            :disabled="isSubmitting || referenciaQuery.isLoading.value"
            v-bind="idReferenciaAttrs"
            :error="errors.idReferencia"
          />
        </div>
      </div>

      <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Ubicación</h5>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppSelect
            v-model="idAlmacen"
            label="Almacén"
            placeholder="Selecciona almacén"
            :options="almacenOptions"
            :disabled="isSubmitting || almacenesQuery.isLoading.value"
            v-bind="idAlmacenAttrs"
            :error="errors.idAlmacen"
          />
          <AppSelect
            v-model="idClienteUbicacion"
            label="Cliente (ubicación actual)"
            placeholder="Opcional"
            :options="clienteOptions"
            :disabled="isSubmitting || clientesQuery.isLoading.value"
            v-bind="idClienteUbicacionAttrs"
            :error="errors.idClienteUbicacion"
          />
        </div>
      </div>

      <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Propiedad del envase</h5>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppSelect
            v-model="idPropietario"
            label="Propietario"
            :placeholder="propietarioQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="propietarioOptions"
            :disabled="isSubmitting || propietarioQuery.isLoading.value"
            v-bind="idPropietarioAttrs"
            :error="errors.idPropietario"
          />
          <AppSelect
            v-if="requiereClientePropietario"
            v-model="idClientePropietario"
            label="Cliente propietario"
            placeholder="Selecciona cliente"
            :options="clienteOptions"
            :disabled="isSubmitting || clientesQuery.isLoading.value"
            v-bind="idClientePropietarioAttrs"
            :error="errors.idClientePropietario"
          />
        </div>
      </div>

      <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Prueba hidrostática</h5>
        <div class="grid gap-4 sm:grid-cols-3">
          <AppInput
            v-model="fechaUltimaPruebaHidrostatica"
            label="Última P.H."
            type="date"
            v-bind="fechaUltimaPruebaHidrostaticaAttrs"
            :disabled="isSubmitting || isLoadingBalon"
            :error="errors.fechaUltimaPruebaHidrostatica"
          />
          <AppInput
            v-model="vigenciaPruebaHidrostaticaAnios"
            label="Vigencia (años)"
            type="number"
            min="1"
            v-bind="vigenciaPruebaHidrostaticaAniosAttrs"
            :disabled="isSubmitting || isLoadingBalon"
            :error="errors.vigenciaPruebaHidrostaticaAnios"
          />
          <AppInput
            v-model="fechaProximaPruebaHidrostatica"
            label="Próxima P.H."
            type="date"
            v-bind="fechaProximaPruebaHidrostaticaAttrs"
            :disabled="isSubmitting || isLoadingBalon"
            :error="errors.fechaProximaPruebaHidrostatica"
          />
        </div>
      </div>

      <div class="space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Datos técnicos</h5>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="fechaFabricacion"
            label="Fecha fabricación"
            type="date"
            v-bind="fechaFabricacionAttrs"
            :disabled="isSubmitting || isLoadingBalon"
            :error="errors.fechaFabricacion"
          />
          <AppInput
            v-model="presionActual"
            label="Presión actual"
            type="number"
            min="0"
            step="0.01"
            v-bind="presionActualAttrs"
            :disabled="isSubmitting || isLoadingBalon"
            :error="errors.presionActual"
          />
        </div>
        <AppTextarea
          v-model="observacion"
          label="Observación"
          placeholder="Notas adicionales"
          v-bind="observacionAttrs"
          :disabled="isSubmitting || isLoadingBalon"
          :error="errors.observacion"
        />
      </div>
    </form>

    <div v-else class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando datos del cilindro...
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting || isLoadingBalon"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="balon-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting || isLoadingBalon"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Registrar cilindro' : 'Guardar cambios' }}
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
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import {
  useCreateBalonMutation,
  useUpdateBalonMutation,
} from '@/modules/balones/cilindros/composables/useBalonMutations'
import { useBalonQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { useTiposBalonQuery } from '@/modules/balones/tipos-balon/composables/useTiposBalonQuery'
import type { BalonFormMode } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppTextarea } from '@/shared/components'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'

interface BalonFormModalProps {
  mode: BalonFormMode
  balonId?: number | null
}

const props = defineProps<BalonFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateBalonMutation()
const updateMutation = useUpdateBalonMutation()

const balonIdRef = computed(() => (props.mode === 'edit' ? props.balonId : null))
const balonQuery = useBalonQuery(balonIdRef)
const isLoadingBalon = computed(
  () => props.mode === 'edit' && open.value && balonQuery.isFetching.value,
)
const balonDetalle = computed(() => balonQuery.data.value ?? null)

const tiposBalonFilters = ref({ pagina: 1, limite: 200 })
const tiposBalonQuery = useTiposBalonQuery(tiposBalonFilters)

const productosFilters = ref({ pagina: 1, limite: 200, esGas: true })
const productosQuery = useProductosQuery(productosFilters)

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const listaEstadoBalonId = ref(ListaIds.ESTADO_BALON)
const listaReferenciaId = ref(ListaIds.REFERENCIA_CILINDRO)
const listaPropietarioId = ref(ListaIds.PROPIETARIO_BALON)

const estadoBalonQuery = useListaOpcionesQuery(listaEstadoBalonId)
const referenciaQuery = useListaOpcionesQuery(listaReferenciaId)
const propietarioQuery = useListaOpcionesQuery(listaPropietarioId)

const tipoBalonOptions = computed(() =>
  (tiposBalonQuery.data.value?.data ?? []).map((tipo) => ({
    label: tipo.nombre,
    value: tipo.id,
  })),
)

const gasOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((producto) => ({
    label: `${producto.codigo} — ${producto.nombre}`,
    value: producto.id,
  })),
)

const almacenOptions = computed(() =>
  (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    label: almacen.nombre,
    value: almacen.id,
  })),
)

const clienteOptions = computed(() =>
  (clientesQuery.data.value?.data ?? []).map((cliente) => ({
    label:
      cliente.razon_social ||
      [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
      cliente.numero_documento,
    value: cliente.id,
  })),
)

const estadoBalonOptions = computed(() => toSelectOptions(estadoBalonQuery.data.value))
const referenciaOptions = computed(() => toSelectOptions(referenciaQuery.data.value))
const propietarioOptions = computed(() => toSelectOptions(propietarioQuery.data.value))

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      codigoBalon: requiredString('El código de balón').max(50, 'Máximo 50 caracteres'),
      libroCilindro: optionalString().max(30, 'Máximo 30 caracteres'),
      paginaLibro: optionalNumber(),
      fechaRegistro: optionalString(),
      numeroRecepcion: optionalString().max(30, 'Máximo 30 caracteres'),
      idAlmacen: optionalNumber(),
      idClienteUbicacion: optionalNumber(),
      idPropietario: optionalNumber(),
      idClientePropietario: optionalNumber(),
      idReferencia: optionalNumber(),
      idTipoBalon: optionalNumber(),
      idProductoGas: optionalNumber(),
      idEstadoBalon: optionalNumber(),
      fechaUltimaPruebaHidrostatica: optionalString(),
      vigenciaPruebaHidrostaticaAnios: optionalNumber(),
      fechaProximaPruebaHidrostatica: optionalString(),
      fechaFabricacion: optionalString(),
      presionActual: optionalNumber(),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
    }),
  ),
  initialValues: {
    codigoBalon: '',
    libroCilindro: '',
    paginaLibro: undefined as number | undefined,
    fechaRegistro: '',
    numeroRecepcion: '',
    idAlmacen: undefined as number | undefined,
    idClienteUbicacion: undefined as number | undefined,
    idPropietario: undefined as number | undefined,
    idClientePropietario: undefined as number | undefined,
    idReferencia: undefined as number | undefined,
    idTipoBalon: undefined as number | undefined,
    idProductoGas: undefined as number | undefined,
    idEstadoBalon: undefined as number | undefined,
    fechaUltimaPruebaHidrostatica: '',
    vigenciaPruebaHidrostaticaAnios: 5 as number | undefined,
    fechaProximaPruebaHidrostatica: '',
    fechaFabricacion: '',
    presionActual: undefined as number | undefined,
    observacion: '',
  },
})

const [codigoBalon, codigoBalonAttrs] = defineField('codigoBalon')
const [libroCilindro, libroCilindroAttrs] = defineField('libroCilindro')
const [paginaLibro, paginaLibroAttrs] = defineField('paginaLibro')
const [fechaRegistro, fechaRegistroAttrs] = defineField('fechaRegistro')
const [numeroRecepcion, numeroRecepcionAttrs] = defineField('numeroRecepcion')
const [idAlmacen, idAlmacenAttrs] = defineField('idAlmacen')
const [idClienteUbicacion, idClienteUbicacionAttrs] = defineField('idClienteUbicacion')
const [idPropietario, idPropietarioAttrs] = defineField('idPropietario')
const [idClientePropietario, idClientePropietarioAttrs] = defineField('idClientePropietario')
const [idReferencia, idReferenciaAttrs] = defineField('idReferencia')
const [idTipoBalon, idTipoBalonAttrs] = defineField('idTipoBalon')
const [idProductoGas, idProductoGasAttrs] = defineField('idProductoGas')
const [idEstadoBalon, idEstadoBalonAttrs] = defineField('idEstadoBalon')
const [fechaUltimaPruebaHidrostatica, fechaUltimaPruebaHidrostaticaAttrs] = defineField(
  'fechaUltimaPruebaHidrostatica',
)
const [vigenciaPruebaHidrostaticaAnios, vigenciaPruebaHidrostaticaAniosAttrs] = defineField(
  'vigenciaPruebaHidrostaticaAnios',
)
const [fechaProximaPruebaHidrostatica, fechaProximaPruebaHidrostaticaAttrs] = defineField(
  'fechaProximaPruebaHidrostatica',
)
const [fechaFabricacion, fechaFabricacionAttrs] = defineField('fechaFabricacion')
const [presionActual, presionActualAttrs] = defineField('presionActual')
const [observacion, observacionAttrs] = defineField('observacion')

const propietarioSeleccionado = computed(() =>
  propietarioQuery.data.value?.find((opcion) => opcion.id === Number(idPropietario.value)),
)

const requiereClientePropietario = computed(
  () => propietarioSeleccionado.value?.nombre?.toUpperCase() === 'CLIENTE',
)

watch(idPropietario, () => {
  if (!requiereClientePropietario.value) {
    idClientePropietario.value = undefined
  }
})

const buildPayload = (
  values: {
    codigoBalon: string
    libroCilindro: string
    paginaLibro?: number
    fechaRegistro: string
    numeroRecepcion: string
    idAlmacen?: number
    idClienteUbicacion?: number
    idPropietario?: number
    idClientePropietario?: number
    idReferencia?: number
    idTipoBalon?: number
    idProductoGas?: number
    idEstadoBalon?: number
    fechaUltimaPruebaHidrostatica: string
    vigenciaPruebaHidrostaticaAnios?: number
    fechaProximaPruebaHidrostatica: string
    fechaFabricacion: string
    presionActual?: number
    observacion: string
  },
  userId: number,
) => ({
  idUsuarioAuditoria: userId,
  codigoBalon: values.codigoBalon,
  libroCilindro: values.libroCilindro || undefined,
  paginaLibro: values.paginaLibro,
  fechaRegistro: values.fechaRegistro || undefined,
  numeroRecepcion: values.numeroRecepcion || undefined,
  idAlmacen: values.idAlmacen,
  idClienteUbicacion: values.idClienteUbicacion,
  idPropietario: values.idPropietario,
  idClientePropietario: requiereClientePropietario.value ? values.idClientePropietario : undefined,
  idReferencia: values.idReferencia,
  idTipoBalon: values.idTipoBalon,
  idProductoGas: values.idProductoGas,
  idEstadoBalon: values.idEstadoBalon,
  fechaUltimaPruebaHidrostatica: values.fechaUltimaPruebaHidrostatica || undefined,
  vigenciaPruebaHidrostaticaAnios: values.vigenciaPruebaHidrostaticaAnios,
  fechaProximaPruebaHidrostatica: values.fechaProximaPruebaHidrostatica || undefined,
  fechaFabricacion: values.fechaFabricacion || undefined,
  presionActual: values.presionActual,
  observacion: values.observacion || undefined,
})

const syncFormValues = () => {
  const data = balonDetalle.value
  resetForm({
    values: {
      codigoBalon: data?.codigo_balon ?? '',
      libroCilindro: data?.libro_cilindro ?? '',
      paginaLibro: data?.pagina_libro ?? undefined,
      fechaRegistro: toDateInput(data?.fecha_registro),
      numeroRecepcion: data?.numero_recepcion ?? '',
      idAlmacen: data?.id_almacen ?? undefined,
      idClienteUbicacion: data?.id_cliente_ubicacion ?? undefined,
      idPropietario: data?.id_propietario ?? undefined,
      idClientePropietario: data?.id_cliente_propietario ?? undefined,
      idReferencia: data?.id_referencia ?? undefined,
      idTipoBalon: data?.id_tipo_balon ?? undefined,
      idProductoGas: data?.id_producto_gas ?? undefined,
      idEstadoBalon: data?.id_estado_balon ?? undefined,
      fechaUltimaPruebaHidrostatica: toDateInput(data?.fecha_ultima_prueba_hidrostatica),
      vigenciaPruebaHidrostaticaAnios: data?.vigencia_prueba_hidrostatica_anios ?? 5,
      fechaProximaPruebaHidrostatica: toDateInput(data?.fecha_proxima_prueba_hidrostatica),
      fechaFabricacion: toDateInput(data?.fecha_fabricacion),
      presionActual: data?.presion_actual ?? undefined,
      observacion: data?.observacion ?? '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  const payload = buildPayload(
    {
      ...values,
      libroCilindro: values.libroCilindro ?? '',
      fechaRegistro: values.fechaRegistro ?? '',
      numeroRecepcion: values.numeroRecepcion ?? '',
      fechaUltimaPruebaHidrostatica: values.fechaUltimaPruebaHidrostatica ?? '',
      fechaProximaPruebaHidrostatica: values.fechaProximaPruebaHidrostatica ?? '',
      fechaFabricacion: values.fechaFabricacion ?? '',
      observacion: values.observacion ?? '',
    },
    currentUserId,
  )

  try {
    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.balonId) {
      await updateMutation.mutateAsync({
        id: props.balonId,
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
      if (props.mode === 'create') {
        syncFormValues()
      }
    }
  },
)

watch(balonDetalle, () => {
  if (open.value && props.mode === 'edit') {
    syncFormValues()
  }
})
</script>

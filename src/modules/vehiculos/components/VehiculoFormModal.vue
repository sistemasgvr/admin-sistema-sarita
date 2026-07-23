<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo vehículo' : 'Editar vehículo'"
    :subtitle="
      mode === 'create'
        ? 'Registra un vehículo, asignado o no a un cliente.'
        : 'Actualiza los datos del vehículo seleccionado.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="vehiculo-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <SearchableSelect
          v-model="idCliente"
          label="Cliente / Proveedor dueño"
          placeholder="Busca por razón social, nombres o documento..."
          empty-option-label="Sin cliente asignado"
          :model-label="clienteLabelActual"
          v-bind="idClienteAttrs"
          :disabled="isSubmitting"
          :error="errors.idCliente"
          :search-fn="searchClientes"
        />

        <AppSelect
          v-model="idTipoVehiculo"
          label="Tipo de vehículo"
          :placeholder="tipoVehiculoQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
          required
          v-bind="idTipoVehiculoAttrs"
          :disabled="isSubmitting || tipoVehiculoQuery.isLoading.value"
          :error="errors.idTipoVehiculo"
          :options="tipoVehiculoOptions"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <AppInput
          v-model="placa"
          label="Placa"
          placeholder="ABC-123"
          required
          v-bind="placaAttrs"
          :disabled="isSubmitting"
          :error="errors.placa"
        />

        <AppInput
          v-model="placa2"
          label="Placa secundaria"
          placeholder="Opcional (semirremolque)"
          v-bind="placa2Attrs"
          :disabled="isSubmitting"
          :error="errors.placa2"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <AppInput
          v-model="marca"
          label="Marca"
          placeholder="Volvo"
          v-bind="marcaAttrs"
          :disabled="isSubmitting"
          :error="errors.marca"
        />

        <AppInput
          v-model="marca2"
          label="Marca secundaria"
          placeholder="Opcional"
          v-bind="marca2Attrs"
          :disabled="isSubmitting"
          :error="errors.marca2"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <AppInput
          v-model="modelo"
          label="Modelo"
          placeholder="FH 460"
          v-bind="modeloAttrs"
          :disabled="isSubmitting"
          :error="errors.modelo"
        />

        <AppInput
          v-model="anio"
          type="number"
          label="Año"
          placeholder="2022"
          v-bind="anioAttrs"
          :disabled="isSubmitting"
          :error="errors.anio"
        />

        <AppInput
          v-model="color"
          label="Color"
          placeholder="Blanco"
          v-bind="colorAttrs"
          :disabled="isSubmitting"
          :error="errors.color"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <AppInput
          v-model="certificadoInscripcion"
          label="Certificado de inscripción"
          placeholder="CERT-100293"
          v-bind="certificadoInscripcionAttrs"
          :disabled="isSubmitting"
          :error="errors.certificadoInscripcion"
        />

        <AppInput
          v-model="certificado2"
          label="Certificado secundario"
          placeholder="Opcional"
          v-bind="certificado2Attrs"
          :disabled="isSubmitting"
          :error="errors.certificado2"
        />
      </div>
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
        form="vehiculo-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear vehículo' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import {
  useCreateVehiculoMutation,
  useUpdateVehiculoMutation,
} from '@/modules/vehiculos/composables/useVehiculoMutations'
import { useVehiculoDetailQuery } from '@/modules/vehiculos/composables/useVehiculoDetailQuery'
import type {
  Vehiculo,
  VehiculoFormMode,
} from '@/modules/vehiculos/interfaces/vehiculo.interface'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { getClienteNombrePrincipal } from '@/modules/clientes/utils/clienteNombre'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import { ListaIds } from '@/shared/constants/lista-ids'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalString, requiredString } from '@/shared/validation'

interface VehiculoFormModalProps {
  mode: VehiculoFormMode
  vehiculo?: Vehiculo | null
  defaultClienteId?: number | null
  defaultClienteLabel?: string | null
}

const props = defineProps<VehiculoFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: [vehiculo?: Vehiculo]
}>()

const authStore = useAuthStore()

const createMutation = useCreateVehiculoMutation()
const updateMutation = useUpdateVehiculoMutation()

// Al editar, la fila de la tabla puede venir incompleta o desactualizada.
// Se consulta el detalle real (GET /vehiculos/:id) y se usa como fuente
// de verdad; mientras carga, se muestra lo que ya trae la fila.
const idReferencia = computed(() => props.vehiculo?.id)
const vehiculoDetailQuery = useVehiculoDetailQuery(idReferencia, open)
const vehiculoActual = computed<Vehiculo | null>(
  () => vehiculoDetailQuery.data.value ?? props.vehiculo ?? null,
)

const listaTipoVehiculoId = computed(() => ListaIds.TIPO_VEHICULO)
const tipoVehiculoQuery = useListaOpcionesQuery(listaTipoVehiculoId)
const tipoVehiculoOptions = computed(() => toSelectOptions(tipoVehiculoQuery.data.value))

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
  const v = vehiculoActual.value
  if (v) {
    if (v.cliente_razon_social) return v.cliente_razon_social

    const nombreCompleto = [v.cliente_nombres, v.cliente_apellido_paterno, v.cliente_apellido_materno]
      .filter(Boolean)
      .join(' ')
      .trim()

    return nombreCompleto || v.cliente_numero_documento || null
  }

  return props.defaultClienteLabel ?? null
})

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idCliente: yup.number().optional(),
      idTipoVehiculo: yup.number().required('El tipo de vehículo es obligatorio'),
      placa: requiredString('La placa'),
      placa2: optionalString(),
      marca: optionalString(),
      marca2: optionalString(),
      modelo: optionalString(),
      anio: yup.number().optional(),
      color: optionalString(),
      certificadoInscripcion: optionalString(),
      certificado2: optionalString(),
    }),
  ),
  initialValues: {
    idCliente: undefined as number | undefined,
    idTipoVehiculo: undefined as number | undefined,
    placa: '',
    placa2: '',
    marca: '',
    marca2: '',
    modelo: '',
    anio: undefined as number | undefined,
    color: '',
    certificadoInscripcion: '',
    certificado2: '',
  },
})

const [idCliente, idClienteAttrs] = defineField('idCliente')
const [idTipoVehiculo, idTipoVehiculoAttrs] = defineField('idTipoVehiculo')
const [placa, placaAttrs] = defineField('placa')
const [placa2, placa2Attrs] = defineField('placa2')
const [marca, marcaAttrs] = defineField('marca')
const [marca2, marca2Attrs] = defineField('marca2')
const [modelo, modeloAttrs] = defineField('modelo')
const [anio, anioAttrs] = defineField('anio')
const [color, colorAttrs] = defineField('color')
const [certificadoInscripcion, certificadoInscripcionAttrs] = defineField('certificadoInscripcion')
const [certificado2, certificado2Attrs] = defineField('certificado2')

const syncFormValues = () => {
  const v = vehiculoActual.value

  resetForm({
    values: {
      idCliente: v?.id_cliente ?? props.defaultClienteId ?? undefined,
      idTipoVehiculo: v?.id_tipo_vehiculo ?? undefined,
      placa: v?.placa ?? '',
      placa2: v?.placa2 ?? '',
      marca: v?.marca ?? '',
      marca2: v?.marca2 ?? '',
      modelo: v?.modelo ?? '',
      anio: v?.anio ?? undefined,
      color: v?.color ?? '',
      certificadoInscripcion: v?.certificado_inscripcion ?? '',
      certificado2: v?.certificado2 ?? '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  try {
    const payload = {
      idUsuarioAuditoria: currentUserId,
      idCliente: values.idCliente ? Number(values.idCliente) : undefined,
      idTipoVehiculo: Number(values.idTipoVehiculo),
      placa: values.placa,
      placa2: values.placa2 || undefined,
      marca: values.marca || undefined,
      marca2: values.marca2 || undefined,
      modelo: values.modelo || undefined,
      anio: values.anio ? Number(values.anio) : undefined,
      color: values.color || undefined,
      certificadoInscripcion: values.certificadoInscripcion || undefined,
      certificado2: values.certificado2 || undefined,
    }

    let guardado: Vehiculo | undefined
    if (props.mode === 'create') {
      guardado = await createMutation.mutateAsync(payload)
    } else if (props.vehiculo) {
      guardado = await updateMutation.mutateAsync({
        id: props.vehiculo.id,
        payload,
      })
    } else {
      return
    }

    emit('saved', guardado)
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
  () => vehiculoDetailQuery.data.value,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)

watch(
  () => props.vehiculo,
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
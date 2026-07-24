<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo chofer' : 'Editar chofer'"
    :subtitle="
      mode === 'create'
        ? 'Registra un chofer, asignado o no a un cliente.'
        : 'Actualiza los datos del chofer seleccionado.'
    "
    size="lg"
    @close="handleClose"
  >
    <form
      id="chofer-form"
      class="space-y-4"
      autocomplete="off"
      @submit="onSubmit"
    >
      <SearchableSelect
        v-model="idCliente"
        label="Cliente / Proveedor"
        placeholder="Busca por razón social, nombres o documento..."
        empty-option-label="Sin cliente asignado"
        :model-label="clienteLabelActual"
        v-bind="idClienteAttrs"
        :disabled="isSubmitting"
        :error="errors.idCliente"
        :search-fn="searchClientes"
      />

      <div class="grid gap-3 sm:grid-cols-3">
        <AppInput
          v-model="nombres"
          label="Nombres"
          placeholder="Carlos"
          required
          v-bind="nombresAttrs"
          :disabled="isSubmitting"
          :error="errors.nombres"
        />

        <AppInput
          v-model="apellidoPaterno"
          label="Apellido paterno"
          placeholder="Ramírez"
          v-bind="apellidoPaternoAttrs"
          :disabled="isSubmitting"
          :error="errors.apellidoPaterno"
        />

        <AppInput
          v-model="apellidoMaterno"
          label="Apellido materno"
          placeholder="Soto"
          v-bind="apellidoMaternoAttrs"
          :disabled="isSubmitting"
          :error="errors.apellidoMaterno"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <AppSelect
          v-model="idTipoDocumento"
          label="Tipo de documento"
          :placeholder="tipoDocumentoQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
          required
          v-bind="idTipoDocumentoAttrs"
          :disabled="isSubmitting || tipoDocumentoQuery.isLoading.value"
          :error="errors.idTipoDocumento"
          :options="tipoDocumentoOptions"
        />

        <AppInput
          v-model="numeroDocumento"
          label="Número de documento"
          placeholder="45678912"
          required
          v-bind="numeroDocumentoAttrs"
          :disabled="isSubmitting"
          :error="errors.numeroDocumento"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <AppInput
          v-model="codigoLicencia"
          label="N° de licencia (brevete)"
          placeholder="Q12345678"
          v-bind="codigoLicenciaAttrs"
          :disabled="isSubmitting"
          :error="errors.codigoLicencia"
        />

        <AppInput
          v-model="telefono"
          label="Teléfono"
          placeholder="987654321"
          v-bind="telefonoAttrs"
          :disabled="isSubmitting"
          :error="errors.telefono"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <AppSelect
          v-model="idTipoLicencia"
          label="Tipo de licencia"
          :placeholder="tipoLicenciaQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
          v-bind="idTipoLicenciaAttrs"
          :disabled="isSubmitting || tipoLicenciaQuery.isLoading.value"
          :error="errors.idTipoLicencia"
          :options="tipoLicenciaOptions"
        />

        <AppSelect
          v-model="idCategoriaLicencia"
          label="Categoría de licencia"
          :placeholder="categoriaLicenciaQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
          v-bind="idCategoriaLicenciaAttrs"
          :disabled="isSubmitting || categoriaLicenciaQuery.isLoading.value"
          :error="errors.idCategoriaLicencia"
          :options="categoriaLicenciaOptions"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <AppInput
          v-model="fechaEmision"
          type="date"
          label="Fecha de emisión"
          v-bind="fechaEmisionAttrs"
          :disabled="isSubmitting"
          :error="errors.fechaEmision"
        />

        <AppInput
          v-model="fechaVencimiento"
          type="date"
          label="Fecha de vencimiento"
          v-bind="fechaVencimientoAttrs"
          :disabled="isSubmitting"
          :error="errors.fechaVencimiento"
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
        form="chofer-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear chofer' : 'Guardar cambios' }}
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
  useCreateChoferMutation,
  useUpdateChoferMutation,
} from '@/modules/choferes/composables/useChoferMutations'
import { useChoferDetailQuery } from '@/modules/choferes/composables/useChoferDetailQuery'
import type {
  Chofer,
  ChoferFormMode,
} from '@/modules/choferes/interfaces/chofer.interface'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { getClienteNombrePrincipal } from '@/modules/clientes/utils/clienteNombre'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import { ListaIds } from '@/shared/constants/lista-ids'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalString, requiredString } from '@/shared/validation'

interface ChoferFormModalProps {
  mode: ChoferFormMode
  chofer?: Chofer | null
  defaultClienteId?: number | null
  defaultClienteLabel?: string | null
}

const props = defineProps<ChoferFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: [chofer?: Chofer]
}>()

const authStore = useAuthStore()

const createMutation = useCreateChoferMutation()
const updateMutation = useUpdateChoferMutation()
const idReferencia = computed(() => props.chofer?.id)
const choferDetailQuery = useChoferDetailQuery(idReferencia, open)
const choferActual = computed<Chofer | null>(
  () => choferDetailQuery.data.value ?? props.chofer ?? null,
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

const listaTipoDocumentoId = computed(() => ListaIds.TIPO_DOCUMENTO)
const tipoDocumentoQuery = useListaOpcionesQuery(listaTipoDocumentoId)
const tipoDocumentoOptions = computed(() => toSelectOptions(tipoDocumentoQuery.data.value))

const listaTipoLicenciaId = computed(() => ListaIds.TIPO_LICENCIA)
const tipoLicenciaQuery = useListaOpcionesQuery(listaTipoLicenciaId)
const tipoLicenciaOptions = computed(() => toSelectOptions(tipoLicenciaQuery.data.value))

const listaCategoriaLicenciaId = computed(() => ListaIds.CATEGORIA_LICENCIA)
const categoriaLicenciaQuery = useListaOpcionesQuery(listaCategoriaLicenciaId)
const categoriaLicenciaOptions = computed(() => toSelectOptions(categoriaLicenciaQuery.data.value))

// Label inicial del cliente ya asociado al chofer, tomado de los campos
// "cliente_*" que ya vienen en el registro (evita una petición extra).
const clienteLabelActual = computed(() => {
  const c = choferActual.value
  if (c) {
    if (c.cliente_razon_social) return c.cliente_razon_social

    const nombreCompleto = [c.cliente_nombres, c.cliente_apellido_paterno, c.cliente_apellido_materno]
      .filter(Boolean)
      .join(' ')
      .trim()

    return nombreCompleto || c.cliente_numero_documento || null
  }

  return props.defaultClienteLabel ?? null
})

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idCliente: yup.number().optional().nullable(),
      nombres: requiredString('Los nombres'),
      apellidoPaterno: optionalString(),
      apellidoMaterno: optionalString(),
      idTipoDocumento: yup.number().required('El tipo de documento es obligatorio'),
      numeroDocumento: requiredString('El número de documento'),
      telefono: optionalString(),
      codigoLicencia: optionalString(),
      idTipoLicencia: yup.number().optional(),
      idCategoriaLicencia: yup.number().optional(),
      fechaEmision: optionalString(),
      fechaVencimiento: optionalString(),
    }),
  ),
  initialValues: {
    idCliente: undefined as number | undefined,
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    idTipoDocumento: undefined as number | undefined,
    numeroDocumento: '',
    telefono: '',
    codigoLicencia: '',
    idTipoLicencia: undefined as number | undefined,
    idCategoriaLicencia: undefined as number | undefined,
    fechaEmision: '',
    fechaVencimiento: '',
  },
})

const [idCliente, idClienteAttrs] = defineField('idCliente')
const [nombres, nombresAttrs] = defineField('nombres')
const [apellidoPaterno, apellidoPaternoAttrs] = defineField('apellidoPaterno')
const [apellidoMaterno, apellidoMaternoAttrs] = defineField('apellidoMaterno')
const [idTipoDocumento, idTipoDocumentoAttrs] = defineField('idTipoDocumento')
const [numeroDocumento, numeroDocumentoAttrs] = defineField('numeroDocumento')
const [telefono, telefonoAttrs] = defineField('telefono')
const [codigoLicencia, codigoLicenciaAttrs] = defineField('codigoLicencia')
const [idTipoLicencia, idTipoLicenciaAttrs] = defineField('idTipoLicencia')
const [idCategoriaLicencia, idCategoriaLicenciaAttrs] = defineField('idCategoriaLicencia')
const [fechaEmision, fechaEmisionAttrs] = defineField('fechaEmision')
const [fechaVencimiento, fechaVencimientoAttrs] = defineField('fechaVencimiento')

const syncFormValues = () => {
  const c = choferActual.value

  resetForm({
    values: {
      idCliente: c?.id_cliente ?? props.defaultClienteId ?? undefined,
      nombres: c?.nombres ?? '',
      apellidoPaterno: c?.apellido_paterno ?? '',
      apellidoMaterno: c?.apellido_materno ?? '',
      idTipoDocumento: c?.id_tipo_documento ?? undefined,
      numeroDocumento: c?.numero_documento ?? '',
      telefono: c?.telefono ?? '',
      codigoLicencia: c?.codigo_licencia ?? '',
      idTipoLicencia: c?.id_tipo_licencia ?? undefined,
      idCategoriaLicencia: c?.id_categoria_licencia ?? undefined,
      fechaEmision: c?.fecha_emision ?? '',
      fechaVencimiento: c?.fecha_vencimiento ?? '',
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
      nombres: values.nombres,
      apellidoPaterno: values.apellidoPaterno || undefined,
      apellidoMaterno: values.apellidoMaterno || undefined,
      idTipoDocumento: Number(values.idTipoDocumento),
      numeroDocumento: values.numeroDocumento,
      telefono: values.telefono || undefined,
      codigoLicencia: values.codigoLicencia || undefined,
      idTipoLicencia: values.idTipoLicencia ? Number(values.idTipoLicencia) : undefined,
      idCategoriaLicencia: values.idCategoriaLicencia ? Number(values.idCategoriaLicencia) : undefined,
      fechaEmision: values.fechaEmision || undefined,
      fechaVencimiento: values.fechaVencimiento || undefined,
    }

    let guardado: Chofer | undefined
    if (props.mode === 'create') {
      guardado = await createMutation.mutateAsync(payload)
    } else if (props.chofer) {
      guardado = await updateMutation.mutateAsync({
        id: props.chofer.id,
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
  () => choferDetailQuery.data.value,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)

watch(
  () => props.chofer,
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
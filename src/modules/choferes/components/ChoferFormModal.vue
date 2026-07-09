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
      <AppSelect
        v-model="idCliente"
        label="Cliente / Proveedor"
        placeholder="Sin cliente asignado"
        v-bind="idClienteAttrs"
        :disabled="isSubmitting"
        :error="errors.idCliente"
        :options="clienteOptions"
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
          v-model="brevete"
          label="Brevete"
          placeholder="Q12345678"
          v-bind="breveteAttrs"
          :disabled="isSubmitting"
          :error="errors.brevete"
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
import type {
  Chofer,
  ChoferFormMode,
} from '@/modules/choferes/interfaces/chofer.interface'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalString, requiredString } from '@/shared/validation'

interface ChoferFormModalProps {
  mode: ChoferFormMode
  chofer?: Chofer | null
  clientes: Cliente[]
  defaultClienteId?: number | null
}

const props = defineProps<ChoferFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()

const createMutation = useCreateChoferMutation()
const updateMutation = useUpdateChoferMutation()

const listaTipoDocumentoId = computed(() => ListaIds.TIPO_DOCUMENTO)
const tipoDocumentoQuery = useListaOpcionesQuery(listaTipoDocumentoId)
const tipoDocumentoOptions = computed(() => toSelectOptions(tipoDocumentoQuery.data.value))

const getClienteNombre = (cliente: Cliente) => {
  const esJuridica = cliente.nombre_tipo_persona?.toLowerCase().includes('jurí')

  if (esJuridica && cliente.razon_social) {
    return cliente.razon_social
  }

  const nombreCompleto = [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || cliente.razon_social || cliente.numero_documento
}

const clienteOptions = computed(() => [
  { value: '', label: 'Sin cliente asignado' },
  ...props.clientes.map((cliente) => ({
    value: cliente.id,
    label: getClienteNombre(cliente),
  })),
])

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idCliente: yup.number().optional(),
      nombres: requiredString('Los nombres'),
      apellidoPaterno: optionalString(),
      apellidoMaterno: optionalString(),
      idTipoDocumento: yup.number().required('El tipo de documento es obligatorio'),
      numeroDocumento: requiredString('El número de documento'),
      brevete: optionalString(),
      telefono: optionalString(),
    }),
  ),
  initialValues: {
    idCliente: undefined as number | undefined,
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    idTipoDocumento: undefined as number | undefined,
    numeroDocumento: '',
    brevete: '',
    telefono: '',
  },
})

const [idCliente, idClienteAttrs] = defineField('idCliente')
const [nombres, nombresAttrs] = defineField('nombres')
const [apellidoPaterno, apellidoPaternoAttrs] = defineField('apellidoPaterno')
const [apellidoMaterno, apellidoMaternoAttrs] = defineField('apellidoMaterno')
const [idTipoDocumento, idTipoDocumentoAttrs] = defineField('idTipoDocumento')
const [numeroDocumento, numeroDocumentoAttrs] = defineField('numeroDocumento')
const [brevete, breveteAttrs] = defineField('brevete')
const [telefono, telefonoAttrs] = defineField('telefono')

const syncFormValues = () => {
  resetForm({
    values: {
      idCliente:
        props.chofer?.id_cliente ??
        props.defaultClienteId ??
        undefined,
      nombres: props.chofer?.nombres ?? '',
      apellidoPaterno: props.chofer?.apellido_paterno ?? '',
      apellidoMaterno: props.chofer?.apellido_materno ?? '',
      idTipoDocumento: props.chofer?.id_tipo_documento ?? undefined,
      numeroDocumento: props.chofer?.numero_documento ?? '',
      brevete: props.chofer?.brevete ?? '',
      telefono: props.chofer?.telefono ?? '',
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
      brevete: values.brevete || undefined,
      telefono: values.telefono || undefined,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.chofer) {
      await updateMutation.mutateAsync({
        id: props.chofer.id,
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

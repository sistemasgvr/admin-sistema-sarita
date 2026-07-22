<template>
  <AppModal
    v-model="open"
    title="Solicitar baja de cliente"
    :subtitle="cliente ? getNombrePrincipal(cliente) : 'Solicitud de baja'"
    size="lg"
    @close="handleClose"
  >
    <form id="cliente-baja-form" class="space-y-4" autocomplete="off" @submit="onSubmit">
      <div
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
      >
        La solicitud quedará pendiente hasta que un administrador (distinto a ti) la apruebe en
        <strong>Aprobar bajas</strong>. El cliente seguirá activo mientras tanto.
      </div>

      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-500 dark:text-gray-400">Tipo de solicitud:</span>
        <span class="font-medium text-gray-800 dark:text-white/90">{{ tipoSolicitudLabel }}</span>
      </div>

      <AppSelectSearch
        v-model="idMotivoBaja"
        label="Motivo de baja"
        placeholder="Selecciona motivo..."
        :options="motivoBajaOptions"
        :loading="motivoBajaQuery.isLoading.value"
        :disabled="isSubmitting"
        v-bind="idMotivoBajaAttrs"
        :error="errors.idMotivoBaja"
        required
      />

      <AppTextarea
        v-model="motivoDetalle"
        label="Detalle del motivo (opcional)"
        placeholder="Describe el motivo de la baja..."
        v-bind="motivoDetalleAttrs"
        :disabled="isSubmitting"
        :error="errors.motivoDetalle"
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
        form="cliente-baja-form"
        class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Procesando...' : 'Enviar solicitud' }}
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
import { useSolicitarBajaClienteMutation } from '@/modules/clientes/bajas-cliente/composables/useBajaClienteMutations'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppModal, AppTextarea } from '@/shared/components'
import AppSelectSearch from '@/shared/components/form/AppSelectSearch.vue'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalString } from '@/shared/validation'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'

const props = defineProps<{
  cliente?: Cliente | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const solicitarMutation = useSolicitarBajaClienteMutation()

const listaTipoSolicitudId = ref(ListaIds.TIPO_SOLICITUD)
const tipoSolicitudQuery = useListaOpcionesQuery(listaTipoSolicitudId)

const tipoSolicitudBaja = computed(() =>
  (tipoSolicitudQuery.data.value ?? []).find((o) => o.nombre === 'BAJA'),
)

const tipoSolicitudLabel = computed(() => tipoSolicitudBaja.value?.descripcion ?? 'Baja')

const listaMotivoBajaId = ref(ListaIds.MOTIVO_BAJA_CLIENTE)
const motivoBajaQuery = useListaOpcionesQuery(listaMotivoBajaId)

const motivoBajaOptions = computed(() =>
  (motivoBajaQuery.data.value ?? []).map((item) => ({
    label: item.nombre,
    value: item.id,
  })),
)

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idMotivoBaja: yup
        .mixed<string | number>()
        .test('required', 'Debes seleccionar un motivo de baja', (value) => value !== '' && value != null),
      motivoDetalle: optionalString().max(500, 'Máximo 500 caracteres'),
    }),
  ),
  initialValues: {
    idMotivoBaja: '' as string | number,
    motivoDetalle: '',
  },
})

const [idMotivoBaja, idMotivoBajaAttrs] = defineField('idMotivoBaja')
const [motivoDetalle, motivoDetalleAttrs] = defineField('motivoDetalle')

const resetFormState = () => {
  resetForm({
    values: {
      idMotivoBaja: '',
      motivoDetalle: '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const getNombrePrincipal = (cliente: Cliente) => {
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

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  const cliente = props.cliente
  if (!currentUserId || !cliente) return

  try {
    await solicitarMutation.mutateAsync({
      idCliente: cliente.id,
      idTipoSolicitud: tipoSolicitudBaja.value?.id,
      idMotivoBaja: Number(values.idMotivoBaja),
      motivoDetalle: values.motivoDetalle || undefined,
      idUsuarioAuditoria: currentUserId,
    })

    emit('saved')
    open.value = false
  } catch {
    // toast en mutation
  }
})

watch(open, (isOpen) => {
  if (isOpen) {
    resetFormState()
    tipoSolicitudQuery.refetch()
    motivoBajaQuery.refetch()
  }
})
</script>

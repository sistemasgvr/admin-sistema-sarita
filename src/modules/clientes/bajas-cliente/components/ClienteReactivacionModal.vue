<template>
  <AppModal
    v-model="open"
    title="Solicitar reactivación de cliente"
    :subtitle="cliente ? getNombrePrincipal(cliente) : 'Solicitud de reactivación'"
    size="lg"
    @close="handleClose"
  >
    <form id="cliente-reactivacion-form" class="space-y-4" autocomplete="off" @submit="onSubmit">
      <div
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
      >
        La solicitud quedará pendiente hasta que un administrador (distinto a ti) la apruebe.
        El cliente se mantendrá inactivo mientras tanto.
      </div>

      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-500 dark:text-gray-400">Tipo de solicitud:</span>
        <span class="font-medium text-gray-800 dark:text-white/90">{{ tipoSolicitudLabel }}</span>
      </div>

      <AppTextarea
        v-model="motivoDetalle"
        label="Motivo de la reactivación (opcional)"
        placeholder="Describe el motivo de la reactivación..."
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
        form="cliente-reactivacion-form"
        class="flex w-full justify-center rounded-lg bg-success-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-success-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
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
import { useSolicitarReactivacionClienteMutation } from '@/modules/clientes/bajas-cliente/composables/useBajaClienteMutations'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppModal } from '@/shared/components'
import AppTextarea from '@/shared/components/form/AppTextarea.vue'
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
const solicitarMutation = useSolicitarReactivacionClienteMutation()

const listaTipoSolicitudId = ref(ListaIds.TIPO_SOLICITUD)
const tipoSolicitudQuery = useListaOpcionesQuery(listaTipoSolicitudId)

const tipoSolicitudReactivacion = computed(() =>
  (tipoSolicitudQuery.data.value ?? []).find((o) => o.nombre === 'REACTIVACION'),
)

const tipoSolicitudLabel = computed(() => tipoSolicitudReactivacion.value?.descripcion ?? 'Reactivación')

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      motivoDetalle: optionalString().max(500, 'Máximo 500 caracteres'),
    }),
  ),
  initialValues: {
    motivoDetalle: '',
  },
})

const [motivoDetalle, motivoDetalleAttrs] = defineField('motivoDetalle')

const resetFormState = () => {
  resetForm({
    values: {
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
      idTipoSolicitud: tipoSolicitudReactivacion.value?.id,
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
  }
})
</script>

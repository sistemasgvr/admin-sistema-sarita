<template>
  <AppModal
    v-model="open"
    title="Solicitar baja de cilindro"
    :subtitle="balon?.codigo_balon ?? 'Solicitud de baja definitiva'"
    size="lg"
    @close="handleClose"
  >
    <form id="balon-baja-form" class="space-y-4" autocomplete="off" @submit="onSubmit">
      <div
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
      >
        La solicitud quedará pendiente hasta que un administrador (distinto a ti) la apruebe en
        <strong>Aprobar bajas</strong>. El cilindro seguirá activo mientras tanto.
      </div>

      <AppSelect
        v-model="idMotivoBaja"
        label="Motivo de baja"
        placeholder="Selecciona motivo..."
        :options="motivoBajaOptions"
        :disabled="isSubmitting || motivoBajaQuery.isLoading.value"
        v-bind="idMotivoBajaAttrs"
        :error="errors.idMotivoBaja"
        required
      />

      <AppTextarea
        v-if="requiereMotivoDetalle"
        v-model="motivoDetalle"
        label="Detalle del motivo"
        placeholder="Describe el motivo de la baja..."
        v-bind="motivoDetalleAttrs"
        :disabled="isSubmitting"
        :error="errors.motivoDetalle"
      />

      <template v-if="esVenta">
        <div class="grid gap-4 sm:grid-cols-2">
          <AppSelect
            v-model="idClienteComprador"
            label="Cliente comprador"
            placeholder="Selecciona cliente..."
            :options="clienteOptions"
            :disabled="isSubmitting || clientesQuery.isLoading.value"
            v-bind="idClienteCompradorAttrs"
            :error="errors.idClienteComprador"
          />
          <AppInput
            v-model="montoVenta"
            label="Monto venta"
            type="number"
            min="0"
            step="0.01"
            v-bind="montoVentaAttrs"
            :disabled="isSubmitting"
            :error="errors.montoVenta"
          />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="serieComprobante"
            label="Serie comprobante"
            v-bind="serieComprobanteAttrs"
            :disabled="isSubmitting"
            :error="errors.serieComprobante"
          />
          <AppInput
            v-model="numeroComprobante"
            label="Número comprobante"
            v-bind="numeroComprobanteAttrs"
            :disabled="isSubmitting"
            :error="errors.numeroComprobante"
          />
        </div>
      </template>

      <AppInput
        v-model="fechaBaja"
        label="Fecha de baja"
        type="date"
        v-bind="fechaBajaAttrs"
        :disabled="isSubmitting"
        :error="errors.fechaBaja"
      />

      <AppTextarea
        v-model="observacion"
        label="Observación"
        placeholder="Notas adicionales..."
        v-bind="observacionAttrs"
        :disabled="isSubmitting"
        :error="errors.observacion"
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
        form="balon-baja-form"
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
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useDarBajaBalonMutation } from '@/modules/balones/cilindros/composables/useBalonMutations'
import { useBalonQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppTextarea } from '@/shared/components'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalNumber, optionalString, requiredSelect } from '@/shared/validation'

const props = defineProps<{
  balonId?: number | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const darBajaMutation = useDarBajaBalonMutation()

const balonIdRef = computed(() => props.balonId)
const balonQuery = useBalonQuery(balonIdRef)
const balon = computed(() => balonQuery.data.value ?? null)

const listaMotivoBajaId = ref(ListaIds.MOTIVO_BAJA_BALON)
const motivoBajaQuery = useListaOpcionesQuery(listaMotivoBajaId)

const clientesFilters = ref({ pagina: 1, limite: 200, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const motivoBajaOptions = computed(() => toSelectOptions(motivoBajaQuery.data.value))

const clienteOptions = computed(() =>
  (clientesQuery.data.value?.data ?? []).map((cliente) => ({
    label:
      cliente.razon_social ||
      [cliente.nombres, cliente.apellido_paterno].filter(Boolean).join(' ') ||
      cliente.numero_documento,
    value: cliente.id,
  })),
)

const motivoSeleccionado = computed(() =>
  motivoBajaQuery.data.value?.find((opcion) => opcion.id === Number(idMotivoBaja.value)),
)

const esVenta = computed(() => motivoSeleccionado.value?.nombre?.toUpperCase() === 'VENDIDO')
const requiereMotivoDetalle = computed(
  () => motivoSeleccionado.value?.nombre?.toUpperCase() === 'OTROS',
)

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idMotivoBaja: requiredSelect('El motivo de baja'),
      motivoDetalle: optionalString().max(500, 'Máximo 500 caracteres'),
      idClienteComprador: optionalNumber(),
      montoVenta: optionalNumber(),
      serieComprobante: optionalString().max(10, 'Máximo 10 caracteres'),
      numeroComprobante: optionalString().max(15, 'Máximo 15 caracteres'),
      fechaBaja: optionalString(),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
    }),
  ),
  initialValues: {
    idMotivoBaja: undefined as number | undefined,
    motivoDetalle: '',
    idClienteComprador: undefined as number | undefined,
    montoVenta: undefined as number | undefined,
    serieComprobante: '',
    numeroComprobante: '',
    fechaBaja: new Date().toISOString().slice(0, 10),
    observacion: '',
  },
})

const [idMotivoBaja, idMotivoBajaAttrs] = defineField('idMotivoBaja')
const [motivoDetalle, motivoDetalleAttrs] = defineField('motivoDetalle')
const [idClienteComprador, idClienteCompradorAttrs] = defineField('idClienteComprador')
const [montoVenta, montoVentaAttrs] = defineField('montoVenta')
const [serieComprobante, serieComprobanteAttrs] = defineField('serieComprobante')
const [numeroComprobante, numeroComprobanteAttrs] = defineField('numeroComprobante')
const [fechaBaja, fechaBajaAttrs] = defineField('fechaBaja')
const [observacion, observacionAttrs] = defineField('observacion')

watch(idMotivoBaja, () => {
  if (!esVenta.value) {
    idClienteComprador.value = undefined
    montoVenta.value = undefined
    serieComprobante.value = ''
    numeroComprobante.value = ''
  }
  if (!requiereMotivoDetalle.value) {
    motivoDetalle.value = ''
  }
})

const resetFormState = () => {
  resetForm({
    values: {
      idMotivoBaja: undefined,
      motivoDetalle: '',
      idClienteComprador: undefined,
      montoVenta: undefined,
      serieComprobante: '',
      numeroComprobante: '',
      fechaBaja: new Date().toISOString().slice(0, 10),
      observacion: '',
    },
  })
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  const balonId = props.balonId
  if (!currentUserId || !balonId) return

  try {
    await darBajaMutation.mutateAsync({
      id: balonId,
      payload: {
        idUsuarioAuditoria: currentUserId,
        idMotivoBaja: Number(values.idMotivoBaja),
        idUsuarioSolicita: currentUserId,
        motivoDetalle: values.motivoDetalle || undefined,
        idClienteComprador: values.idClienteComprador,
        serieComprobante: values.serieComprobante || undefined,
        numeroComprobante: values.numeroComprobante || undefined,
        montoVenta: values.montoVenta,
        observacion: values.observacion || undefined,
        fechaBaja: values.fechaBaja || undefined,
      },
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
  }
})
</script>

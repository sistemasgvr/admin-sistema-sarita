<template>
  <AppModal v-model="open" :title="titulo" size="md">
    <div class="space-y-4">
      <p v-if="!esEdicion" class="text-theme-sm text-gray-500 dark:text-gray-400">
        Registro manual. Las garantías de préstamos, alquileres y POS se crean automáticamente desde
        esos módulos.
      </p>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppFormField label="Fecha" required :error="errores.fecha">
          <AppInput
            v-model="form.fecha"
            type="date"
            :state="errores.fecha ? 'error' : 'default'"
          />
        </AppFormField>

        <AppFormField label="Importe" required :error="errorImporteDisplay">
          <MoneyInput
            v-model="form.importe"
            placeholder="0.00"
            :state="errorImporteDisplay ? 'error' : 'default'"
            @blur="onBlurImporte"
          />
        </AppFormField>
      </div>

      <AppSelectSearch
        v-model="form.idCliente"
        :options="clienteOptions"
        v-model:search="clienteSearch"
        label="Cliente"
        placeholder="Selecciona un cliente"
        search-placeholder="Buscar por nombre o documento..."
        remote
        :loading="clientesQuery.isFetching.value"
        required
        :error="errores.idCliente"
      />

      <MedioPagoCuentaField
        v-model:id-medio-pago="form.idMedioPago"
        v-model:id-cuenta-bancaria="form.idCuentaBancaria"
        v-model:numero-operacion="form.numeroOperacion"
        v-model:valido="pagoValido"
        label-medio="Método de pago"
        :disabled="guardando"
        :mostrar-errores="intentoEnvio"
        excluir-credito
      />

      <AppFormField label="Observaciones" optional :error="errores.observacion">
        <AppTextarea
          v-model="form.observacion"
          :rows="3"
          placeholder="Ej.: depósito por balón industrial, compromiso de devolución..."
        />
      </AppFormField>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="guardando"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="guardando || !formularioValido"
        @click="submit"
      >
        {{ guardando ? 'Guardando...' : cta }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRef, watch } from 'vue'
import { AppInput, AppModal, AppTextarea, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppSelectSearch from '@/shared/components/form/AppSelectSearch.vue'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import MedioPagoCuentaField from '@/modules/finanzas/components/MedioPagoCuentaField.vue'
import {
  useActualizarGarantiaMutation,
  useCrearGarantiaMutation,
} from '@/modules/finanzas/composables/useGarantiaMutations'
import type { Garantia } from '@/modules/finanzas/interfaces/garantia.interface'
import type { ClienteListFilters } from '@/modules/clientes/interfaces/cliente.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { mensajeErrorMontoMoneda, parseMoneyInput, roundMoney } from '@/shared/utils/currency'

const props = defineProps<{ garantia?: Garantia | null }>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const crearMutation = useCrearGarantiaMutation()
const editarMutation = useActualizarGarantiaMutation()

const esEdicion = computed(() => !!props.garantia)
const titulo = computed(() => (esEdicion.value ? 'Editar garantía manual' : 'Nueva garantía'))
const cta = computed(() => (esEdicion.value ? 'Guardar cambios' : 'Registrar garantía'))
const guardando = computed(
  () => crearMutation.isPending.value || editarMutation.isPending.value,
)

const clienteSearch = ref('')
const clientesFilters = ref<ClienteListFilters>({
  buscar: '',
  pagina: 1,
  limite: 50,
  soloActivos: 1,
})

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(clienteSearch, (v) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    clientesFilters.value = { ...clientesFilters.value, buscar: v.trim(), pagina: 1 }
  }, 300)
})

const clientesQuery = useClientesQuery(clientesFilters)

const clienteOptions = computed<SelectOption[]>(() =>
  (clientesQuery.data.value?.data ?? []).map((c) => {
    const nombre =
      c.razon_social?.trim() ||
      [c.nombres, c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' ') ||
      `Cliente #${c.id}`
    const doc = c.numero_documento ? ` · ${c.numero_documento}` : ''
    return { label: `${nombre}${doc}`, value: c.id }
  }),
)

const pagoValido = ref(true)
const intentoEnvio = ref(false)

const hoy = () => new Date().toISOString().slice(0, 10)

const form = reactive({
  fecha: hoy(),
  idCliente: null as number | null,
  idMedioPago: null as number | null,
  idCuentaBancaria: null as number | null,
  numeroOperacion: '',
  importe: '',
  observacion: '',
})

const errores = reactive<Record<string, string | undefined>>({})

const moneyOpts = { min: 0.01 } as const
const { error: errorImporte, valido: importeValido, onBlur: onBlurImporte } = useMoneyField(
  toRef(form, 'importe'),
  moneyOpts,
)
const errorImporteDisplay = computed(() => errores.importe || errorImporte.value)
const formularioValido = computed(
  () =>
    importeValido.value && pagoValido.value && Boolean(form.fecha) && Boolean(form.idCliente),
)

const cargarDesdeProps = () => {
  Object.keys(errores).forEach((k) => (errores[k] = undefined))
  if (props.garantia) {
    form.fecha = props.garantia.fecha_registro
    form.idCliente = props.garantia.id_cliente
    form.idMedioPago = props.garantia.id_medio_pago ?? null
    form.idCuentaBancaria = props.garantia.id_cuenta_bancaria ?? null
    form.importe = Number(props.garantia.monto_cobrado).toFixed(2)
    form.observacion = props.garantia.observacion ?? ''
  } else {
    form.fecha = hoy()
    form.idCliente = null
    form.idMedioPago = null
    form.idCuentaBancaria = null
    form.importe = ''
    form.observacion = ''
  }
  clienteSearch.value = ''
}

watch(open, (isOpen) => {
  if (isOpen) cargarDesdeProps()
})

watch(() => form.idCliente, (v) => { if (v) errores.idCliente = undefined })
watch(() => form.fecha, (v) => { if (v) errores.fecha = undefined })
watch(() => form.observacion, (v) => {
  if (v.length <= 500) errores.observacion = undefined
})

const validar = (): boolean => {
  Object.keys(errores).forEach((k) => (errores[k] = undefined))
  let ok = true
  if (!form.fecha) { errores.fecha = 'La fecha es obligatoria'; ok = false }
  if (!form.idCliente) { errores.idCliente = 'Selecciona un cliente'; ok = false }
  const msgImporte = mensajeErrorMontoMoneda(form.importe, moneyOpts)
  if (msgImporte) { errores.importe = msgImporte; ok = false }
  if (form.observacion.length > 500) { errores.observacion = 'Máximo 500 caracteres'; ok = false }
  return ok
}

const submit = async () => {
  intentoEnvio.value = true
  if (mensajeErrorMontoMoneda(form.importe, moneyOpts)) return
  if (!validar() || !pagoValido.value) return

  const importe = roundMoney(parseMoneyInput(form.importe))
  const payload = {
    fecha: form.fecha,
    idCliente: form.idCliente as number,
    idMedioPago: form.idMedioPago ?? undefined,
    idCuentaBancaria: form.idCuentaBancaria ?? undefined,
    numeroOperacion: form.numeroOperacion.trim() || undefined,
    importe,
    observacion: form.observacion.trim() || undefined,
    idUsuarioAuditoria: authStore.user?.id ?? undefined,
  }

  try {
    if (esEdicion.value && props.garantia) {
      await editarMutation.mutateAsync({ id: props.garantia.id, payload })
    } else {
      await crearMutation.mutateAsync(payload)
    }
    open.value = false
    emit('saved')
  } catch {
    /* toast en mutación */
  }
}
</script>

<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva cuenta bancaria' : 'Editar cuenta bancaria'"
    :subtitle="
      soloEmpresa
        ? mode === 'create'
          ? 'Registra una cuenta bancaria de la empresa.'
          : 'Actualiza la cuenta bancaria de la empresa.'
        : mode === 'create'
          ? 'Registra una cuenta bancaria del cliente / proveedor.'
          : 'Actualiza los datos de la cuenta bancaria seleccionada.'
    "
    size="xl"
    @close="handleClose"
  >
    <form id="cuenta-bancaria-form" class="space-y-5" autocomplete="off" @submit="onSubmit">
      <section
        v-if="!soloEmpresa"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Cliente</h5>
        <SearchableSelect
          v-model="idCliente"
          placeholder="Busca por razón social, nombres o documento..."
          required
          :clearable="false"
          v-bind="idClienteAttrs"
          :model-label="clienteLabel"
          :disabled="isSubmitting || Boolean(defaultClienteId)"
          :error="errors.idCliente"
          :search-fn="searchClientes"
        />
      </section>

      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          Datos de la cuenta
        </h5>
        <div class="grid gap-3 sm:grid-cols-2">
          <AppInput
            v-model="titular"
            label="Titular"
            placeholder="Nombre del titular"
            required
            v-bind="titularAttrs"
            :disabled="isSubmitting"
            :error="errors.titular"
          />

          <AppInput
            v-if="soloEmpresa"
            v-model="alias"
            label="Alias"
            placeholder="BCP Principal, Yape caja..."
            hint="Nombre corto con el que aparecera al elegir la cuenta en un cobro."
            v-bind="aliasAttrs"
            :disabled="isSubmitting"
            :error="errors.alias"
          />

          <AppSelect
            v-model="idBanco"
            label="Banco"
            placeholder="Selecciona..."
            required
            v-bind="idBancoAttrs"
            :options="bancoOptions"
            :disabled="isSubmitting || bancoQuery.isLoading.value"
            :error="errors.idBanco"
          />

          <AppSelect
            v-model="idTipoCuenta"
            label="Tipo de cuenta"
            placeholder="Selecciona..."
            required
            v-bind="idTipoCuentaAttrs"
            :options="tipoCuentaOptions"
            :disabled="isSubmitting || tipoCuentaQuery.isLoading.value"
            :error="errors.idTipoCuenta"
          />

          <AppInput
            v-model="numeroCuenta"
            label="Número de cuenta"
            placeholder="1234567890"
            required
            v-bind="numeroCuentaAttrs"
            :disabled="isSubmitting"
            :error="errors.numeroCuenta"
          />

          <AppInput
            v-model="numeroCuentaInterbancaria"
            label="CCI (interbancario)"
            placeholder="00012345678901234567"
            v-bind="numeroCuentaInterbancariaAttrs"
            :disabled="isSubmitting"
            :error="errors.numeroCuentaInterbancaria"
          />

          <AppInput
            v-model="telefonoBilletera"
            label="Teléfono (Yape / Plin)"
            placeholder="999 999 999"
            v-bind="telefonoBilleteraAttrs"
            :disabled="isSubmitting"
            :error="errors.telefonoBilletera"
          />
        </div>
      </section>

      <section
        v-if="soloEmpresa"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">
          Medios de pago que recibe
        </h5>
        <p class="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">
          Al cobrar con uno de estos medios, esta cuenta aparecera entre las opciones. Marca
          <span class="font-medium">predeterminada</span> para que se proponga sola.
        </p>
        <div class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="medio in mediosAsociables"
            :key="medio.id"
            class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800"
          >
            <AppCheckbox
              :model-value="estaAsociado(medio.id)"
              :disabled="isSubmitting"
              :label="medio.nombre"
              @update:model-value="(v: boolean) => toggleMedio(medio.id, v)"
            />
            <button
              v-if="estaAsociado(medio.id)"
              type="button"
              class="shrink-0 rounded-full px-2 py-0.5 text-theme-xs font-medium transition"
              :class="
                esPredeterminada(medio.id)
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              "
              :disabled="isSubmitting"
              @click="togglePredeterminada(medio.id)"
            >
              {{ esPredeterminada(medio.id) ? 'Predeterminada' : 'Marcar predeterminada' }}
            </button>
          </div>
          <p
            v-if="!mediosAsociables.length"
            class="text-theme-xs text-gray-500 dark:text-gray-400 sm:col-span-2"
          >
            No hay medios de pago que admitan cuenta bancaria.
          </p>
        </div>
      </section>

      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <AppCheckbox
          v-model="esPrincipal"
          :disabled="isSubmitting"
          label="Establecer como cuenta principal"
        />
      </section>
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
        form="cuenta-bancaria-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear cuenta' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  useCreateCuentaBancariaMutation,
  useUpdateCuentaBancariaMutation,
} from '@/modules/cuentas-bancarias/composables/useCuentaBancariaMutations'
import { useCuentaBancariaDetailQuery } from '@/modules/cuentas-bancarias/composables/useCuentaBancariaDetailQuery'
import type {
  CuentaBancaria,
  CuentaBancariaFormMode,
} from '@/modules/cuentas-bancarias/interfaces/cuenta-bancaria.interface'
import { useQuery } from '@tanstack/vue-query'
import { catalogosQueryKeys } from '@/modules/catalogos/constants/catalogosQueryKeys'
import { catalogosService } from '@/modules/catalogos/services/catalogos.service'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppCheckbox, AppInput, AppModal, AppSelect } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalString, requiredSelect, requiredString } from '@/shared/validation'
import { useMediosPagoQuery } from '@/modules/finanzas/composables/useMediosPagoQuery'

interface CuentaBancariaFormModalProps {
  mode: CuentaBancariaFormMode
  cuenta?: CuentaBancaria | null
  defaultClienteId?: number | null
  /** Configuración empresa: cuenta propia (id_cliente NULL). */
  soloEmpresa?: boolean
}

const props = withDefaults(defineProps<CuentaBancariaFormModalProps>(), {
  soloEmpresa: false,
})

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()

const createMutation = useCreateCuentaBancariaMutation()
const updateMutation = useUpdateCuentaBancariaMutation()

const idReferencia = computed(() => props.cuenta?.id)
const detailQuery = useCuentaBancariaDetailQuery(idReferencia, open)
const cuentaActual = computed<CuentaBancaria | null>(
  () => detailQuery.data.value ?? props.cuenta ?? null,
)

const catalogsEnabled = ref(false)

// Solo tienen sentido los medios que exigen cuenta: el efectivo y el credito no
// pasan por banco, y el backend rechaza asociarlos.
const mediosQuery = useMediosPagoQuery()
const mediosAsociables = computed(() =>
  (mediosQuery.data.value ?? []).filter((m) => m.configurado && m.requiereCuentaBancaria),
)

/** idMedioPago -> esPredeterminada */
const mediosSeleccionados = ref(new Map<number, boolean>())

const estaAsociado = (idMedioPago: number) => mediosSeleccionados.value.has(idMedioPago)
const esPredeterminada = (idMedioPago: number) =>
  mediosSeleccionados.value.get(idMedioPago) === true

const toggleMedio = (idMedioPago: number, activo: boolean) => {
  const next = new Map(mediosSeleccionados.value)
  if (activo) next.set(idMedioPago, false)
  else next.delete(idMedioPago)
  mediosSeleccionados.value = next
}

const togglePredeterminada = (idMedioPago: number) => {
  const next = new Map(mediosSeleccionados.value)
  next.set(idMedioPago, !next.get(idMedioPago))
  mediosSeleccionados.value = next
}

const bancoQuery = useQuery({
  queryKey: catalogosQueryKeys.listaOpciones(ListaIds.BANCO),
  queryFn: () => catalogosService.listarListaOpciones(ListaIds.BANCO),
  enabled: catalogsEnabled,
  staleTime: 5 * 60 * 1000,
})

const tipoCuentaQuery = useQuery({
  queryKey: catalogosQueryKeys.listaOpciones(ListaIds.TIPO_CUENTA),
  queryFn: () => catalogosService.listarListaOpciones(ListaIds.TIPO_CUENTA),
  enabled: catalogsEnabled,
  staleTime: 5 * 60 * 1000,
})

const bancoOptions = computed(() => toSelectOptions(bancoQuery.data.value))
const tipoCuentaOptions = computed(() => toSelectOptions(tipoCuentaQuery.data.value))

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

const clienteLabel = computed(() => {
  const d = cuentaActual.value
  if (!d) return null
  if (d.cliente_razon_social) return d.cliente_razon_social
  const nombreCompleto = [d.cliente_nombres, d.cliente_apellido_paterno, d.cliente_apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()
  return nombreCompleto || d.cliente_numero_documento || null
})

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      titular: requiredString('El titular'),
      idBanco: requiredSelect('El banco'),
      idTipoCuenta: requiredSelect('El tipo de cuenta'),
      numeroCuenta: requiredString('El número de cuenta'),
      numeroCuentaInterbancaria: optionalString(),
      telefonoBilletera: optionalString(),
      alias: optionalString(),
      idCliente: yup
        .number()
        .nullable()
        .optional()
        .test('cliente-requerido', 'El cliente es obligatorio', (value) => {
          if (props.soloEmpresa) return true
          return value != null && Number(value) > 0
        }),
      esPrincipal: yup.boolean().default(false),
    }),
  ),
  initialValues: {
    titular: '',
    idBanco: undefined as number | undefined,
    idTipoCuenta: undefined as number | undefined,
    numeroCuenta: '',
    numeroCuentaInterbancaria: '',
    telefonoBilletera: '',
    alias: '',
    idCliente: undefined as number | undefined,
    esPrincipal: false,
  },
})

const [titular, titularAttrs] = defineField('titular')
const [idBanco, idBancoAttrs] = defineField('idBanco')
const [idTipoCuenta, idTipoCuentaAttrs] = defineField('idTipoCuenta')
const [numeroCuenta, numeroCuentaAttrs] = defineField('numeroCuenta')
const [numeroCuentaInterbancaria, numeroCuentaInterbancariaAttrs] = defineField('numeroCuentaInterbancaria')
const [telefonoBilletera, telefonoBilleteraAttrs] = defineField('telefonoBilletera')
const [alias, aliasAttrs] = defineField('alias')
const [idCliente, idClienteAttrs] = defineField('idCliente')
const [esPrincipal] = defineField('esPrincipal')

const syncFormValues = () => {
  const d = cuentaActual.value

  resetForm({
    values: {
      titular: d?.titular ?? '',
      idBanco: d?.id_banco ?? undefined,
      idTipoCuenta: d?.id_tipo_cuenta ?? undefined,
      numeroCuenta: d?.numero_cuenta ?? '',
      numeroCuentaInterbancaria: d?.numero_cuenta_interbancaria ?? '',
      telefonoBilletera: d?.telefono_billetera ?? '',
      alias: d?.alias ?? '',
      idCliente: d?.id_cliente ?? props.defaultClienteId ?? undefined,
      esPrincipal: d?.es_principal ?? false,
    },
  })

  mediosSeleccionados.value = new Map(
    (d?.medios_pago ?? []).map((m) => [m.idMedioPago, m.esPredeterminada]),
  )
}

const handleClose = () => {
  open.value = false
}

const mediosPagoPayload = () =>
  Array.from(mediosSeleccionados.value.entries()).map(([idMedioPago, esPredeterminada]) => ({
    idMedioPago,
    esPredeterminada,
  }))

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  try {
    if (props.mode === 'create') {
      await createMutation.mutateAsync({
        idUsuarioAuditoria: currentUserId,
        titular: values.titular,
        idBanco: Number(values.idBanco),
        idTipoCuenta: Number(values.idTipoCuenta),
        numeroCuenta: values.numeroCuenta,
        numeroCuentaInterbancaria: values.numeroCuentaInterbancaria || undefined,
        telefonoBilletera: values.telefonoBilletera || undefined,
        ambito: props.soloEmpresa ? ('EMPRESA' as const) : ('CLIENTE' as const),
        alias: props.soloEmpresa ? values.alias || null : undefined,
        mediosPago: props.soloEmpresa ? mediosPagoPayload() : undefined,
        idCliente: props.soloEmpresa
          ? undefined
          : values.idCliente
            ? Number(values.idCliente)
            : undefined,
        esPrincipal: values.esPrincipal ?? false,
      })
    } else if (props.cuenta) {
      await updateMutation.mutateAsync({
        id: props.cuenta.id,
        payload: {
          idUsuarioAuditoria: currentUserId,
          titular: values.titular,
          idBanco: Number(values.idBanco),
          idTipoCuenta: Number(values.idTipoCuenta),
          numeroCuenta: values.numeroCuenta,
          numeroCuentaInterbancaria: values.numeroCuentaInterbancaria || undefined,
          telefonoBilletera: values.telefonoBilletera || undefined,
          alias: props.soloEmpresa ? values.alias || null : undefined,
          mediosPago: props.soloEmpresa ? mediosPagoPayload() : undefined,
          idCliente: props.soloEmpresa
            ? undefined
            : values.idCliente
              ? Number(values.idCliente)
              : undefined,
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
    catalogsEnabled.value = isOpen
    if (isOpen) {
      syncFormValues()
    }
  },
)

watch(
  () => cuentaActual.value,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)
</script>

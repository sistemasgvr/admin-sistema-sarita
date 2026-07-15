<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva cuenta bancaria' : 'Editar cuenta bancaria'"
    :subtitle="
      mode === 'create'
        ? 'Registra una nueva cuenta bancaria (cliente o empresa).'
        : 'Actualiza los datos de la cuenta bancaria seleccionada.'
    "
    size="xl"
    @close="handleClose"
  >
    <form id="cuenta-bancaria-form" class="space-y-5" autocomplete="off" @submit="onSubmit">
      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Cliente</h5>
        <SearchableSelect
          v-model="idCliente"
          placeholder="Busca por razón social, nombres o documento..."
          :clearable="true"
          :model-label="clienteLabel"
          :disabled="isSubmitting"
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

          <AppSelect
            v-model="idBanco"
            label="Banco"
            placeholder="Selecciona..."
            :options="bancoOptions"
            :disabled="isSubmitting || bancoQuery.isLoading.value"
            :error="errors.idBanco"
          />

          <AppSelect
            v-model="idTipoCuenta"
            label="Tipo de cuenta"
            placeholder="Selecciona..."
            :options="tipoCuentaOptions"
            :disabled="isSubmitting || tipoCuentaQuery.isLoading.value"
            :error="errors.idTipoCuenta"
          />

          <AppInput
            v-model="numeroCuenta"
            label="Número de cuenta"
            placeholder="1234567890"
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
import { computed, ref, watch, type Ref } from 'vue'
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
import { optionalString, requiredString } from '@/shared/validation'

interface CuentaBancariaFormModalProps {
  mode: CuentaBancariaFormMode
  cuenta?: CuentaBancaria | null
}

const props = defineProps<CuentaBancariaFormModalProps>()

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
      idBanco: yup.number().optional(),
      idTipoCuenta: yup.number().optional(),
      numeroCuenta: optionalString(),
      numeroCuentaInterbancaria: optionalString(),
      telefonoBilletera: optionalString(),
      idCliente: yup.number().optional(),
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
    idCliente: undefined as number | undefined,
    esPrincipal: false,
  },
})

const [titular, titularAttrs] = defineField('titular')
const [idBanco] = defineField('idBanco')
const [idTipoCuenta] = defineField('idTipoCuenta')
const [numeroCuenta, numeroCuentaAttrs] = defineField('numeroCuenta')
const [numeroCuentaInterbancaria, numeroCuentaInterbancariaAttrs] = defineField('numeroCuentaInterbancaria')
const [telefonoBilletera, telefonoBilleteraAttrs] = defineField('telefonoBilletera')
const [idCliente] = defineField('idCliente')
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
      idCliente: d?.id_cliente ?? undefined,
      esPrincipal: d?.es_principal ?? false,
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
    if (props.mode === 'create') {
      await createMutation.mutateAsync({
        idUsuarioAuditoria: currentUserId,
        titular: values.titular,
        idBanco: values.idBanco || undefined,
        idTipoCuenta: values.idTipoCuenta || undefined,
        numeroCuenta: values.numeroCuenta || undefined,
        numeroCuentaInterbancaria: values.numeroCuentaInterbancaria || undefined,
        telefonoBilletera: values.telefonoBilletera || undefined,
        idCliente: values.idCliente || undefined,
        esPrincipal: values.esPrincipal ?? false,
      })
    } else if (props.cuenta) {
      await updateMutation.mutateAsync({
        id: props.cuenta.id,
        payload: {
          idUsuarioAuditoria: currentUserId,
          titular: values.titular,
          idBanco: values.idBanco || undefined,
          idTipoCuenta: values.idTipoCuenta || undefined,
          numeroCuenta: values.numeroCuenta || undefined,
          numeroCuentaInterbancaria: values.numeroCuentaInterbancaria || undefined,
          telefonoBilletera: values.telefonoBilletera || undefined,
          idCliente: values.idCliente || undefined,
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

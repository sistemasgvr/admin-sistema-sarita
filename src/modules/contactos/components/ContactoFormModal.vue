<template>
  <AppModal v-model="open" :title="mode === 'create' ? 'Nuevo contacto' : 'Editar contacto'" :subtitle="mode === 'create'
      ? 'Registra un contacto para un cliente o proveedor.'
      : 'Actualiza los datos del contacto seleccionado.'
    " size="lg" @close="handleClose">
    <form id="contacto-form" class="space-y-4" autocomplete="off" @submit="onSubmit">
      <SearchableSelect v-model="idCliente" label="Cliente / Proveedor"
        placeholder="Busca por razón social, nombres o documento..." required :clearable="false"
        :model-label="clienteLabelActual" v-bind="idClienteAttrs" :disabled="isSubmitting || isClienteLocked"
        :error="errors.idCliente" :search-fn="searchClientes" />

      <div class="grid gap-3 sm:grid-cols-3">
        <AppSelect v-model="tipoDocumentoBusqueda" label="Tipo de documento" :options="tipoDocumentoBusquedaOptions"
          :disabled="isSubmitting" />
        <div class="sm:col-span-2">
          <ConsultaDocumentoInput v-model="numeroDocumentoBusqueda" :tipo-documento="tipoDocumentoBusqueda"
            label="Número de documento" :disabled="isSubmitting" @dni-encontrado="aplicarDatosDni"
            @ruc-encontrado="aplicarDatosRuc" />
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <AppInput v-model="nombre" label="Nombre" placeholder="Jorge" required v-bind="nombreAttrs"
          :disabled="isSubmitting" :error="errors.nombre" />

        <AppInput v-model="apellidoPaterno" label="Apellido paterno" placeholder="Alva" v-bind="apellidoPaternoAttrs"
          :disabled="isSubmitting" :error="errors.apellidoPaterno" />

        <AppInput v-model="apellidoMaterno" label="Apellido materno" placeholder="Ruiz" v-bind="apellidoMaternoAttrs"
          :disabled="isSubmitting" :error="errors.apellidoMaterno" />
      </div>

      <AppInput v-model="direccion" label="Dirección" placeholder="Calle Las Flores 456, Chiclayo"
        v-bind="direccionAttrs" :disabled="isSubmitting" :error="errors.direccion" />

      <div class="grid gap-3 sm:grid-cols-2">
        <AppInput v-model="email" type="email" label="Correo" placeholder="correo@ejemplo.com" v-bind="emailAttrs"
          :disabled="isSubmitting" :error="errors.email" />

        <AppInput v-model="telefono1" label="Teléfono principal" placeholder="999888777" maxlength="9" required
          :sanitize="sanitizeSoloNumeros" v-bind="telefono1Attrs" :disabled="isSubmitting" :error="errors.telefono1" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <AppInput v-model="telefono2" label="Teléfono alternativo" placeholder="988777666" maxlength="9"
          :sanitize="sanitizeSoloNumeros" v-bind="telefono2Attrs" :disabled="isSubmitting" :error="errors.telefono2" />

        <AppInput v-model="telefono3" label="Teléfono adicional" placeholder="Opcional" maxlength="9"
          :sanitize="sanitizeSoloNumeros" v-bind="telefono3Attrs" :disabled="isSubmitting" :error="errors.telefono3" />
      </div>

      <AppCheckbox v-model="esPrincipal" :disabled="isSubmitting" label="Establecer como contacto principal" />
    </form>

    <template #footer>
      <button type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/3 sm:w-auto"
        :disabled="isSubmitting" @click="handleClose">
        Cancelar
      </button>
      <button type="submit" form="contacto-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting">
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear contacto' : 'Guardar cambios' }}
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
  useCreateContactoMutation,
  useUpdateContactoMutation,
} from '@/modules/contactos/composables/useContactoMutations'
import { useContactoDetailQuery } from '@/modules/contactos/composables/useContactoDetailQuery'
import type {
  Contacto,
  ContactoFormMode,
} from '@/modules/contactos/interfaces/contacto.interface'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { getClienteNombrePrincipal } from '@/modules/clientes/utils/clienteNombre'
import ConsultaDocumentoInput from '@/modules/consultas/components/ConsultaDocumentoInput.vue'
import type {
  ConsultaDniData,
  ConsultaRucData,
} from '@/modules/consultas/interfaces/consulta.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppCheckbox, AppInput, AppModal, AppSelect } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { optionalPhone, optionalString, requiredPhone, requiredString } from '@/shared/validation'

interface ContactoFormModalProps {
  mode: ContactoFormMode
  contacto?: Contacto | null
  defaultClienteId?: number | null
  lockCliente?: boolean
}

const props = defineProps<ContactoFormModalProps>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()

const createMutation = useCreateContactoMutation()
const updateMutation = useUpdateContactoMutation()

const idReferencia = computed(() => props.contacto?.id)
const contactoDetailQuery = useContactoDetailQuery(idReferencia, open)
const contactoActual = computed<Contacto | null>(
  () => contactoDetailQuery.data.value ?? props.contacto ?? null,
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

const clienteLabelActual = computed(() => {
  const c = contactoActual.value
  if (!c) return null
  if (c.cliente_razon_social) return c.cliente_razon_social

  const nombreCompleto = [c.cliente_nombres, c.cliente_apellido_paterno, c.cliente_apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || c.cliente_numero_documento || null
})

const isClienteLocked = computed(
  () => props.mode === 'create' && props.lockCliente && !!props.defaultClienteId,
)

// Documento usado solo para autocompletar nombre/apellidos desde RENIEC/SUNAT;
// el contacto no tiene campo de documento propio, así que no se persiste.
const tipoDocumentoBusqueda = ref<'DNI' | 'RUC'>('DNI')
const numeroDocumentoBusqueda = ref('')
const tipoDocumentoBusquedaOptions = [
  { label: 'DNI', value: 'DNI' },
  { label: 'RUC', value: 'RUC' },
]

const sanitizeSoloNumeros = (raw: string) => raw.replace(/\D/g, '').slice(0, 9)

const aplicarDatosDni = (data: ConsultaDniData) => {
  if (data.nombres) nombre.value = data.nombres
  if (data.apellidoPaterno) apellidoPaterno.value = data.apellidoPaterno
  if (data.apellidoMaterno) apellidoMaterno.value = data.apellidoMaterno
}

const aplicarDatosRuc = (data: ConsultaRucData) => {
  if (data.razonSocial) nombre.value = data.razonSocial
  if (data.direccion) direccion.value = data.direccion
}

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idCliente: yup.number().required('El cliente es obligatorio'),
      nombre: requiredString('El nombre'),
      apellidoPaterno: optionalString(),
      apellidoMaterno: optionalString(),
      direccion: optionalString(),
      email: yup.string().email('Correo electrónico no válido').optional(),
      telefono1: requiredPhone('El teléfono principal'),
      telefono2: optionalPhone(),
      telefono3: optionalPhone(),
      esPrincipal: yup.boolean().default(false),
    }),
  ),
  initialValues: {
    idCliente: undefined as number | undefined,
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    direccion: '',
    email: '',
    telefono1: '',
    telefono2: '',
    telefono3: '',
    esPrincipal: false,
  },
})

const [idCliente, idClienteAttrs] = defineField('idCliente')
const [nombre, nombreAttrs] = defineField('nombre')
const [apellidoPaterno, apellidoPaternoAttrs] = defineField('apellidoPaterno')
const [apellidoMaterno, apellidoMaternoAttrs] = defineField('apellidoMaterno')
const [direccion, direccionAttrs] = defineField('direccion')
const [email, emailAttrs] = defineField('email')
const [telefono1, telefono1Attrs] = defineField('telefono1')
const [telefono2, telefono2Attrs] = defineField('telefono2')
const [telefono3, telefono3Attrs] = defineField('telefono3')
const [esPrincipal] = defineField('esPrincipal')

const syncFormValues = () => {
  const c = contactoActual.value

  resetForm({
    values: {
      idCliente: c?.id_cliente ?? props.defaultClienteId ?? undefined,
      nombre: c?.nombre ?? '',
      apellidoPaterno: c?.apellido_paterno ?? '',
      apellidoMaterno: c?.apellido_materno ?? '',
      direccion: c?.direccion ?? '',
      email: c?.email ?? '',
      telefono1: c?.telefono1 ?? '',
      telefono2: c?.telefono2 ?? '',
      telefono3: c?.telefono3 ?? '',
      esPrincipal: c?.es_principal ?? false,
    },
  })

  tipoDocumentoBusqueda.value = 'DNI'
  numeroDocumentoBusqueda.value = ''
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
      idCliente: Number(values.idCliente),
      nombre: values.nombre,
      apellidoPaterno: values.apellidoPaterno || undefined,
      apellidoMaterno: values.apellidoMaterno || undefined,
      direccion: values.direccion || undefined,
      email: values.email || undefined,
      telefono1: values.telefono1 || undefined,
      telefono2: values.telefono2 || undefined,
      telefono3: values.telefono3 || undefined,
      esPrincipal: values.esPrincipal ?? false,
    }

    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.contacto) {
      await updateMutation.mutateAsync({
        id: props.contacto.id,
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
  () => contactoDetailQuery.data.value,
  () => {
    if (open.value) {
      syncFormValues()
    }
  },
)

watch(
  () => props.contacto,
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
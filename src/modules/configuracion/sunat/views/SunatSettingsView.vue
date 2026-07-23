<template>
  <div>
    <PageBreadcrumb :page-title="'Configuración SUNAT'" :items="breadcrumbItems" />

    <div v-if="isLoadingEmpresas" class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <p class="text-sm text-gray-500 dark:text-gray-400">Cargando empresas...</p>
    </div>

    <div
      v-else-if="!empresaOptions.length"
      class="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/20"
    >
      <p class="text-sm text-amber-800 dark:text-amber-200">
        No hay empresas registradas. Configura una empresa antes de registrar credenciales SUNAT.
      </p>
      <router-link
        :to="CONFIGURACION_HUB_PATH"
        class="mt-3 inline-flex text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
      >
        Ir al hub de configuración
      </router-link>
    </div>

    <form v-else class="space-y-4 pb-32" @submit.prevent="onSubmit">
      <div
        class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-5"
      >
        <AppSelect
          v-model="selectedEmpresaId"
          label="Empresa"
          :options="empresaOptions"
          placeholder="Seleccionar empresa"
          required
          :disabled="isSubmitting"
        />
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <template v-if="isLoadingSunat">Cargando configuración de la empresa...</template>
          <template v-else-if="isEditMode">
            Editando la configuración SUNAT de esta empresa.
          </template>
          <template v-else>
            Esta empresa aún no tiene configuración SUNAT; se creará al guardar.
          </template>
        </p>
      </div>

      <AppCollapsibleSection
        v-model:open="openSol"
        title="Credenciales SUNAT"
        description="Usuario SOL, certificado digital y ambiente de emisión."
        :icon="ICONS.shield"
        :badge="solBadge"
      >
        <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
          <div data-field="usuario_sol">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Usuario SOL <span class="text-error-500">*</span>
            </label>
            <AppInput
              v-model="usuario_sol"
              v-bind="usuarioSolAttrs"
              placeholder="MODDATOS"
              :error="errors.usuario_sol"
            />
          </div>

          <div data-field="clave_sol">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Clave SOL
              <span v-if="!isEditMode" class="text-error-500">*</span>
            </label>
            <AppInput
              v-model="clave_sol"
              v-bind="claveSolAttrs"
              type="password"
              placeholder="Clave SOL"
              autocomplete="off"
              :error="errors.clave_sol"
            />
          </div>

          <div data-field="certificado_digital">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Certificado digital
            </label>
            <AppInput
              v-model="certificado_digital"
              v-bind="certificadoDigitalAttrs"
              placeholder="Ruta o identificador del certificado"
              :error="errors.certificado_digital"
            />
          </div>

          <div data-field="clave_certificado">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Clave del certificado
            </label>
            <AppInput
              v-model="clave_certificado"
              v-bind="claveCertificadoAttrs"
              type="password"
              placeholder="Clave del certificado"
              autocomplete="off"
              :error="errors.clave_certificado"
            />
          </div>

          <div class="lg:col-span-2" data-field="id_ambiente">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Ambiente SUNAT
            </label>
            <AppSelect
              v-model="id_ambiente"
              :options="ambienteOptions"
              placeholder="Seleccionar ambiente"
              :disabled="isLoadingAmbientes"
              :error="errors.id_ambiente"
            />
          </div>
        </div>
      </AppCollapsibleSection>

      <AppCollapsibleSection
        v-model:open="openPse"
        title="Conexión PSE / OSE"
        description="Credenciales del proveedor de facturación electrónica (independiente del nombre comercial)."
        :icon="ICONS.plug"
        :badge="pseBadge"
      >
        <div class="mb-5">
          <AppCheckbox v-model="pse_habilitado" label="Usar PSE/OSE para facturación electrónica" />
        </div>

        <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
          <div data-field="proveedor_pse">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Proveedor PSE
            </label>
            <AppInput
              v-model="proveedor_pse"
              v-bind="proveedorPseAttrs"
              placeholder="Ej. apisperu, nubefact, mi-proveedor"
              :error="errors.proveedor_pse"
            />
          </div>

          <div data-field="ruc_emisor">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              RUC emisor
            </label>
            <AppInput
              v-model="ruc_emisor"
              v-bind="rucEmisorAttrs"
              placeholder="20123456789"
              :error="errors.ruc_emisor"
            />
          </div>

          <div class="lg:col-span-2" data-field="api_base_url">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              URL base API
            </label>
            <AppInput
              v-model="api_base_url"
              v-bind="apiBaseUrlAttrs"
              placeholder="https://api.proveedor.com/v1"
              :error="errors.api_base_url"
            />
          </div>

          <div class="lg:col-span-2" data-field="api_token">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Token API
            </label>
            <AppInput
              v-model="api_token"
              v-bind="apiTokenAttrs"
              type="password"
              placeholder="Bearer / API token"
              autocomplete="off"
              :error="errors.api_token"
            />
          </div>

          <div data-field="api_usuario">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Usuario API
            </label>
            <AppInput
              v-model="api_usuario"
              v-bind="apiUsuarioAttrs"
              placeholder="Si el proveedor usa usuario/clave"
              :error="errors.api_usuario"
            />
          </div>

          <div data-field="api_clave">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Clave API
            </label>
            <AppInput
              v-model="api_clave"
              v-bind="apiClaveAttrs"
              type="password"
              placeholder="Clave API"
              autocomplete="off"
              :error="errors.api_clave"
            />
          </div>

          <div data-field="timeout_ms">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Timeout (ms)
            </label>
            <AppInput
              v-model="timeout_ms"
              v-bind="timeoutMsAttrs"
              type="number"
              placeholder="30000"
              :error="errors.timeout_ms"
            />
          </div>
        </div>
      </AppCollapsibleSection>

      <AppCollapsibleSection
        v-model:open="openOauth"
        title="OAuth GRE (gu?as de remisi?n)"
        description="Client ID / Secret del portal SUNAT. Obligatorio para emitir gu?as electr?nicas (GRE)."
        :icon="ICONS.keyRound"
        :badge="oauthBadge"
      >
        <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
          <div data-field="client_id">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Client ID
            </label>
            <AppInput
              v-model="client_id"
              v-bind="clientIdAttrs"
              placeholder="client_id OAuth"
              :error="errors.client_id"
            />
          </div>

          <div data-field="client_secret">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Client Secret
            </label>
            <AppInput
              v-model="client_secret"
              v-bind="clientSecretAttrs"
              type="password"
              placeholder="Client secret"
              autocomplete="off"
              :error="errors.client_secret"
            />
          </div>
        </div>
      </AppCollapsibleSection>

      <div
        class="pointer-events-none fixed bottom-4 left-0 right-0 z-30 px-4 transition-[left] duration-300 ease-in-out md:px-6"
        :class="isExpanded || isHovered ? 'lg:left-[290px]' : 'lg:left-[90px]'"
      >
        <div
          class="pointer-events-auto mx-auto flex max-w-(--breakpoint-2xl) flex-wrap items-center justify-end gap-3 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-theme-md backdrop-blur dark:border-gray-800 dark:bg-gray-900/95"
        >
          <router-link
            :to="CONFIGURACION_HUB_PATH"
            class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            Volver
          </router-link>
          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!canSave || isSubmitting"
          >
            {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useSidebar } from '@/modules/admin/composables/useSidebar'
import { useEmpresasQuery } from '@/modules/configuracion/empresas/composables/useEmpresasQuery'
import type { EmpresaListFilters } from '@/modules/configuracion/empresas/interfaces/empresa.interface'
import {
  CONFIGURACION_HUB_PATH,
  configuracionBreadcrumbItems,
} from '@/modules/configuracion/config/configuracion-breadcrumb'
import {
  useCreateConfiguracionSunatMutation,
  useUpdateConfiguracionSunatMutation,
} from '@/modules/configuracion/sunat/composables/useConfiguracionSunatMutations'
import { useConfiguracionSunatPorEmpresaQuery } from '@/modules/configuracion/sunat/composables/useConfiguracionSunatPorEmpresaQuery'
import type {
  CreateConfiguracionSunatPayload,
  UpdateConfiguracionSunatPayload,
} from '@/modules/configuracion/sunat/interfaces/configuracion-sunat.interface'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppCheckbox, AppCollapsibleSection, AppInput, AppSelect } from '@/shared/components'
import { toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import {
  optionalNumber,
  optionalString,
  requiredString,
  validationMessages,
} from '@/shared/validation'

const FIELD_ORDER = [
  'usuario_sol',
  'clave_sol',
  'certificado_digital',
  'clave_certificado',
  'id_ambiente',
  'proveedor_pse',
  'ruc_emisor',
  'api_base_url',
  'api_token',
  'api_usuario',
  'api_clave',
  'timeout_ms',
  'client_id',
  'client_secret',
] as const

const SOL_FIELDS = new Set([
  'usuario_sol',
  'clave_sol',
  'certificado_digital',
  'clave_certificado',
  'id_ambiente',
])

const PSE_FIELDS = new Set([
  'proveedor_pse',
  'ruc_emisor',
  'api_base_url',
  'api_token',
  'api_usuario',
  'api_clave',
  'timeout_ms',
  'pse_habilitado',
])

const OAUTH_FIELDS = new Set(['client_id', 'client_secret'])

const authStore = useAuthStore()
const { isExpanded, isHovered } = useSidebar()
const breadcrumbItems = configuracionBreadcrumbItems('SUNAT')

const empresasFilters = ref<EmpresaListFilters>({ pagina: 1, limite: 100 })
const empresasQuery = useEmpresasQuery(empresasFilters)
const selectedEmpresaId = ref<number | undefined>(undefined)
const sunatQuery = useConfiguracionSunatPorEmpresaQuery(selectedEmpresaId)
const createMutation = useCreateConfiguracionSunatMutation()
const updateMutation = useUpdateConfiguracionSunatMutation()

const listaAmbienteSunatId = ref(ListaIds.AMBIENTE_SUNAT)
const ambientesQuery = useListaOpcionesQuery(listaAmbienteSunatId)

const isLoadingAmbientes = computed(() => ambientesQuery.isFetching.value)
const isLoadingEmpresas = computed(() => empresasQuery.isFetching.value)
const isLoadingSunat = computed(() => sunatQuery.isFetching.value)

const ambienteOptions = computed(() =>
  (ambientesQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: opcion.nombre,
  })),
)

const empresaOptions = computed(() =>
  (empresasQuery.data.value?.data ?? []).map((empresaItem) => ({
    value: empresaItem.id,
    label:
      empresaItem.nombre_comercial ||
      empresaItem.razon_social ||
      empresaItem.ruc ||
      `Empresa #${empresaItem.id}`,
  })),
)

const empresa = computed(() => {
  const id = selectedEmpresaId.value
  if (id == null) return null
  return (empresasQuery.data.value?.data ?? []).find((item) => item.id === id) ?? null
})

const configuracionSunat = computed(() => sunatQuery.data.value ?? null)
const isEditMode = computed(() => configuracionSunat.value != null)

watch(
  () => empresasQuery.data.value?.data,
  (empresas) => {
    if (!empresas?.length) {
      selectedEmpresaId.value = undefined
      return
    }
    if (
      selectedEmpresaId.value == null ||
      !empresas.some((item) => item.id === selectedEmpresaId.value)
    ) {
      selectedEmpresaId.value = empresas[0].id
    }
  },
  { immediate: true },
)

const openSol = ref(true)
const openPse = ref(false)
const openOauth = ref(false)

const solBadge = computed(() => {
  if (!configuracionSunat.value) return 'Pendiente'
  return configuracionSunat.value.tiene_clave_sol ? 'Configurado' : 'Incompleto'
})

const pseBadge = computed(() => {
  const cfg = configuracionSunat.value
  if (!cfg) return 'Opcional'
  if (cfg.pse_habilitado === false) return 'Deshabilitado'
  if (cfg.tiene_api_token || cfg.api_usuario) return 'Configurado'
  return 'Sin token'
})

const oauthBadge = computed(() => {
  const cfg = configuracionSunat.value
  if (!cfg) return 'GRE'
  if (cfg.client_id && cfg.tiene_client_secret) return 'Configurado'
  if (cfg.client_id || cfg.tiene_client_secret) return 'Incompleto'
  return 'GRE'
})


const validationSchema = computed(() =>
  toTypedSchema(
    yup.object({
      usuario_sol: requiredString('El usuario SOL'),
      clave_sol: isEditMode.value
        ? optionalString()
        : yup.string().required(validationMessages.required('La clave SOL')),
      certificado_digital: optionalString(),
      clave_certificado: optionalString(),
      id_ambiente: optionalNumber(),
      pse_habilitado: yup.boolean().default(true),
      proveedor_pse: optionalString(),
      api_base_url: optionalString(),
      api_token: optionalString(),
      api_usuario: optionalString(),
      api_clave: optionalString(),
      ruc_emisor: optionalString(),
      client_id: optionalString(),
      client_secret: optionalString(),
      timeout_ms: yup
        .number()
        .transform((value, originalValue) => {
          if (originalValue === '' || originalValue == null || Number.isNaN(value)) {
            return undefined
          }
          return value
        })
        .typeError(validationMessages.nonNegativeNumber)
        .min(0, validationMessages.nonNegativeNumber)
        .optional(),
    }),
  ),
)

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema,
  initialValues: {
    usuario_sol: '',
    clave_sol: '',
    certificado_digital: '',
    clave_certificado: '',
    id_ambiente: undefined as number | undefined,
    pse_habilitado: true,
    proveedor_pse: '',
    api_base_url: '',
    api_token: '',
    api_usuario: '',
    api_clave: '',
    ruc_emisor: '',
    client_id: '',
    client_secret: '',
    timeout_ms: undefined as number | undefined,
  },
})

const [usuario_sol, usuarioSolAttrs] = defineField('usuario_sol')
const [clave_sol, claveSolAttrs] = defineField('clave_sol')
const [certificado_digital, certificadoDigitalAttrs] = defineField('certificado_digital')
const [clave_certificado, claveCertificadoAttrs] = defineField('clave_certificado')
const [id_ambiente] = defineField('id_ambiente')
const [pse_habilitado] = defineField('pse_habilitado')
const [proveedor_pse, proveedorPseAttrs] = defineField('proveedor_pse')
const [api_base_url, apiBaseUrlAttrs] = defineField('api_base_url')
const [api_token, apiTokenAttrs] = defineField('api_token')
const [api_usuario, apiUsuarioAttrs] = defineField('api_usuario')
const [api_clave, apiClaveAttrs] = defineField('api_clave')
const [ruc_emisor, rucEmisorAttrs] = defineField('ruc_emisor')
const [client_id, clientIdAttrs] = defineField('client_id')
const [client_secret, clientSecretAttrs] = defineField('client_secret')
const [timeout_ms, timeoutMsAttrs] = defineField('timeout_ms')

const canSave = computed(() => {
  if (isEditMode.value) {
    return authStore.hasPermission(PermisoBanderas.CONFIGURACION_SUNAT_EDITAR)
  }

  return authStore.hasPermission(PermisoBanderas.CONFIGURACION_SUNAT_CREAR)
})

const syncFormValues = () => {
  const cfg = configuracionSunat.value
  resetForm({
    values: {
      usuario_sol: cfg?.usuario_sol ?? '',
      clave_sol: cfg?.clave_sol ?? '',
      certificado_digital: cfg?.certificado_digital ?? '',
      clave_certificado: cfg?.clave_certificado ?? '',
      id_ambiente: cfg?.id_ambiente ?? undefined,
      pse_habilitado: cfg?.pse_habilitado ?? true,
      proveedor_pse: cfg?.proveedor_pse ?? '',
      api_base_url: cfg?.api_base_url ?? '',
      api_token: cfg?.api_token ?? '',
      api_usuario: cfg?.api_usuario ?? '',
      api_clave: cfg?.api_clave ?? '',
      ruc_emisor: cfg?.ruc_emisor ?? '',
      client_id: cfg?.client_id ?? '',
      client_secret: cfg?.client_secret ?? '',
      timeout_ms: cfg?.timeout_ms ?? undefined,
    },
  })
}

const focusFirstInvalidField = async (errorKeys: string[]) => {
  if (errorKeys.some((key) => SOL_FIELDS.has(key))) openSol.value = true
  if (errorKeys.some((key) => PSE_FIELDS.has(key))) openPse.value = true
  if (errorKeys.some((key) => OAUTH_FIELDS.has(key))) openOauth.value = true

  await nextTick()

  const firstKey =
    FIELD_ORDER.find((key) => errorKeys.includes(key)) ?? errorKeys[0] ?? null
  if (!firstKey) return

  const container = document.querySelector(`[data-field="${firstKey}"]`)
  if (!(container instanceof HTMLElement)) return

  container.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const focusable = container.querySelector<HTMLElement>('input, select, textarea, button')
  focusable?.focus({ preventScroll: true })
}

const onSubmit = handleSubmit(
  async (values) => {
    if (!canSave.value) {
      toastWarning('No tienes permiso para guardar esta configuración')
      return
    }
    if (!empresa.value || selectedEmpresaId.value == null) {
      toastWarning('Selecciona la empresa para esta configuración')
      return
    }

    try {
      if (isEditMode.value && configuracionSunat.value) {
        const payload: UpdateConfiguracionSunatPayload = {
          idEmpresa: selectedEmpresaId.value,
          usuarioSol: values.usuario_sol,
          certificadoDigital: values.certificado_digital || undefined,
          idAmbiente: values.id_ambiente ?? undefined,
          pseHabilitado: values.pse_habilitado,
          proveedorPse: values.proveedor_pse || undefined,
          apiBaseUrl: values.api_base_url || undefined,
          apiUsuario: values.api_usuario || undefined,
          rucEmisor: values.ruc_emisor || undefined,
          clientId: values.client_id || undefined,
          timeoutMs: values.timeout_ms ?? undefined,
        }

        if (values.clave_sol) payload.claveSol = values.clave_sol
        if (values.clave_certificado) payload.claveCertificado = values.clave_certificado
        if (values.api_token) payload.apiToken = values.api_token
        if (values.api_clave) payload.apiClave = values.api_clave
        if (values.client_secret) payload.clientSecret = values.client_secret

        await updateMutation.mutateAsync({
          id: configuracionSunat.value.id,
          payload,
        })
      } else {
        if (!values.clave_sol) {
          toastWarning(validationMessages.required('La clave SOL'))
          openSol.value = true
          await focusFirstInvalidField(['clave_sol'])
          return
        }

        const payload: CreateConfiguracionSunatPayload = {
          idEmpresa: selectedEmpresaId.value,
          usuarioSol: values.usuario_sol,
          claveSol: values.clave_sol,
          certificadoDigital: values.certificado_digital || undefined,
          claveCertificado: values.clave_certificado || undefined,
          idAmbiente: values.id_ambiente ?? undefined,
          pseHabilitado: values.pse_habilitado,
          proveedorPse: values.proveedor_pse || undefined,
          apiBaseUrl: values.api_base_url || undefined,
          apiToken: values.api_token || undefined,
          apiUsuario: values.api_usuario || undefined,
          apiClave: values.api_clave || undefined,
          rucEmisor: values.ruc_emisor || undefined,
          clientId: values.client_id || undefined,
          clientSecret: values.client_secret || undefined,
          timeoutMs: values.timeout_ms ?? undefined,
        }

        await createMutation.mutateAsync(payload)
      }
    } catch {
      // toast en mutation
    }
  },
  ({ errors: submitErrors }) => {
    const errorKeys = Object.keys(submitErrors)
    const firstKey =
      FIELD_ORDER.find((key) => errorKeys.includes(key)) ??
      (errorKeys[0] as (typeof FIELD_ORDER)[number] | undefined)
    const firstMessage =
      firstKey && firstKey in submitErrors
        ? submitErrors[firstKey as keyof typeof submitErrors]
        : undefined

    toastWarning(
      typeof firstMessage === 'string' && firstMessage.trim()
        ? firstMessage
        : 'Completa los campos obligatorios para guardar',
    )
    void focusFirstInvalidField(errorKeys)
  },
)

watch(
  configuracionSunat,
  () => {
    syncFormValues()
  },
  { immediate: true },
)
</script>

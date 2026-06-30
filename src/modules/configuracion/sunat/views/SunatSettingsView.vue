<template>
  <div>
    <PageBreadcrumb page-title="SUNAT" :items="breadcrumbItems" />

    <div
      v-if="isLoading"
      class="w-full rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
    >
      Cargando configuración...
    </div>

    <div
      v-else-if="!empresa"
      class="w-full rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center dark:border-gray-800 dark:bg-gray-900"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Primero debes registrar los datos de la empresa antes de configurar SUNAT.
      </p>
      <div class="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <router-link
          :to="CONFIGURACION_HUB_PATH"
          class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          Volver
        </router-link>
        <router-link
          to="/admin/configuracion/empresas"
          class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          Ir a Empresa
        </router-link>
      </div>
    </div>

    <div
      v-else
      class="w-full rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
          Facturación electrónica
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Credenciales SOL y certificado digital para emisión de comprobantes.
        </p>
        <p class="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Empresa:
          <span class="font-medium text-gray-800 dark:text-white/90">
            {{ empresaLabel }}
          </span>
        </p>
      </div>

      <form
        id="sunat-settings-form"
        class="space-y-4 px-6 py-5"
        autocomplete="off"
        @submit="onSubmit"
      >
        <AppInput
          v-model="usuario_sol"
          label="Usuario SOL"
          placeholder="MODDATOS"
          required
          v-bind="usuarioSolAttrs"
          :disabled="!canSave || isSubmitting"
          :error="errors.usuario_sol"
        />

        <AppInput
          v-model="clave_sol"
          type="password"
          :label="isEditMode ? 'Nueva clave SOL' : 'Clave SOL'"
          :placeholder="isEditMode ? 'Dejar vacío para no cambiar' : 'Clave SOL'"
          name="sunat-clave-sol"
          autocomplete="new-password"
          :required="!isEditMode"
          v-bind="claveSolAttrs"
          :disabled="!canSave || isSubmitting"
          :error="errors.clave_sol"
          :hint="isEditMode ? 'Dejar vacío para mantener la clave actual.' : undefined"
        />

        <AppInput
          v-model="certificado_digital"
          label="Certificado digital"
          placeholder="Ruta o referencia del certificado"
          v-bind="certificadoDigitalAttrs"
          :disabled="!canSave || isSubmitting"
        />

        <AppInput
          v-model="clave_certificado"
          type="password"
          :label="isEditMode ? 'Nueva clave del certificado' : 'Clave del certificado'"
          placeholder="Clave del certificado"
          name="sunat-clave-certificado"
          autocomplete="new-password"
          v-bind="claveCertificadoAttrs"
          :disabled="!canSave || isSubmitting"
          :hint="isEditMode ? 'Dejar vacío para mantener la clave actual.' : undefined"
        />

        <AppInput
          v-model="id_ambiente"
          type="number"
          label="ID ambiente"
          placeholder="1"
          v-bind="idAmbienteAttrs"
          :disabled="!canSave || isSubmitting"
        />
      </form>

      <div
        class="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
      >
        <router-link
          :to="CONFIGURACION_HUB_PATH"
          class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          Volver
        </router-link>

        <button
          v-if="canSave"
          type="submit"
          form="sunat-settings-form"
          class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="isSubmitting"
        >
          {{
            isSubmitting
              ? 'Guardando...'
              : isEditMode
                ? 'Guardar cambios'
                : 'Registrar configuración'
          }}
        </button>

        <p v-else class="text-sm text-gray-500 dark:text-gray-400">
          Solo lectura: no tienes permisos para modificar la configuración SUNAT.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useEmpresaActualQuery } from '@/modules/configuracion/empresas/composables/useEmpresaActualQuery'
import {
  CONFIGURACION_HUB_PATH,
  configuracionBreadcrumbItems,
} from '@/modules/configuracion/config/configuracion-breadcrumb'
import {
  useCreateConfiguracionSunatMutation,
  useUpdateConfiguracionSunatMutation,
} from '@/modules/configuracion/sunat/composables/useConfiguracionSunatMutations'
import { useConfiguracionSunatActualQuery } from '@/modules/configuracion/sunat/composables/useConfiguracionSunatActualQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput } from '@/shared/components'
import { PermisoBanderas } from '@/shared/constants/permissions'
import {
  optionalNumber,
  optionalString,
  requiredString,
  validationMessages,
} from '@/shared/validation'

const authStore = useAuthStore()
const breadcrumbItems = configuracionBreadcrumbItems('SUNAT')
const empresaQuery = useEmpresaActualQuery()
const sunatQuery = useConfiguracionSunatActualQuery()
const createMutation = useCreateConfiguracionSunatMutation()
const updateMutation = useUpdateConfiguracionSunatMutation()

const isLoading = computed(
  () => empresaQuery.isFetching.value || sunatQuery.isFetching.value,
)
const empresa = computed(() => empresaQuery.data.value ?? null)
const configuracionSunat = computed(() => sunatQuery.data.value ?? null)
const isEditMode = computed(() => configuracionSunat.value != null)

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
  },
})

const [usuario_sol, usuarioSolAttrs] = defineField('usuario_sol')
const [clave_sol, claveSolAttrs] = defineField('clave_sol')
const [certificado_digital, certificadoDigitalAttrs] = defineField('certificado_digital')
const [clave_certificado, claveCertificadoAttrs] = defineField('clave_certificado')
const [id_ambiente, idAmbienteAttrs] = defineField('id_ambiente')

const empresaLabel = computed(() => {
  if (!empresa.value) return ''
  return empresa.value.nombre_comercial || empresa.value.razon_social || empresa.value.ruc
})

const canSave = computed(() => {
  if (isEditMode.value) {
    return authStore.hasPermission(PermisoBanderas.CONFIGURACION_SUNAT_EDITAR)
  }

  return authStore.hasPermission(PermisoBanderas.CONFIGURACION_SUNAT_CREAR)
})

const syncFormValues = () => {
  resetForm({
    values: {
      usuario_sol: configuracionSunat.value?.usuario_sol ?? '',
      clave_sol: '',
      certificado_digital: configuracionSunat.value?.certificado_digital ?? '',
      clave_certificado: '',
      id_ambiente: configuracionSunat.value?.id_ambiente ?? undefined,
    },
  })
}

const onSubmit = handleSubmit(async (values) => {
  if (!canSave.value || !empresa.value) return

  try {
    if (isEditMode.value && configuracionSunat.value) {
      const payload: {
        idEmpresa: number
        usuarioSol: string
        claveSol?: string
        certificadoDigital?: string
        claveCertificado?: string
        idAmbiente?: number
      } = {
        idEmpresa: empresa.value.id,
        usuarioSol: values.usuario_sol,
        certificadoDigital: values.certificado_digital || undefined,
        idAmbiente: values.id_ambiente,
      }

      if (values.clave_sol) {
        payload.claveSol = values.clave_sol
      }

      if (values.clave_certificado) {
        payload.claveCertificado = values.clave_certificado
      }

      await updateMutation.mutateAsync({
        id: configuracionSunat.value.id,
        payload,
      })
    } else {
      if (!values.clave_sol) return

      await createMutation.mutateAsync({
        idEmpresa: empresa.value.id,
        usuarioSol: values.usuario_sol,
        claveSol: values.clave_sol,
        certificadoDigital: values.certificado_digital || undefined,
        claveCertificado: values.clave_certificado || undefined,
        idAmbiente: values.id_ambiente,
      })
    }
  } catch {
    // toast en mutation
  }
})

watch(
  configuracionSunat,
  () => {
    syncFormValues()
  },
  { immediate: true },
)
</script>

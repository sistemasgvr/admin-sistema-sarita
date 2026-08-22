<template>
  <div>
    <PageBreadcrumb page-title="Empresa" :items="breadcrumbItems" />

    <div
      v-if="isLoading"
      class="w-full rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
    >
      Cargando configuración...
    </div>

    <div
      v-else
      class="w-full rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
          Datos de la empresa
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Información fiscal y de contacto utilizada en todo el sistema.
        </p>
      </div>

      <form
        id="empresa-settings-form"
        class="space-y-4 px-6 py-5"
        autocomplete="off"
        @submit="onSubmit"
      >
        <AppInput
          v-model="ruc"
          label="RUC"
          placeholder="20123456789"
          required
          v-bind="rucAttrs"
          :disabled="!canSave || isSubmitting"
          :error="errors.ruc"
        />

        <AppInput
          v-model="razon_social"
          label="Razón social"
          placeholder="Empresa S.A.C."
          v-bind="razonSocialAttrs"
          :disabled="!canSave || isSubmitting"
        />

        <AppInput
          v-model="nombre_comercial"
          label="Nombre comercial"
          placeholder="Mi Empresa"
          v-bind="nombreComercialAttrs"
          :disabled="!canSave || isSubmitting"
        />

        <AppInput
          v-model="direccion"
          label="Dirección"
          placeholder="Av. Principal 123"
          v-bind="direccionAttrs"
          :disabled="!canSave || isSubmitting"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="telefono"
            label="Teléfono"
            placeholder="999 999 999"
            v-bind="telefonoAttrs"
            :disabled="!canSave || isSubmitting"
          />

          <AppInput
            v-model="email"
            type="email"
            label="Correo"
            placeholder="contacto@empresa.com"
            v-bind="emailAttrs"
            :disabled="!canSave || isSubmitting"
            :error="errors.email"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="tolerancia_m3_ruta_pueblo"
            label="Tolerancia ruta pueblos (m³)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.5"
            help="Al cerrar una ruta, avisa si el gas calculado y el reportado difieren más de este valor."
            v-bind="toleranciaAttrs"
            :disabled="!canSave || isSubmitting"
            :error="errors.tolerancia_m3_ruta_pueblo"
          />
          <AppInput
            v-model="psi_minimo_util"
            label="PSI mínimo útil"
            type="number"
            step="1"
            min="0"
            placeholder="100"
            help="Si la presión del cilindro es menor, se considera vacío / enviar a planta."
            v-bind="psiMinimoAttrs"
            :disabled="!canSave || isSubmitting"
            :error="errors.psi_minimo_util"
          />
        </div>
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
          form="empresa-settings-form"
          class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar empresa' }}
        </button>

        <p v-else class="text-sm text-gray-500 dark:text-gray-400">
          Solo lectura: no tienes permisos para modificar la configuración de la empresa.
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
import {
  CONFIGURACION_HUB_PATH,
  configuracionBreadcrumbItems,
} from '@/modules/configuracion/config/configuracion-breadcrumb'
import {
  useCreateEmpresaMutation,
  useUpdateEmpresaMutation,
} from '@/modules/configuracion/empresas/composables/useEmpresaMutations'
import { useEmpresaActualQuery } from '@/modules/configuracion/empresas/composables/useEmpresaActualQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput } from '@/shared/components'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { optionalEmail, optionalNumber, optionalString, requiredString } from '@/shared/validation'

const authStore = useAuthStore()
const breadcrumbItems = configuracionBreadcrumbItems('Empresa')
const empresaQuery = useEmpresaActualQuery()
const createMutation = useCreateEmpresaMutation()
const updateMutation = useUpdateEmpresaMutation()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      ruc: requiredString('El RUC'),
      razon_social: optionalString(),
      nombre_comercial: optionalString(),
      direccion: optionalString(),
      telefono: optionalString(),
      email: optionalEmail(),
      tolerancia_m3_ruta_pueblo: optionalNumber(),
      psi_minimo_util: optionalNumber(),
    }),
  ),
  initialValues: {
    ruc: '',
    razon_social: '',
    nombre_comercial: '',
    direccion: '',
    telefono: '',
    email: '',
    tolerancia_m3_ruta_pueblo: 0.5 as number | undefined,
    psi_minimo_util: 100 as number | undefined,
  },
})

const [ruc, rucAttrs] = defineField('ruc')
const [razon_social, razonSocialAttrs] = defineField('razon_social')
const [nombre_comercial, nombreComercialAttrs] = defineField('nombre_comercial')
const [direccion, direccionAttrs] = defineField('direccion')
const [telefono, telefonoAttrs] = defineField('telefono')
const [email, emailAttrs] = defineField('email')
const [tolerancia_m3_ruta_pueblo, toleranciaAttrs] = defineField('tolerancia_m3_ruta_pueblo')
const [psi_minimo_util, psiMinimoAttrs] = defineField('psi_minimo_util')

const isLoading = computed(() => empresaQuery.isFetching.value)
const empresa = computed(() => empresaQuery.data.value ?? null)
const isEditMode = computed(() => empresa.value != null)

const canSave = computed(() => {
  if (isEditMode.value) {
    return authStore.hasPermission(PermisoBanderas.EMPRESAS_EDITAR)
  }

  return authStore.hasPermission(PermisoBanderas.EMPRESAS_CREAR)
})

const syncFormValues = () => {
  resetForm({
    values: {
      ruc: empresa.value?.ruc ?? '',
      razon_social: empresa.value?.razon_social ?? '',
      nombre_comercial: empresa.value?.nombre_comercial ?? '',
      direccion: empresa.value?.direccion ?? '',
      telefono: empresa.value?.telefono ?? '',
      email: empresa.value?.email ?? '',
      tolerancia_m3_ruta_pueblo:
        empresa.value?.tolerancia_m3_ruta_pueblo != null
          ? Number(empresa.value.tolerancia_m3_ruta_pueblo)
          : 0.5,
      psi_minimo_util:
        empresa.value?.psi_minimo_util != null
          ? Number(empresa.value.psi_minimo_util)
          : 100,
    },
  })
}

const onSubmit = handleSubmit(async (values) => {
  if (!canSave.value) return

  try {
    const payload = {
      ruc: values.ruc,
      razonSocial: values.razon_social || undefined,
      nombreComercial: values.nombre_comercial || undefined,
      direccion: values.direccion || undefined,
      telefono: values.telefono || undefined,
      email: values.email || undefined,
      toleranciaM3RutaPueblo:
        values.tolerancia_m3_ruta_pueblo != null
          ? Number(values.tolerancia_m3_ruta_pueblo)
          : undefined,
      psiMinimoUtil:
        values.psi_minimo_util != null ? Number(values.psi_minimo_util) : undefined,
    }

    if (isEditMode.value && empresa.value) {
      await updateMutation.mutateAsync({
        id: empresa.value.id,
        payload,
      })
    } else {
      await createMutation.mutateAsync(payload)
    }
  } catch {
    // toast en mutation
  }
})

watch(
  empresa,
  () => {
    syncFormValues()
  },
  { immediate: true },
)
</script>

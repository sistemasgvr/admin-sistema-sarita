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
        @submit.prevent="handleSubmit"
      >
        <AppInput
          v-model="form.ruc"
          label="RUC"
          placeholder="20123456789"
          required
          :disabled="!canSave || isSubmitting"
          :error="errors.ruc"
        />

        <AppInput
          v-model="form.razon_social"
          label="Razón social"
          placeholder="Empresa S.A.C."
          :disabled="!canSave || isSubmitting"
        />

        <AppInput
          v-model="form.nombre_comercial"
          label="Nombre comercial"
          placeholder="Mi Empresa"
          :disabled="!canSave || isSubmitting"
        />

        <AppInput
          v-model="form.direccion"
          label="Dirección"
          placeholder="Av. Principal 123"
          :disabled="!canSave || isSubmitting"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <AppInput
            v-model="form.telefono"
            label="Teléfono"
            placeholder="999 999 999"
            :disabled="!canSave || isSubmitting"
          />

          <AppInput
            v-model="form.email"
            type="email"
            label="Correo"
            placeholder="contacto@empresa.com"
            :disabled="!canSave || isSubmitting"
            :error="errors.email"
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
import { computed, reactive, ref, watch } from 'vue'
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

const authStore = useAuthStore()
const breadcrumbItems = configuracionBreadcrumbItems('Empresa')
const empresaQuery = useEmpresaActualQuery()
const createMutation = useCreateEmpresaMutation()
const updateMutation = useUpdateEmpresaMutation()

const form = reactive({
  ruc: '',
  razon_social: '',
  nombre_comercial: '',
  direccion: '',
  telefono: '',
  email: '',
})

const errors = reactive({
  ruc: '',
  email: '',
})

const isSubmitting = ref(false)

const isLoading = computed(() => empresaQuery.isFetching.value)
const empresa = computed(() => empresaQuery.data.value ?? null)
const isEditMode = computed(() => empresa.value != null)

const canSave = computed(() => {
  if (isEditMode.value) {
    return authStore.hasPermission(PermisoBanderas.EMPRESAS_EDITAR)
  }

  return authStore.hasPermission(PermisoBanderas.EMPRESAS_CREAR)
})

const resetForm = () => {
  form.ruc = empresa.value?.ruc ?? ''
  form.razon_social = empresa.value?.razon_social ?? ''
  form.nombre_comercial = empresa.value?.nombre_comercial ?? ''
  form.direccion = empresa.value?.direccion ?? ''
  form.telefono = empresa.value?.telefono ?? ''
  form.email = empresa.value?.email ?? ''
  errors.ruc = ''
  errors.email = ''
}

const validate = () => {
  errors.ruc = ''
  errors.email = ''

  if (!form.ruc.trim()) {
    errors.ruc = 'El RUC es obligatorio'
  }

  return !errors.ruc && !errors.email
}

const handleSubmit = async () => {
  if (!canSave.value || !validate()) return

  isSubmitting.value = true

  try {
    const payload = {
      ruc: form.ruc.trim(),
      razonSocial: form.razon_social.trim() || undefined,
      nombreComercial: form.nombre_comercial.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
      email: form.email.trim() || undefined,
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
  } finally {
    isSubmitting.value = false
  }
}

watch(
  empresa,
  () => {
    resetForm()
  },
  { immediate: true },
)
</script>

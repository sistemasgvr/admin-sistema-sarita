<template>
  <div>
    <PageBreadcrumb page-title="Empresa" :items="breadcrumbItems" />

    <div class="mb-4 flex items-end gap-4">
      <AppSelect v-model="selectedEmpresaId" label="Empresa activa" :options="empresaOptions" placeholder="Selecciona una empresa" :disabled="isSubmitting || creating" />
      <button v-if="authStore.hasPermission(PermisoBanderas.EMPRESAS_CREAR)" type="button" class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm text-white" @click="creating = true; syncFormValues()">Añadir empresa</button>
    </div>
    <p class="mb-4 text-sm text-gray-500">La selección se conserva para tu usuario en este navegador. Cada guía guarda su propia empresa emisora.</p>
    <p v-if="empresaQuery.isError.value" role="alert" class="mb-4 text-red-600">No se pudo cargar la empresa seleccionada. Reintenta o selecciona otra empresa.</p>
    <div
      v-if="isLoading"
      class="w-full rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
    >
      Cargando configuración...
    </div>

    <component
      :is="creating ? AppModal : 'div'"
      v-else-if="empresa || creating"
      :model-value="creating"
      title="Añadir empresa"
      @update:model-value="closeCreate"
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
        <!-- data-tutorial: anclas de la ruta guiada de Soporte (Configuración › empresa). -->
        <AppInput
          v-model="ruc"
          data-tutorial="empresa-ruc"
          label="RUC"
          placeholder="20123456789"
          required
          v-bind="rucAttrs"
          :disabled="!canSave || isSubmitting"
          :error="errors.ruc"
        />

        <AppInput
          v-model="razon_social"
          data-tutorial="empresa-razon-social"
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
          data-tutorial="empresa-direccion"
          label="Dirección"
          placeholder="Av. Principal 123"
          v-bind="direccionAttrs"
          :disabled="!canSave || isSubmitting"
        />

        <div class="space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Distrito fiscal (ubigeo SUNAT)
            </label>
            <span
              v-if="empresa"
              class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              :class="empresa.codigo_ubigeo
                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'"
            >
              {{ empresa.codigo_ubigeo ? `Ubigeo ${empresa.codigo_ubigeo}` : 'Requerido para emitir GRE' }}
            </span>
          </div>
          <UbigeoCascadeSelect
            v-model:id-pais="fiscalPaisId"
            v-model:id-departamento="fiscalDeptoId"
            v-model:id-provincia="fiscalProvId"
            v-model:id-distrito="fiscalDistritoId"
            v-model:presetting="fiscalPresetting"
            :disabled="!canSave || isSubmitting"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Se envía como domicilio fiscal en las guías de remisión electrónicas de esta empresa.
          </p>
        </div>

        <div data-tutorial="empresa-contacto" class="grid gap-4 sm:grid-cols-2">
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

        <div data-tutorial="empresa-parametros" class="grid gap-4 sm:grid-cols-2">
          <!-- <AppInput
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
          /> -->
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
        <button v-if="creating" type="button" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm" :disabled="isSubmitting" @click="closeCreate">Cancelar</button>
        <router-link
          v-else
          :to="CONFIGURACION_HUB_PATH"
          class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          Volver
        </router-link>

        <button
          v-if="canSave"
          type="submit"
          form="empresa-settings-form"
          data-tutorial="empresa-guardar"
          class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Registrar empresa' }}
        </button>

        <p v-else class="text-sm text-gray-500 dark:text-gray-400">
          Solo lectura: no tienes permisos para modificar la configuración de la empresa.
        </p>
      </div>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
import { useEmpresaSeleccionada } from '../composables/useEmpresaSeleccionada'
import { useEmpresasQuery } from '../composables/useEmpresasQuery'
import { useEmpresaActualQuery } from '@/modules/configuracion/empresas/composables/useEmpresaActualQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useTutorialAutoStart } from '@/modules/soporte/composables/useTutorialAutoStart'
import { createConfiguracionEmpresaTutorial } from '@/modules/soporte/tutorials/configuracion-empresa.tutorial'
import { AppInput, AppSelect, AppModal, UbigeoCascadeSelect } from '@/shared/components'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { optionalEmail, optionalNumber, optionalString, requiredString } from '@/shared/validation'

const authStore = useAuthStore()

useTutorialAutoStart('configuracion-empresa', createConfiguracionEmpresaTutorial)
const breadcrumbItems = configuracionBreadcrumbItems('Empresa')
const selectedEmpresaId = useEmpresaSeleccionada()
const empresasQuery = useEmpresasQuery(ref({ pagina: 1, limite: 100 }))
const empresaOptions = computed(() => (empresasQuery.data.value?.data ?? []).map(e => ({ value: e.id, label: `${e.razon_social || e.nombre_comercial || 'Empresa'} · ${e.ruc}` })))
const creating = ref(false)
const closeCreate = () => { if (!isSubmitting.value) { creating.value = false; syncFormValues() } }
const empresaQuery = useEmpresaActualQuery()
const createMutation = useCreateEmpresaMutation()
const updateMutation = useUpdateEmpresaMutation()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      ruc: requiredString('El RUC').matches(/^\d{11}$/, 'El RUC debe tener 11 dígitos'),
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

const [psi_minimo_util, psiMinimoAttrs] = defineField('psi_minimo_util')

// ---- Domicilio fiscal (ubigeo en cascada) ----
const fiscalPaisId = ref<number | undefined>(undefined)
const fiscalDeptoId = ref<number | undefined>(undefined)
const fiscalProvId = ref<number | undefined>(undefined)
const fiscalDistritoId = ref<number | undefined>(undefined)
const fiscalPresetting = ref(false)

function syncUbigeoFiscal() {
  fiscalPresetting.value = true
  fiscalPaisId.value = empresa.value?.id_pais ?? undefined
  fiscalDeptoId.value = empresa.value?.id_departamento ?? undefined
  fiscalProvId.value = empresa.value?.id_provincia ?? undefined
  fiscalDistritoId.value = empresa.value?.id_distrito ?? undefined
  requestAnimationFrame(() => {
    fiscalPresetting.value = false
  })
}

const isLoading = computed(() => !creating.value && empresaQuery.isFetching.value)
const empresa = computed(() => creating.value ? null : empresaQuery.data.value ?? null)
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
      idDistrito: fiscalDistritoId.value,
    }

    if (isEditMode.value && empresa.value) {
      await updateMutation.mutateAsync({
        id: empresa.value.id,
        payload,
      })
    } else {
      const creada = await createMutation.mutateAsync(payload)
      selectedEmpresaId.value = creada.id
      creating.value = false
    }
  } catch {
    // toast en mutation
  }
})

watch(
  empresa,
  () => {
    syncFormValues()
    syncUbigeoFiscal()
  },
  { immediate: true },
)
</script>

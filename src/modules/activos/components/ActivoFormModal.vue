<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo activo' : 'Editar activo'"
    subtitle="Registra un activo fijo de la empresa (computadoras, escritorios, etc.)."
    size="lg"
    @close="handleClose"
  >
    <form id="activo-form" class="space-y-4" autocomplete="off" @submit="onSubmit">
      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.package" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Datos del activo</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tipo, descripción e identificación</p>
          </div>
        </header>

        <div class="space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <AppSelectWithCreate
              :can-create="true"
              create-title="Agregar tipo de activo"
              @create="tipoModalOpen = true"
            >
              <AppSelect
                v-model="idTipo"
                label="Tipo"
                placeholder="Selecciona..."
                required
                v-bind="idTipoAttrs"
                :disabled="isSubmitting || tipoQuery.isLoading.value"
                :error="errors.idTipo"
                :options="tipoOptions"
              />
            </AppSelectWithCreate>
            <AppInput
              v-model="descripcion"
              label="Descripción"
              placeholder="Laptop Dell Latitude 5420"
              required
              v-bind="descripcionAttrs"
              :disabled="isSubmitting"
              :error="errors.descripcion"
            />
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
            <AppInput
              v-model="marca"
              label="Marca"
              placeholder="Dell"
              v-bind="marcaAttrs"
              :disabled="isSubmitting"
              :error="errors.marca"
            />
            <AppInput
              v-model="modelo"
              label="Modelo"
              placeholder="Latitude 5420"
              v-bind="modeloAttrs"
              :disabled="isSubmitting"
              :error="errors.modelo"
            />
            <AppInput
              v-model="numeroSerie"
              label="N° de serie"
              placeholder="SN-ABC123"
              v-bind="numeroSerieAttrs"
              :disabled="isSubmitting"
              :error="errors.numeroSerie"
            />
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.creditCard" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Adquisición</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Compra, costo y sucursal asignada</p>
          </div>
        </header>

        <div class="grid gap-3 sm:grid-cols-3">
          <AppDatePicker
            v-model="fechaCompra"
            label="Fecha de compra"
            :disabled="isSubmitting"
            :error="errors.fechaCompra"
          />
          <AppInput
            v-model="importe"
            type="number"
            step="0.01"
            label="Importe (S/)"
            placeholder="3500.00"
            v-bind="importeAttrs"
            :disabled="isSubmitting"
            :error="errors.importe"
          />
          <AppSelect
            v-model="idSucursal"
            label="Sucursal"
            placeholder="Selecciona..."
            v-bind="idSucursalAttrs"
            :disabled="isSubmitting || sucursalesQuery.isLoading.value"
            :error="errors.idSucursal"
            :options="sucursalOptions"
          />
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.contact" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Responsable e imagen</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Quién lo tiene a cargo y una foto de referencia</p>
          </div>
        </header>

        <div class="space-y-3">
          <SearchableSelect
            v-model="idTrabajadorResponsable"
            label="Trabajador responsable"
            placeholder="Buscar trabajador..."
            empty-option-label="Sin responsable asignado"
            :model-label="responsableLabelActual"
            :search-fn="searchResponsables"
            :disabled="isSubmitting"
          />
          <ActivoImagenField v-model="imagenPrincipalRuta" :disabled="isSubmitting" />
        </div>
      </section>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          :disabled="isSubmitting"
          @click="handleClose"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="activo-form"
          class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Guardar' }}
        </button>
      </div>
    </template>

    <ListaOpcionFormModal
      :id-lista="ListaIds.ACTIVOS_TIPO"
      v-model="tipoModalOpen"
      title="Nuevo tipo de activo"
      nombre-placeholder="Ej. Laptop, Escritorio"
      @saved="onTipoCreado"
    />
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  AppDatePicker,
  AppInput,
  AppModal,
  AppSelect,
  AppSelectWithCreate,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import ActivoImagenField from '@/modules/activos/components/ActivoImagenField.vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import { trabajadoresService } from '@/modules/trabajadores/services/trabajadores.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ListaIds } from '@/shared/constants/lista-ids'
import { optionalString, requiredString } from '@/shared/validation'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import type {
  Activo,
  ActivoFormMode,
} from '@/modules/activos/interfaces/activo.interface'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import {
  useCreateActivoMutation,
  useUpdateActivoMutation,
} from '@/modules/activos/composables/useActivoMutations'

interface ActivoFormModalProps {
  mode: ActivoFormMode
  activo?: Activo | null
}

const props = withDefaults(defineProps<ActivoFormModalProps>(), {})

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [activo?: Activo] }>()

const tipoModalOpen = ref(false)
const onTipoCreado = (opcion: ListaOpcion) => {
  idTipo.value = opcion.id
}

const authStore = useAuthStore()
const createMutation = useCreateActivoMutation()
const updateMutation = useUpdateActivoMutation()

const tipoQuery = useListaOpcionesQuery(computed(() => ListaIds.ACTIVOS_TIPO))
const tipoOptions = computed<SelectOption[]>(() => toSelectOptions(tipoQuery.data.value))

const sucursalesQuery = useSucursalesQuery(ref({ pagina: 1, limite: 200 }))
const sucursalOptions = computed<SelectOption[]>(
  () => sucursalesQuery.data.value?.data?.map((s) => ({ value: s.id, label: s.nombre })) ?? [],
)

const getTrabajadorNombre = (t: { nombres?: string | null; apellido_paterno?: string | null; apellido_materno?: string | null }) =>
  [t.nombres, t.apellido_paterno, t.apellido_materno].filter(Boolean).join(' ').trim()

const searchResponsables = async (query: string): Promise<SelectOption[]> => {
  const response = await trabajadoresService.listar({ buscar: query || undefined, pagina: 1, limite: 20 })
  return (response.data ?? []).map((t) => ({ value: t.id, label: getTrabajadorNombre(t) || `Trabajador ${t.id}` }))
}

const responsableLabelActual = computed(() => props.activo?.nombre_trabajador_responsable ?? null)

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idTipo: yup.number().required('Selecciona el tipo').nullable(),
      descripcion: requiredString('La descripción'),
      fechaCompra: optionalString(),
      importe: yup.number().optional().nullable(),
      idSucursal: yup.number().optional().nullable(),
      marca: optionalString(),
      modelo: optionalString(),
      numeroSerie: optionalString(),
      idTrabajadorResponsable: yup.number().optional().nullable(),
      imagenPrincipalRuta: optionalString(),
    }),
  ),
  initialValues: {
    idTipo: undefined as number | undefined,
    descripcion: '',
    fechaCompra: '',
    importe: undefined as number | undefined,
    idSucursal: undefined as number | undefined,
    marca: '',
    modelo: '',
    numeroSerie: '',
    idTrabajadorResponsable: undefined as number | undefined,
    imagenPrincipalRuta: '',
  },
})

const [idTipo, idTipoAttrs] = defineField('idTipo')
const [descripcion, descripcionAttrs] = defineField('descripcion')
const [fechaCompra] = defineField('fechaCompra')
const [importe, importeAttrs] = defineField('importe')
const [idSucursal, idSucursalAttrs] = defineField('idSucursal')
const [marca, marcaAttrs] = defineField('marca')
const [modelo, modeloAttrs] = defineField('modelo')
const [numeroSerie, numeroSerieAttrs] = defineField('numeroSerie')
const [idTrabajadorResponsable] = defineField('idTrabajadorResponsable')
const [imagenPrincipalRuta] = defineField('imagenPrincipalRuta')

watch(
  () => props.activo,
  (activo) => {
    if (!open.value) return
    resetForm({
      values: {
        idTipo: activo?.id_tipo ?? undefined,
        descripcion: activo?.descripcion ?? '',
        fechaCompra: activo?.fecha_compra ?? '',
        importe: (activo?.importe as number | undefined) ?? undefined,
        idSucursal: activo?.id_sucursal ?? undefined,
        marca: activo?.marca ?? '',
        modelo: activo?.modelo ?? '',
        numeroSerie: activo?.numero_serie ?? '',
        idTrabajadorResponsable: activo?.id_trabajador_responsable ?? undefined,
        imagenPrincipalRuta: activo?.imagen_principal_ruta ?? '',
      },
    })
  },
  { immediate: true },
)

const buildPayload = () => ({
  idUsuarioAuditoria: authStore.user?.id ?? 0,
  idTipo: idTipo.value ? Number(idTipo.value) : undefined,
  descripcion: descripcion.value?.trim() || undefined,
  fechaCompra: fechaCompra.value || undefined,
  importe: importe.value != null ? Number(importe.value) : undefined,
  idSucursal: idSucursal.value ? Number(idSucursal.value) : undefined,
  marca: marca.value?.trim() || undefined,
  modelo: modelo.value?.trim() || undefined,
  numeroSerie: numeroSerie.value?.trim() || undefined,
  idTrabajadorResponsable: idTrabajadorResponsable.value
    ? Number(idTrabajadorResponsable.value)
    : undefined,
  imagenPrincipalRuta: imagenPrincipalRuta.value?.trim() || undefined,
})

const onSubmit = handleSubmit(async (values) => {
  void values
  const payload = buildPayload()
  try {
    if (props.mode === 'edit' && props.activo) {
      await updateMutation.mutateAsync({ id: props.activo.id, payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    emit('saved')
    open.value = false
  } catch {
    // toast en mutation
  }
})

const handleClose = () => {
  open.value = false
}
</script>
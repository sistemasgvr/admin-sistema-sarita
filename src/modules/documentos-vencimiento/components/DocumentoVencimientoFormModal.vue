<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nuevo documento' : 'Editar documento'"
    :subtitle="
      mode === 'create'
        ? 'Permiso, certificado o control con fecha de vencimiento (BPA, salubridad, defensa civil, saneamiento, extintores, SOAT...).'
        : 'Actualiza los datos del documento seleccionado.'
    "
    size="lg"
    @close="handleClose"
  >
    <form id="documento-vencimiento-form" class="space-y-4" autocomplete="off" @submit="onSubmit">
      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.fileKey" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Datos del documento</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Categoría y descripción</p>
          </div>
        </header>

        <div class="space-y-3">
          <AppSelectWithCreate
            :can-create="canCrearCategoria"
            create-title="Nueva categoría de documento"
            :disabled="isSubmitting"
            @create="categoriaModalOpen = true"
          >
            <AppSelect
              v-model="idCategoria"
              label="Categoría"
              :placeholder="categoriaQuery.isLoading.value ? 'Cargando...' : 'Selecciona categoría'"
              optional
              v-bind="idCategoriaAttrs"
              :disabled="isSubmitting || categoriaQuery.isLoading.value"
              :options="categoriaOptions"
              :error="errors.idCategoria"
            />
          </AppSelectWithCreate>

          <AppInput
            v-model="descripcion"
            label="Descripción"
            placeholder="Ej.: BPA - Planta principal, Extintor local Trujillo..."
            required
            v-bind="descripcionAttrs"
            :disabled="isSubmitting"
            :error="errors.descripcion"
          />

          <AppInput
            v-model="numeroDocumento"
            label="N° de documento"
            placeholder="Opcional"
            v-bind="numeroDocumentoAttrs"
            :disabled="isSubmitting"
            :error="errors.numeroDocumento"
          />
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.layers" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Alcance</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">A quién o qué aplica este documento</p>
          </div>
        </header>

        <div
          class="mb-3 inline-flex rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900/40"
          role="tablist"
        >
          <button
            v-for="opt in alcanceOptions"
            :key="opt.value"
            type="button"
            role="tab"
            :aria-selected="alcance === opt.value"
            :disabled="isSubmitting"
            :class="[
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
              alcance === opt.value
                ? 'bg-brand-50 text-brand-600 shadow-theme-xs dark:bg-brand-500/15 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="cambiarAlcance(opt.value)"
          >
            <AppIcon :name="opt.icon" :size="14" />
            {{ opt.label }}
          </button>
        </div>

        <AppSelectSearch
          v-if="alcance === 'vehiculo'"
          v-model="idVehiculo"
          placeholder="Selecciona un vehículo..."
          search-placeholder="Buscar por placa..."
          :loading="vehiculosQuery.isLoading.value"
          :options="vehiculoOptions"
          :error="errors.idVehiculo"
        />
        <AppSelectSearch
          v-else-if="alcance === 'sucursal'"
          v-model="idSucursal"
          placeholder="Selecciona un local/sucursal..."
          search-placeholder="Buscar local..."
          :loading="sucursalesQuery.isLoading.value"
          :options="sucursalOptions"
          :error="errors.idSucursal"
        />
        <p v-else class="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.building2" :size="13" class="shrink-0" />
          Aplica a toda la empresa (no se asocia a un vehículo ni a un local puntual).
        </p>
      </section>

      <!-- ============ CARD: Vigencia ============ -->
      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.calendarRange" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Vigencia</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Fechas de emisión y vencimiento</p>
          </div>
        </header>

        <div class="grid gap-3 sm:grid-cols-2">
          <AppDatePicker
            v-model="fechaRenovacion"
            label="Última renovación / emisión"
            optional
            v-bind="fechaRenovacionAttrs"
            :disabled="isSubmitting"
            :error="errors.fechaRenovacion"
          />
          <AppDatePicker
            v-model="fechaVencimiento"
            label="Fecha de vencimiento"
            required
            v-bind="fechaVencimientoAttrs"
            :disabled="isSubmitting"
            :error="errors.fechaVencimiento"
          />
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.messageSquare" :size="16" />
          </span>
          <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Observaciones</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400">Notas, responsable del trámite, entidad emisora</p>
          </div>
        </header>

        <AppTextarea
          v-model="observacion"
          placeholder="Notas, responsable del trámite, entidad emisora..."
          v-bind="observacionAttrs"
          :disabled="isSubmitting"
          :error="errors.observacion"
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
        form="documento-vencimiento-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Guardando...' : mode === 'create' ? 'Registrar documento' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>

  <ListaOpcionFormModal
    v-model="categoriaModalOpen"
    :id-lista="ListaIds.CATEGORIA_VENCIMIENTO"
    title="Nueva categoría de documento"
    subtitle="Quedará disponible para todos los documentos de vencimiento (BPA, salubridad, extintores...)."
    nombre-placeholder="Ej. DEFENSA_CIVIL"
    @saved="onCategoriaCreada"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import {
  useCreateDocumentoVencimientoMutation,
  useUpdateDocumentoVencimientoMutation,
} from '@/modules/documentos-vencimiento/composables/useDocumentoVencimientoMutations'
import { useDocumentoVencimientoDetailQuery } from '@/modules/documentos-vencimiento/composables/useDocumentoVencimientoDetailQuery'
import type {
  AlcanceDocumentoVencimiento,
  DocumentoVencimiento,
  DocumentoVencimientoFormMode,
} from '@/modules/documentos-vencimiento/interfaces/documento-vencimiento.interface'
import { useVehiculosQuery } from '@/modules/vehiculos/composables/useVehiculosQuery'
import type { VehiculoListFilters } from '@/modules/vehiculos/interfaces/vehiculo.interface'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import type { SucursalListFilters } from '@/modules/configuracion/sucursales/interfaces/sucursal.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppDatePicker,
  AppInput,
  AppModal,
  AppSelect,
  AppSelectSearch,
  AppSelectWithCreate,
  AppTextarea,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { optionalString, requiredString } from '@/shared/validation'

const props = defineProps<{
  mode: DocumentoVencimientoFormMode
  documento?: DocumentoVencimiento | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateDocumentoVencimientoMutation()
const updateMutation = useUpdateDocumentoVencimientoMutation()

const idReferencia = computed(() => props.documento?.id)
const detailQuery = useDocumentoVencimientoDetailQuery(idReferencia, open)
const documentoActual = computed<DocumentoVencimiento | null>(
  () => detailQuery.data.value ?? props.documento ?? null,
)

/* ---------- Categoría ---------- */
const listaCategoriaId = ref(ListaIds.CATEGORIA_VENCIMIENTO)
const categoriaQuery = useListaOpcionesQuery(listaCategoriaId)
const categoriaOptions = computed(() => toSelectOptions(categoriaQuery.data.value))
const canCrearCategoria = computed(() =>
  authStore.hasPermission(PermisoBanderas.DOCUMENTOS_VENCIMIENTO_CREAR),
)
const categoriaModalOpen = ref(false)

/* ---------- Alcance: empresa / local / vehículo (mutuamente excluyentes) ---------- */
const alcanceOptions: { value: AlcanceDocumentoVencimiento; label: string; icon: string }[] = [
  { value: 'empresa', label: 'Empresa', icon: ICONS.building2 },
  { value: 'sucursal', label: 'Local', icon: ICONS.warehouse },
  { value: 'vehiculo', label: 'Vehículo', icon: ICONS.truck },
]
const alcance = ref<AlcanceDocumentoVencimiento>('empresa')

const cambiarAlcance = (valor: AlcanceDocumentoVencimiento) => {
  alcance.value = valor
  idVehiculo.value = undefined
  idSucursal.value = undefined
  setFieldError('idVehiculo', undefined)
  setFieldError('idSucursal', undefined)
}

// Mismo endpoint y mismo filtro que "Vehículos" dentro de Configuración
// (VehiculosListView.vue con meta.soloEmpresa): idCliente = -1 es el sentinel de
// "flota propia de la empresa" (id_cliente IS NULL). Acá solo tiene sentido elegir
// vehículos de la empresa — los de clientes no llevan SOAT/permisos que administre Sarita.
const ID_CLIENTE_EMPRESA = -1
const vehiculosFilters = ref<VehiculoListFilters>({
  pagina: 1,
  limite: 200,
  isActivos: 1,
  idCliente: ID_CLIENTE_EMPRESA,
})
const vehiculosQuery = useVehiculosQuery(vehiculosFilters)
const vehiculoOptions = computed(() =>
  (vehiculosQuery.data.value?.data ?? []).map((v) => ({
    value: v.id,
    label: [v.placa, v.marca, v.modelo].filter(Boolean).join(' · '),
  })),
)

const sucursalesFilters = ref<SucursalListFilters>({ pagina: 1, limite: 200 })
const sucursalesQuery = useSucursalesQuery(sucursalesFilters)
const sucursalOptions = computed(() =>
  (sucursalesQuery.data.value?.data ?? []).map((s) => ({ value: s.id, label: s.nombre })),
)

/* ---------- Formulario ---------- */
const { defineField, handleSubmit, resetForm, errors, isSubmitting, setFieldError } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idCategoria: yup.number().optional(),
      descripcion: requiredString('La descripción'),
      idVehiculo: yup.number().optional(),
      idSucursal: yup.number().optional(),
      fechaVencimiento: requiredString('La fecha de vencimiento'),
      fechaRenovacion: optionalString(),
      numeroDocumento: optionalString(),
      observacion: optionalString(),
    }),
  ),
  initialValues: {
    idCategoria: undefined as number | undefined,
    descripcion: '',
    idVehiculo: undefined as number | undefined,
    idSucursal: undefined as number | undefined,
    fechaVencimiento: '',
    fechaRenovacion: '',
    numeroDocumento: '',
    observacion: '',
  },
})

const [idCategoria, idCategoriaAttrs] = defineField('idCategoria')
const [descripcion, descripcionAttrs] = defineField('descripcion')
const [idVehiculo] = defineField('idVehiculo')
const [idSucursal] = defineField('idSucursal')
const [fechaVencimiento, fechaVencimientoAttrs] = defineField('fechaVencimiento')
const [fechaRenovacion, fechaRenovacionAttrs] = defineField('fechaRenovacion')
const [numeroDocumento, numeroDocumentoAttrs] = defineField('numeroDocumento')
const [observacion, observacionAttrs] = defineField('observacion')

const onCategoriaCreada = (opcion: ListaOpcion) => {
  idCategoria.value = opcion.id
}

const syncFormValues = () => {
  const d = documentoActual.value

  resetForm({
    values: {
      idCategoria: d?.id_categoria ?? undefined,
      descripcion: d?.descripcion ?? '',
      idVehiculo: d?.id_vehiculo ?? undefined,
      idSucursal: d?.id_sucursal ?? undefined,
      fechaVencimiento: d?.fecha_vencimiento?.slice(0, 10) ?? '',
      fechaRenovacion: d?.fecha_renovacion?.slice(0, 10) ?? '',
      numeroDocumento: d?.numero_documento ?? '',
      observacion: d?.observacion ?? '',
    },
  })

  alcance.value = d?.id_vehiculo ? 'vehiculo' : d?.id_sucursal ? 'sucursal' : 'empresa'
}

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  if (alcance.value === 'vehiculo' && !idVehiculo.value) {
    setFieldError('idVehiculo', 'Selecciona un vehículo')
    return
  }
  if (alcance.value === 'sucursal' && !idSucursal.value) {
    setFieldError('idSucursal', 'Selecciona un local')
    return
  }

  const payload = {
    idUsuarioAuditoria: currentUserId,
    idCategoria: values.idCategoria ? Number(values.idCategoria) : undefined,
    descripcion: values.descripcion,
    idVehiculo: alcance.value === 'vehiculo' ? Number(idVehiculo.value) : null,
    idSucursal: alcance.value === 'sucursal' ? Number(idSucursal.value) : null,
    fechaVencimiento: values.fechaVencimiento,
    fechaRenovacion: values.fechaRenovacion || undefined,
    numeroDocumento: values.numeroDocumento || undefined,
    observacion: values.observacion || undefined,
  }

  try {
    if (props.mode === 'create') {
      await createMutation.mutateAsync(payload)
    } else if (props.documento) {
      await updateMutation.mutateAsync({ id: props.documento.id, payload })
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
    if (isOpen && props.mode === 'create') {
      void syncFormValues()
    }
  },
  { immediate: true },
)

watch(
  () => detailQuery.data.value,
  (data) => {
    if (open.value && props.mode === 'edit' && data) {
      void syncFormValues()
    }
  },
  { immediate: true },
)

watch(
  () => props.documento,
  () => {
    if (open.value && props.mode === 'edit') {
      void nextTick(syncFormValues)
    }
  },
)
</script>
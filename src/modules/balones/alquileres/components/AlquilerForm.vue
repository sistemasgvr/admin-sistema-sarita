<template>
  <div>
    <div
      v-if="isLoadingAlquiler"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando alquiler...
    </div>

    <div v-else class="space-y-5">
      <form
        id="alquiler-form"
        class="space-y-5"
        autocomplete="off"
        @submit="onSubmit"
      >
        <FormCardsLayout>
          <DetailSectionCard title="Datos generales" :icon="ICONS.clipboardList">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AppInput
                v-model="numeroAlquiler"
                label="Número de alquiler"
                placeholder="Cargando correlativo..."
                :hint="isCreateMode ? 'Correlativo automático' : undefined"
                v-bind="numeroAlquilerAttrs"
                :disabled="isSubmitting || isCreateMode || cargandoNumero"
                :error="errors.numeroAlquiler"
              />

              <AppSelect
                v-model="idEstado"
                label="Estado"
                placeholder="Selecciona estado"
                optional
                v-bind="idEstadoAttrs"
                :disabled="isSubmitting || estadosAlquilerQuery.isFetching.value"
                :options="estadoAlquilerOptions"
              />

              <ClienteSelectField
                v-model="idCliente"
                required
                :disabled="isSubmitting"
                :error="errors.idCliente"
              />

              <AlmacenSelectField
                v-model="idAlmacen"
                required
                :disabled="isSubmitting"
                :error="errors.idAlmacen"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Vigencia" :icon="ICONS.calendar">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <AppInput
                v-model="fechaInicio"
                label="Fecha inicio"
                type="date"
                required
                v-bind="fechaInicioAttrs"
                :disabled="isSubmitting"
                :error="errors.fechaInicio"
              />

              <AppInput
                v-model="fechaFinPactada"
                label="Fin pactado"
                type="date"
                optional
                v-bind="fechaFinPactadaAttrs"
                :disabled="isSubmitting"
              />

              <AppInput
                v-model="fechaFinReal"
                label="Fin real"
                type="date"
                optional
                v-bind="fechaFinRealAttrs"
                :disabled="isSubmitting"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard
            title="Producto y cobro"
            :icon="ICONS.creditCard"
            help="Solo productos alquilables con stock disponible en el almacén seleccionado. Si afecta stock, se descuenta 1 unidad al crear. La garantía/depósito es opcional: se sugiere desde precio_garantia del producto o catálogo; déjala en 0 si no se cobra."
          >
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProductoSelectField
                v-model="idProductoRegulador"
                v-model:search="productoAlquilableBuscar"
                label="Producto alquilable"
                placeholder="Selecciona producto alquilable"
                search-placeholder="Código o nombre..."
                :es-alquilable="true"
                :id-almacen="idAlmacen === '' || idAlmacen == null ? undefined : Number(idAlmacen)"
                :options="productoAlquilableOptions"
                :bloquear-sin-stock="isCreateMode"
                :disabled="isSubmitting || (isCreateMode && !idAlmacen)"
                :required="isCreateMode"
                class="sm:col-span-2"
              />

              <AppInput
                v-if="isCreateMode"
                v-model="montoGarantia"
                label="Garantía / depósito"
                type="number"
                :min="NUMBER_MIN.money"
                :step="NUMBER_STEP.money"
                :disabled="isSubmitting"
              />

              <AppInput
                v-model="tarifaDiaria"
                label="Tarifa periodo"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                v-bind="tarifaDiariaAttrs"
                :disabled="isSubmitting"
                :error="errors.tarifaDiaria"
              />

              <AppInput
                v-model="totalCobrado"
                label="Total cobrado"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                v-bind="totalCobradoAttrs"
                :disabled="isSubmitting"
                :error="errors.totalCobrado"
              />

              <AppInput
                v-model="idComprobanteVenta"
                label="ID comprobante venta"
                type="number"
                min="1"
                step="1"
                optional
                placeholder="Ej. 1250"
                v-bind="idComprobanteVentaAttrs"
                :disabled="isSubmitting"
                class="sm:col-span-2"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Observación" :icon="ICONS.messageSquare" :full-width="true">
            <AppTextarea
              v-model="observacion"
              label="Observación"
              placeholder="Notas adicionales del alquiler"
              optional
              :rows="3"
              v-bind="observacionAttrs"
              :disabled="isSubmitting"
              :error="errors.observacion"
            />
          </DetailSectionCard>
        </FormCardsLayout>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
            :disabled="isSubmitting"
            @click="emit('cancel')"
          >
            {{ activeAlquilerId ? 'Cerrar' : 'Cancelar' }}
          </button>
          <button
            type="submit"
            class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            :disabled="isSubmitting"
          >
            {{
              isSubmitting
                ? 'Guardando...'
                : isCreateMode && !activeAlquilerId
                  ? 'Crear alquiler'
                  : 'Guardar cambios'
            }}
          </button>
        </div>
      </form>

      <DetailSectionCard
        v-if="activeAlquilerId"
        title="Cilindros vinculados (préstamo)"
        :icon="ICONS.boxes"
        :full-width="true"
        help="El alquiler cobra el regulador. Si entregas envase, regístralo aquí solo como vínculo físico; la custodia correcta es préstamo (preferible desde POS / módulo Préstamos)."
      >
        <template #actions>
          <button
            v-if="canCreateDetalle"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-brand-500 px-3 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
            @click="openCreateDetalleModal"
          >
            <AppIcon :name="ICONS.plus" :size="16" />
            Vincular cilindro
          </button>
        </template>

        <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
          {{ detalleRows.length }} cilindro(s) vinculado(s). Preferible usar Préstamos para la custodia del envase.
        </p>

        <AppTable
          bare
          :columns="detalleColumns"
          :rows="detalleRows"
          row-key="id"
          :loading="isLoadingDetalles"
        >
          <template #cell-codigo_balon="{ value }">
            <span class="font-medium text-gray-800 dark:text-white/90">{{ value }}</span>
          </template>

          <template #cell-fecha_devolucion="{ row }">
            <span
              v-if="row.fecha_devolucion"
              class="whitespace-nowrap text-success-600 dark:text-success-400"
            >
              {{ String(row.fecha_devolucion).slice(0, 10) }}
            </span>
            <AppBadge v-else size="sm" color="warning">Pendiente</AppBadge>
          </template>

          <template #actions="{ row }">
            <AppActionMenu
              :items="detalleActionItemsForRow(row)"
              title="Acciones del cilindro"
              :execute="(key) => onDetalleActionSelect(key, row)"
            />
          </template>
        </AppTable>
      </DetailSectionCard>

      <DetailSectionCard
        v-else-if="isCreateMode"
        title="Cilindros vinculados (préstamo)"
        :icon="ICONS.boxes"
        :full-width="true"
        help="Paso 1: crea el alquiler del regulador. El cilindro se presta (módulo Préstamos o POS); aquí solo puedes vincularlo después si hace falta."
      >
        <p class="text-center text-sm text-gray-400 dark:text-gray-500">Sin cilindros vinculados</p>
      </DetailSectionCard>
    </div>

    <AlquilerDetalleFormModal
      v-if="activeAlquilerId"
      v-model="detalleFormOpen"
      :mode="detalleFormMode"
      :alquiler-id="activeAlquilerId"
      :detalle-id="selectedDetalleId"
      @saved="onDetalleSaved"
    />

    <AlquilerDevolverModal
      v-model="devolverDetalleModalOpen"
      :detalle="detalleToDevolver"
      @saved="onDetalleSaved"
    />

    <AppModal
      v-model="deleteDetalleModalOpen"
      title="Eliminar cilindro"
      subtitle="Se dará de baja este cilindro del alquiler."
      size="sm"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Confirmas que deseas eliminar el cilindro
        <span class="font-medium text-gray-800 dark:text-white/90">
          {{ detalleToDelete?.codigo_balon }}
        </span>
        del alquiler?
      </p>

      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="deleteDetalleMutation.isPending.value"
          @click="deleteDetalleModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="deleteDetalleMutation.isPending.value"
          @click="confirmDeleteDetalle"
        >
          {{ deleteDetalleMutation.isPending.value ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import { catalogoPreciosService } from '@/modules/productos/catalogo-precios/services/catalogo-precios.service'
import {
  useCreateAlquilerMutation,
  useUpdateAlquilerMutation,
} from '@/modules/balones/alquileres/composables/useAlquilerMutations'
import { useDeleteAlquilerDetalleMutation } from '@/modules/balones/alquileres/composables/useAlquilerDetalleMutations'
import { useAlquilerQuery } from '@/modules/balones/alquileres/composables/useAlquileresQuery'
import { useAlquileresDetalleQuery } from '@/modules/balones/alquileres/composables/useAlquileresDetalleQuery'
import { alquileresService } from '@/modules/balones/alquileres/services/alquileres.service'
import { garantiasService } from '@/modules/balones/garantias/services/garantias.service'
import AlquilerDetalleFormModal from '@/modules/balones/alquileres/components/AlquilerDetalleFormModal.vue'
import AlquilerDevolverModal from '@/modules/balones/alquileres/components/AlquilerDevolverModal.vue'
import type { AlquilerFormMode } from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import type {
  AlquilerDetalle,
  AlquilerDetalleFormMode,
  AlquilerDetalleListFilters,
} from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppActionMenu,
  AppBadge,
  AppInput,
  AppModal,
  AppSelect,
  AppTable,
  AppTextarea,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { toastApiError, toastWarning } from '@/shared/composables/useToast'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import {
  optionalNumber,
  optionalString,
  requiredSelect,
  requiredString,
} from '@/shared/validation'

export type AlquilerFormSavedPayload = { id: number }

interface AlquilerFormProps {
  mode: AlquilerFormMode
  alquilerId?: number | null
  /** When true, sync/load form. Page: always true. Modal: equals open. */
  active: boolean
}

const props = withDefaults(defineProps<AlquilerFormProps>(), {
  alquilerId: null,
})

const emit = defineEmits<{
  saved: [payload?: AlquilerFormSavedPayload]
  created: [payload: AlquilerFormSavedPayload]
  cancel: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateAlquilerMutation()
const cargandoNumero = ref(false)
const updateMutation = useUpdateAlquilerMutation()
const deleteDetalleMutation = useDeleteAlquilerDetalleMutation()

const internalMode = ref<AlquilerFormMode>(props.mode)
const activeAlquilerId = ref<number | null>(null)

const isCreateMode = computed(() => internalMode.value === 'create' && !activeAlquilerId.value)

const alquilerIdRef = computed(() => activeAlquilerId.value)
const alquilerQuery = useAlquilerQuery(alquilerIdRef)
const isLoadingAlquiler = computed(
  () => !isCreateMode.value && props.active && alquilerQuery.isFetching.value,
)

const detalleFilters = ref<AlquilerDetalleListFilters>({
  idAlquiler: undefined,
  pagina: 1,
  limite: 100,
})
const detallesQuery = useAlquileresDetalleQuery(detalleFilters)
const isLoadingDetalles = computed(
  () => detallesQuery.isFetching.value || detallesQuery.isLoading.value,
)
const detalleRows = computed(() => detallesQuery.data.value?.data ?? [])

const listaEstadoAlquilerId = ref(ListaIds.ESTADO_ALQUILER)
const estadosAlquilerQuery = useListaOpcionesQuery(listaEstadoAlquilerId)

const estadoAlquilerOptions = computed(() => [
  { value: '', label: 'Sin estado' },
  ...toSelectOptions(estadosAlquilerQuery.data.value),
])

const canCreateDetalle = computed(() =>
  authStore.hasPermission(PermisoBanderas.ALQUILERES_DETALLE_CREAR),
)
const canEditDetalle = computed(
  () =>
    authStore.hasPermission(PermisoBanderas.ALQUILERES_DETALLE_EDITAR) ||
    authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_EDITAR),
)
const canDeleteDetalle = computed(() =>
  authStore.hasPermission(PermisoBanderas.ALQUILERES_DETALLE_ELIMINAR),
)

const detalleColumns: TableColumn[] = [
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'fecha_devolucion', label: 'Devolución' },
]

function detalleActionItemsForRow(row: AlquilerDetalle): ActionMenuItem[] {
  const pendiente = !row.fecha_devolucion
  return [
    {
      key: 'devolver',
      label: 'Devolver cilindro',
      icon: ICONS.clipboardCheck,
      hidden: !canEditDetalle.value || !pendiente,
    },
    {
      key: 'edit',
      label: 'Cambiar cilindro',
      icon: ICONS.pencil,
      hidden: !canEditDetalle.value,
    },
    {
      key: 'delete',
      label: 'Quitar del alquiler',
      icon: ICONS.trash,
      danger: true,
      hidden: !canDeleteDetalle.value,
    },
  ]
}

function onDetalleActionSelect(key: string, row: AlquilerDetalle) {
  if (key === 'devolver') openDevolverDetalleModal(row)
  if (key === 'edit') openEditDetalleModal(row)
  if (key === 'delete') openDeleteDetalleModal(row)
}

const detalleFormOpen = ref(false)
const detalleFormMode = ref<AlquilerDetalleFormMode>('create')
const selectedDetalleId = ref<number | null>(null)

const devolverDetalleModalOpen = ref(false)
const detalleToDevolver = ref<AlquilerDetalle | null>(null)

const deleteDetalleModalOpen = ref(false)
const detalleToDelete = ref<AlquilerDetalle | null>(null)

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')

const optionalSelectNumber = () =>
  yup
    .mixed<string | number>()
    .transform((value) => (value === '' ? undefined : value))
    .optional()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      numeroAlquiler: optionalString().max(30, 'Máximo 30 caracteres'),
      idCliente: requiredSelect('El cliente'),
      idAlmacen: requiredSelect('El almacén'),
      fechaInicio: requiredString('La fecha de inicio'),
      fechaFinPactada: optionalString(),
      fechaFinReal: optionalString(),
      tarifaDiaria: optionalNumber().min(0, 'Debe ser mayor o igual a cero'),
      totalCobrado: optionalNumber().min(0, 'Debe ser mayor o igual a cero'),
      idEstado: optionalSelectNumber(),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
      idComprobanteVenta: optionalNumber().min(1, 'ID inválido'),
      idProductoRegulador: optionalSelectNumber(),
    }),
  ),
  initialValues: {
    numeroAlquiler: '',
    idCliente: '' as string | number,
    idAlmacen: '' as string | number,
    fechaInicio: '',
    fechaFinPactada: '',
    fechaFinReal: '',
    tarifaDiaria: undefined as number | undefined,
    totalCobrado: undefined as number | undefined,
    idEstado: '' as string | number,
    observacion: '',
    idComprobanteVenta: undefined as number | undefined,
    idProductoRegulador: '' as string | number,
  },
})

const [numeroAlquiler, numeroAlquilerAttrs] = defineField('numeroAlquiler')
const [idCliente] = defineField('idCliente')
const [idAlmacen] = defineField('idAlmacen')
const [fechaInicio, fechaInicioAttrs] = defineField('fechaInicio')
const [fechaFinPactada, fechaFinPactadaAttrs] = defineField('fechaFinPactada')
const [fechaFinReal, fechaFinRealAttrs] = defineField('fechaFinReal')
const [tarifaDiaria, tarifaDiariaAttrs] = defineField('tarifaDiaria')
const [totalCobrado, totalCobradoAttrs] = defineField('totalCobrado')
const [idEstado, idEstadoAttrs] = defineField('idEstado')
const [observacion, observacionAttrs] = defineField('observacion')
const [idComprobanteVenta, idComprobanteVentaAttrs] = defineField('idComprobanteVenta')
const [idProductoRegulador] = defineField('idProductoRegulador')

const productoAlquilableBuscar = ref('')
const montoGarantia = ref<number | string>(0)

const productoAlquilableOptions = computed(() => {
  const data = alquilerQuery.data.value
  const id = data?.id_producto_regulador ?? data?.id_producto_stock
  const nombre = data?.nombre_producto_regulador ?? data?.nombre_producto_stock
  const codigo = data?.codigo_producto_regulador ?? data?.codigo_producto_stock
  if (!id || !nombre) return []
  return [
    {
      value: id,
      label: `${codigo ? `${codigo} — ` : ''}${nombre}`,
    },
  ]
})

async function prefillMontoGarantia(productoId: number) {
  try {
    const prod = await productosService.obtenerPorId(productoId)
    let sugerido = Number(prod.precio_garantia ?? 0)

    try {
      const catalogo = await catalogoPreciosService.listar({
        idProducto: productoId,
        pagina: 1,
        limite: 5,
      })
      const conGarantia = (catalogo.data ?? []).find(
        (row) => row.precio_garantia != null && Number(row.precio_garantia) > 0,
      )
      if (conGarantia) {
        sugerido = Number(conGarantia.precio_garantia)
      }
    } catch {
      // sin catálogo
    }

    if (tarifaDiaria.value == null || Number(tarifaDiaria.value) === 0) {
      tarifaDiaria.value = Number(prod.precio ?? 0) || undefined
    }

    montoGarantia.value = sugerido
  } catch {
    montoGarantia.value = 0
  }
}

const toOptionalNumber = (value: string | number | undefined) =>
  value !== '' && value != null ? Number(value) : undefined

const buildPayloadFields = (values: {
  numeroAlquiler?: string
  idCliente?: string | number
  idAlmacen?: string | number
  fechaInicio?: string
  fechaFinPactada?: string
  fechaFinReal?: string
  tarifaDiaria?: number
  totalCobrado?: number
  idEstado?: string | number
  observacion?: string
  idComprobanteVenta?: number
  idProductoRegulador?: string | number
}) => ({
  numeroAlquiler: values.numeroAlquiler || undefined,
  idCliente: toOptionalNumber(values.idCliente),
  idAlmacen: toOptionalNumber(values.idAlmacen),
  fechaInicio: values.fechaInicio || undefined,
  fechaFinPactada: values.fechaFinPactada || undefined,
  fechaFinReal: values.fechaFinReal || undefined,
  tarifaDiaria: values.tarifaDiaria,
  totalCobrado: values.totalCobrado,
  idEstado: toOptionalNumber(values.idEstado),
  observacion: values.observacion || undefined,
  idComprobanteVenta: values.idComprobanteVenta ? Number(values.idComprobanteVenta) : undefined,
  idProductoRegulador: toOptionalNumber(values.idProductoRegulador),
})

const syncFormValues = () => {
  const data = alquilerQuery.data.value
  if (!data) return

  resetForm({
    values: {
      numeroAlquiler: data.numero_alquiler ?? '',
      idCliente: data.id_cliente ?? '',
      idAlmacen: data.id_almacen ?? '',
      fechaInicio: toDateInput(data.fecha_inicio),
      fechaFinPactada: toDateInput(data.fecha_fin_pactada),
      fechaFinReal: toDateInput(data.fecha_fin_real),
      tarifaDiaria: data.tarifa_diaria ?? undefined,
      totalCobrado: data.total_cobrado ?? undefined,
      idEstado: data.id_estado ?? '',
      observacion: data.observacion ?? '',
      idComprobanteVenta: data.id_comprobante_venta ?? undefined,
      idProductoRegulador: data.id_producto_regulador ?? data.id_producto_stock ?? '',
    },
  })
}

async function cargarSiguienteNumero() {
  cargandoNumero.value = true
  try {
    const result = await alquileresService.obtenerSiguienteNumero()
    numeroAlquiler.value = result.numero?.trim() || ''
  } catch {
    numeroAlquiler.value = ''
  } finally {
    cargandoNumero.value = false
  }
}

const resetCreateForm = () => {
  resetForm({
    values: {
      numeroAlquiler: '',
      idCliente: '',
      idAlmacen: '',
      fechaInicio: new Date().toISOString().slice(0, 10),
      fechaFinPactada: '',
      fechaFinReal: '',
      tarifaDiaria: undefined,
      totalCobrado: undefined,
      idEstado: '',
      observacion: '',
      idComprobanteVenta: undefined,
      idProductoRegulador: '',
    },
  })
  montoGarantia.value = 0
  void cargarSiguienteNumero()
}

const resetFormState = () => {
  internalMode.value = props.mode
  activeAlquilerId.value = props.mode === 'edit' && props.alquilerId ? props.alquilerId : null
  detalleFilters.value = {
    idAlquiler: activeAlquilerId.value ?? undefined,
    pagina: 1,
    limite: 100,
  }
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  const fields = buildPayloadFields(values)

  try {
    if (isCreateMode.value) {
      const cliente = toOptionalNumber(values.idCliente)
      const almacen = toOptionalNumber(values.idAlmacen)
      const productoId = toOptionalNumber(values.idProductoRegulador)
      if (!cliente || !almacen || !values.fechaInicio) return
      if (!productoId) {
        toastWarning('Selecciona el producto alquilable')
        return
      }

      let idProductoStock: number | undefined
      try {
        const listado = await productosService.listar({
          esAlquilable: true,
          idAlmacen: almacen,
          pagina: 1,
          limite: 200,
          soloActivos: 1,
        })
        const producto =
          (listado.data ?? []).find((item) => item.id === productoId) ??
          (await productosService.obtenerPorId(productoId))

        if (producto.afecta_stock && !producto.es_servicio && !producto.es_gas) {
          if (producto.stock_actual != null && Number(producto.stock_actual) <= 0) {
            toastWarning(`${producto.nombre} no tiene stock disponible en el almacén`)
            return
          }
          idProductoStock = productoId
        }
      } catch {
        // sin detalle de stock: solo registra el producto alquilable
      }

      const created = await createMutation.mutateAsync({
        ...fields,
        idUsuarioAuditoria: currentUserId,
        numeroAlquiler: values.numeroAlquiler?.trim() || undefined,
        idCliente: cliente,
        idAlmacen: almacen,
        fechaInicio: values.fechaInicio,
        idProductoRegulador: productoId,
        idProductoStock,
      })

      const garantia = Math.max(0, Number(montoGarantia.value || 0))
      if (garantia > 0) {
        try {
          await garantiasService.crear({
            idUsuarioAuditoria: currentUserId,
            idCliente: cliente,
            monto: garantia,
            idAlquiler: created.id,
            idProducto: productoId,
            idComprobante: values.idComprobanteVenta
              ? Number(values.idComprobanteVenta)
              : undefined,
            fechaRegistro: values.fechaInicio,
            observacion: `Garantía alquiler ${created.numero_alquiler || created.id}`,
          })
        } catch (error) {
          toastApiError(
            error,
            'Alquiler creado, pero falló el registro de la garantía',
          )
        }
      }

      activeAlquilerId.value = created.id
      internalMode.value = 'edit'
      detalleFilters.value = {
        idAlquiler: created.id,
        pagina: 1,
        limite: 100,
      }
      const payload: AlquilerFormSavedPayload = { id: created.id }
      emit('created', payload)
      emit('saved', payload)
    } else if (activeAlquilerId.value) {
      await updateMutation.mutateAsync({
        id: activeAlquilerId.value,
        payload: {
          idUsuarioAuditoria: currentUserId,
          ...fields,
        },
      })
      emit('saved', { id: activeAlquilerId.value })
    } else {
      return
    }
  } catch {
    // toast en mutation
  }
})

const openCreateDetalleModal = () => {
  detalleFormMode.value = 'create'
  selectedDetalleId.value = null
  detalleFormOpen.value = true
}

const openEditDetalleModal = (row: AlquilerDetalle) => {
  detalleFormMode.value = 'edit'
  selectedDetalleId.value = row.id
  detalleFormOpen.value = true
}

const openDevolverDetalleModal = (row: AlquilerDetalle) => {
  detalleToDevolver.value = {
    ...row,
    id_almacen: row.id_almacen ?? (idAlmacen.value ? Number(idAlmacen.value) : null),
  }
  devolverDetalleModalOpen.value = true
}

const openDeleteDetalleModal = (row: AlquilerDetalle) => {
  detalleToDelete.value = row
  deleteDetalleModalOpen.value = true
}

const onDetalleSaved = () => {
  detallesQuery.refetch()
  alquilerQuery.refetch()
  if (activeAlquilerId.value) {
    emit('saved', { id: activeAlquilerId.value })
  } else {
    emit('saved')
  }
}

const confirmDeleteDetalle = async () => {
  const detalle = detalleToDelete.value
  const userId = authStore.user?.id
  if (!detalle || !userId) return

  try {
    await deleteDetalleMutation.mutateAsync({
      id: detalle.id,
      idUsuarioAuditoria: userId,
    })
    deleteDetalleModalOpen.value = false
    detalleToDelete.value = null
    onDetalleSaved()
  } catch {
    // toast en mutation
  }
}

watch(
  () => [props.active, props.mode, props.alquilerId] as const,
  ([isActive, mode, alquilerId]) => {
    if (!isActive) return

    // After create→edit (FormView replace), keep current form/detalle state.
    if (
      mode === 'edit' &&
      alquilerId &&
      activeAlquilerId.value === alquilerId &&
      internalMode.value === 'edit'
    ) {
      detalleFilters.value = {
        idAlquiler: alquilerId,
        pagina: 1,
        limite: 100,
      }
      return
    }

    resetFormState()
    if (mode === 'edit' && alquilerId) {
      syncFormValues()
    } else {
      resetCreateForm()
    }
  },
  { immediate: true },
)

watch(
  () => alquilerQuery.data.value,
  () => {
    if (props.active && activeAlquilerId.value) {
      syncFormValues()
    }
  },
)

watch(idProductoRegulador, (value) => {
  if (!isCreateMode.value) return
  const id = Number(value)
  if (!id) {
    montoGarantia.value = 0
    return
  }
  void prefillMontoGarantia(id)
})

watch(idAlmacen, (nuevo, anterior) => {
  if (!isCreateMode.value) return
  if (nuevo === anterior) return
  idProductoRegulador.value = ''
  montoGarantia.value = 0
})
</script>

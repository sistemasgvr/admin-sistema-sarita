<template>
  <div>
    <div
      v-if="isLoadingMovimiento"
      class="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
    >
      Cargando movimiento...
    </div>

    <form
      v-else
      id="movimiento-inventario-form"
      class="space-y-5"
      autocomplete="off"
      @submit="onSubmit"
    >
      <FormCardsLayout>
        <DetailSectionCard
          title="Datos"
          :icon="ICONS.arrowLeftRight"
          :help="cardHelp"
        >
          <div
            v-if="mode === 'edit' && movimiento"
            class="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-800 dark:bg-white/[0.03] sm:grid-cols-3"
          >
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ formatListaOpcionLabel(movimiento.nombre_tipo_movimiento) }}
              · {{ formatCantidad(movimiento.cantidad) }}
            </p>
            <p class="text-gray-600 dark:text-gray-400">
              {{ movimiento.codigo_producto }} — {{ movimiento.nombre_producto }}
            </p>
            <p class="text-gray-500 dark:text-gray-400">
              {{ movimiento.nombre_almacen }}
            </p>
          </div>

          <div class="grid grid-cols-1 !gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AppInput
              v-model="fecha"
              label="Fecha"
              type="date"
              required
              v-bind="fechaAttrs"
              :disabled="isSubmitting"
              :error="errors.fecha"
            />

            <template v-if="mode === 'create'">
              <AlmacenSelectField
                v-model="idAlmacen"
                :label="esTraslado ? 'Almacén origen' : 'Almacén'"
                required
                :disabled="isSubmitting"
                :error="errors.idAlmacen"
              />

              <AlmacenSelectField
                v-if="esTraslado"
                v-model="idAlmacenDestino"
                label="Almacén destino"
                required
                :disabled="isSubmitting"
                :error="errors.idAlmacenDestino"
              />

              <AppSelect
                v-model="idTipoMovimiento"
                label="Tipo de movimiento"
                placeholder="Selecciona tipo"
                required
                v-bind="idTipoMovimientoAttrs"
                :disabled="
                  isSubmitting ||
                  tiposMovimientoQuery.isFetching.value ||
                  tipoMovimientoSelectLocked
                "
                :error="errors.idTipoMovimiento"
                :options="tipoMovimientoOptions"
              />

              <AppFormField
                v-if="esAjuste"
                label="Sentido del ajuste"
                required
                :help="helpSentidoAjuste"
                :error="errors.sentidoAjuste"
              >
                <div
                  class="inline-flex w-full rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800"
                  role="radiogroup"
                  aria-label="Sentido del ajuste"
                >
                  <button
                    v-for="opt in sentidoAjusteOptions"
                    :key="opt.value"
                    type="button"
                    role="radio"
                    :aria-checked="sentidoAjuste === opt.value"
                    :disabled="isSubmitting"
                    :class="[
                      'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-medium transition',
                      sentidoAjuste === opt.value
                        ? 'bg-white text-brand-600 shadow-theme-xs dark:bg-gray-900 dark:text-brand-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                    ]"
                    @click="sentidoAjuste = opt.value"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </AppFormField>

              <template v-if="!esTraslado">
                <ProductoSelectField
                  v-model="idProducto"
                  v-model:search="productoBuscar"
                  label="Producto"
                  placeholder="Selecciona un accesorio con stock"
                  :afecta-stock="true"
                  :es-servicio="false"
                  :es-gas="false"
                  required
                  class="lg:col-span-2"
                  :disabled="isSubmitting"
                  :error="errors.idProducto"
                  help="Solo accesorios. El gas se controla en Balones / Stock de gas."
                />

                <AppInput
                  v-model="cantidad"
                  label="Cantidad"
                  type="number"
                  :min="minCantidad"
                  :max="maxCantidadAjuste"
                  :step="stepCantidad"
                  required
                  v-bind="cantidadAttrs"
                  :disabled="isSubmitting"
                  :error="errors.cantidad"
                  :help="helpCantidadAjuste"
                />
              </template>
            </template>

            <AppSelect
              v-model="idTipoDocumentoRef"
              label="Documento origen"
              placeholder="Opcional"
              optional
              :help="helpDocumentoOrigen"
              v-bind="idTipoDocumentoRefAttrs"
              :disabled="isSubmitting || tiposDocumentoQuery.isFetching.value"
              :options="tipoDocumentoOptions"
            />

            <AppInput
              v-model="idDocumentoRef"
              label="ID documento ref."
              type="number"
              min="1"
              step="1"
              optional
              placeholder="Opcional"
              v-bind="idDocumentoRefAttrs"
              :disabled="isSubmitting"
            />

            <AppInput
              v-model="glosa"
              label="Glosa"
              placeholder="Detalle del movimiento"
              optional
              class="sm:col-span-2 lg:col-span-1"
              v-bind="glosaAttrs"
              :disabled="isSubmitting"
              :help="helpGlosa"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="mode === 'create' && esTraslado"
          title="Productos a trasladar"
          :icon="ICONS.boxes"
          :full-width="true"
          help="Agrega uno o más productos (mínimo una línea). Cada producto solo una vez. Cantidad mayor a cero y no mayor al stock del almacén origen."
        >
          <template #actions>
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ trasladoLineas.length }}
              {{ trasladoLineas.length === 1 ? 'línea' : 'líneas' }}
            </span>
          </template>

          <div class="mb-3 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
              :disabled="isSubmitting"
              @click="agregarTrasladoLinea"
            >
              <AppIcon :name="ICONS.plus" :size="16" />
              Agregar producto
            </button>
          </div>

          <div
            class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
          >
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th class="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300">
                      Producto
                    </th>
                    <th
                      class="w-40 px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300"
                    >
                      Cantidad
                    </th>
                    <th class="w-12 px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(lin, index) in trasladoLineas"
                    :key="lin.key"
                    class="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td class="px-3 py-2.5 align-top">
                      <ProductoSelectField
                        :model-value="lin.idProducto"
                        :search="lin.productoBuscar"
                        label=""
                        placeholder="Selecciona producto"
                        :afecta-stock="true"
                        :es-servicio="false"
                        :es-gas="false"
                        required
                        :disabled="isSubmitting"
                        :error="lin.errorProducto"
                        @update:model-value="(v) => onTrasladoProductoChange(index, v)"
                        @update:search="(v) => (lin.productoBuscar = v)"
                      />
                    </td>
                    <td class="px-3 py-2.5 align-top">
                      <AppInput
                        :model-value="lin.cantidad"
                        type="number"
                        min="0.0001"
                        :max="maxCantidadTrasladoLinea(lin)"
                        step="any"
                        required
                        :disabled="
                          isSubmitting ||
                          !tieneAlmacenOrigen ||
                          !lin.idProducto
                        "
                        :error="lin.errorCantidad"
                        :help="helpCantidadTrasladoLinea(lin)"
                        @update:model-value="(v) => onTrasladoCantidadInput(index, v)"
                      />
                    </td>
                    <td class="px-2 py-2.5 text-center align-top">
                      <button
                        type="button"
                        title="Quitar producto"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-500 disabled:opacity-40 dark:hover:bg-error-500/10"
                        :disabled="isSubmitting || trasladoLineas.length <= 1"
                        @click="quitarTrasladoLinea(index)"
                      >
                        <AppIcon :name="ICONS.trash" :size="15" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p
            v-if="trasladoLineasError"
            class="mt-2 text-theme-xs text-error-500"
          >
            {{ trasladoLineasError }}
          </p>
        </DetailSectionCard>
      </FormCardsLayout>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          :disabled="isSubmitting"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="isSubmitting"
        >
          {{ submitLabel }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import {
  useCreateMovimientoInventarioMutation,
  useCreateTrasladoLoteMutation,
  useUpdateMovimientoInventarioMutation,
} from '@/modules/productos/movimientos/composables/useMovimientoInventarioMutations'
import { useMovimientoInventarioQuery } from '@/modules/productos/movimientos/composables/useMovimientosInventarioQuery'
import type {
  MovimientoInventarioFormMode,
  SentidoAjuste,
} from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'
import { useStockQuery } from '@/modules/productos/stock/composables/useStockQuery'
import type { StockListFilters } from '@/modules/productos/stock/interfaces/stock.interface'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppFormField, AppInput, AppSelect } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { toastWarning } from '@/shared/composables/useToast'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import {
  formatCantidadPorUnidad,
  MSG_CANTIDAD_UNID_ENTERA,
  minCantidadPorUnidad,
  stepInputCantidadPorUnidad,
  unidadRequiereCantidadEntera,
} from '@/shared/utils/unidadMedidaCantidad'
import {
  optionalNumber,
  optionalString,
  requiredSelect,
  requiredString,
} from '@/shared/validation'

type TipoMovimientoManual = 'AJUSTE' | 'TRASLADO'

interface TrasladoLineaForm {
  key: string
  idProducto: string | number
  cantidad: number | undefined
  productoBuscar: string
  errorProducto?: string
  errorCantidad?: string
}

interface MovimientoInventarioFormProps {
  mode: MovimientoInventarioFormMode
  movimientoId?: number | null
  active?: boolean
  /** Prefill desde query (ej. Stock / Registrar movimiento) */
  initialIdProducto?: number | null
  initialIdAlmacen?: number | null
  /** Prefill tipo desde query (`AJUSTE` | `TRASLADO`) */
  initialTipoNombre?: TipoMovimientoManual | null
}

const props = withDefaults(defineProps<MovimientoInventarioFormProps>(), {
  movimientoId: null,
  active: true,
  initialIdProducto: null,
  initialIdAlmacen: null,
  initialTipoNombre: null,
})

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const listaTipoMovId = ref(ListaIds.TIPO_MOV_INV)
const listaTipoDocId = ref(ListaIds.TIPO_DOCUMENTO_REF)
const tiposMovimientoQuery = useListaOpcionesQuery(listaTipoMovId)
const tiposDocumentoQuery = useListaOpcionesQuery(listaTipoDocId)

const createMutation = useCreateMovimientoInventarioMutation()
const createTrasladoLoteMutation = useCreateTrasladoLoteMutation()
const updateMutation = useUpdateMovimientoInventarioMutation()

const movimientoIdRef = computed(() => props.movimientoId)
const editEnabled = computed(() => props.active && props.mode === 'edit' && !!props.movimientoId)
const movimientoQuery = useMovimientoInventarioQuery(movimientoIdRef, editEnabled)
const movimiento = computed(() => movimientoQuery.data.value ?? null)
const isLoadingMovimiento = computed(
  () => props.mode === 'edit' && movimientoQuery.isLoading.value,
)

const productoBuscar = ref('')
const nombreUnidadMedida = ref<string | null>(null)
const esGasProducto = ref(false)
const trasladoLineas = reactive<TrasladoLineaForm[]>([])
const trasladoLineasError = ref('')
let lineaKeySeq = 0

const sentidoAjusteOptions: { value: SentidoAjuste; label: string }[] = [
  { value: 'MAS', label: 'Sumar stock (más)' },
  { value: 'MENOS', label: 'Restar stock (menos)' },
]

/** Tipos que el usuario puede crear a mano (ingresos→Compras, salidas→Ventas). */
function normalizeTipoNombre(nombre: string): string {
  return String(nombre ?? '')
    .trim()
    .toUpperCase()
}

function canonicoTipoManual(nombre: string): TipoMovimientoManual | null {
  const n = normalizeTipoNombre(nombre)
  if (n === 'AJUSTE' || n === 'AJUSTE DE STOCK') return 'AJUSTE'
  // Código actual detecta traslados por nombre TRASLADO; TRASPASO es alias opcional.
  if (n === 'TRASLADO' || n === 'TRASPASO') return 'TRASLADO'
  return null
}

function esTipoManualPermitido(nombre: string): boolean {
  return canonicoTipoManual(nombre) != null
}

const tiposMovimientoManuales = computed(
  () => (tiposMovimientoQuery.data.value ?? []).filter((item) => esTipoManualPermitido(item.nombre)),
)

const tipoMovimientoOptions = computed(() =>
  props.mode === 'create'
    ? toSelectOptions(tiposMovimientoManuales.value)
    : toSelectOptions(tiposMovimientoQuery.data.value),
)

const tipoDocumentoOptions = computed(() => [
  { value: '', label: 'Sin documento' },
  ...(tiposDocumentoQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: opcion.nombre,
  })),
])

const today = () => new Date().toISOString().slice(0, 10)

const formatCantidad = (value: unknown) =>
  formatCantidadPorUnidad(value, nombreUnidadMedida.value, esGasProducto.value)

const stepCantidad = computed(() =>
  stepInputCantidadPorUnidad(nombreUnidadMedida.value, esGasProducto.value),
)
const minCantidad = computed(() =>
  minCantidadPorUnidad(nombreUnidadMedida.value, esGasProducto.value),
)

const cardHelp = computed(() => {
  if (props.mode === 'edit') {
    return 'Almacén, producto, tipo y cantidad no se modifican. Solo fecha, documento de referencia y glosa.'
  }
  if (esTraslado.value) {
    return 'Traslado entre almacenes: resta en origen y suma en destino. Puedes incluir varios productos en un solo registro.'
  }
  if (esAjuste.value) {
    return 'Ajuste de stock: indica si sumas o restas cantidad al saldo actual. Los ingresos se registran en Compras y las salidas en Ventas.'
  }
  return 'Ajuste o traslado de stock. Los ingresos se registran en Compras y las salidas en Ventas.'
})

const helpDocumentoOrigen =
  'Opcional. Vincula el movimiento a un documento de origen si aplica.'

function resolveIdTipoPorNombreCanonico(
  tipo: TipoMovimientoManual | null | undefined,
): number | '' {
  if (!tipo) return ''
  const match = tiposMovimientoManuales.value.find(
    (item) => canonicoTipoManual(item.nombre) === tipo,
  )
  return match?.id ?? ''
}

const tipoMovimientoSelectLocked = computed(
  () =>
    props.mode === 'create' &&
    props.initialTipoNombre != null &&
    resolveIdTipoPorNombreCanonico(props.initialTipoNombre) !== '',
)

function esTipoTraslado(idTipo: unknown) {
  const id = Number(idTipo)
  if (!Number.isFinite(id) || id <= 0) return false
  const opcion = tiposMovimientoQuery.data.value?.find((item) => item.id === id)
  return canonicoTipoManual(opcion?.nombre ?? '') === 'TRASLADO'
}

function esTipoAjuste(idTipo: unknown) {
  const id = Number(idTipo)
  if (!Number.isFinite(id) || id <= 0) return false
  const opcion = tiposMovimientoQuery.data.value?.find((item) => item.id === id)
  return canonicoTipoManual(opcion?.nombre ?? '') === 'AJUSTE'
}

function crearTrasladoLinea(
  partial?: Partial<Pick<TrasladoLineaForm, 'idProducto' | 'cantidad'>>,
): TrasladoLineaForm {
  lineaKeySeq += 1
  return {
    key: `tl-${lineaKeySeq}`,
    idProducto: partial?.idProducto ?? '',
    cantidad: partial?.cantidad,
    productoBuscar: '',
  }
}

function resetTrasladoLineas(prefillProducto?: number | null) {
  trasladoLineas.splice(0, trasladoLineas.length)
  trasladoLineasError.value = ''
  trasladoLineas.push(
    crearTrasladoLinea({
      idProducto: prefillProducto && prefillProducto > 0 ? prefillProducto : '',
    }),
  )
}

function agregarTrasladoLinea() {
  trasladoLineas.push(crearTrasladoLinea())
  trasladoLineasError.value = ''
}

function quitarTrasladoLinea(index: number) {
  if (trasladoLineas.length <= 1) return
  trasladoLineas.splice(index, 1)
  trasladoLineasError.value = ''
}

function onTrasladoProductoChange(index: number, value: string | number | null | undefined) {
  const lin = trasladoLineas[index]
  if (!lin) return
  const next = value ?? ''
  const id = Number(next)
  if (Number.isFinite(id) && id > 0) {
    const dup = trasladoLineas.some(
      (other, i) => i !== index && Number(other.idProducto) === id,
    )
    if (dup) {
      lin.idProducto = ''
      lin.errorProducto = 'Este producto ya está en el traslado'
      toastWarning('No puedes repetir el mismo producto en el traslado')
      return
    }
  }
  lin.idProducto = next
  lin.errorProducto = undefined
  lin.errorCantidad = undefined
  const stock = stockDisponibleEnAlmacen(next)
  if (stock != null && lin.cantidad != null && Number(lin.cantidad) > stock) {
    lin.cantidad = stock > 0 ? stock : undefined
  }
  trasladoLineasError.value = ''
}

function onTrasladoCantidadInput(index: number, value: string | number | null | undefined) {
  const lin = trasladoLineas[index]
  if (!lin) return
  if (value === '' || value == null) {
    lin.cantidad = undefined
    lin.errorCantidad = undefined
    return
  }
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) {
    lin.cantidad = undefined
    return
  }
  const stock = stockDisponibleEnAlmacen(lin.idProducto)
  if (stock != null && n > stock) {
    lin.cantidad = stock > 0 ? stock : undefined
    lin.errorCantidad =
      stock <= 0 ? 'Sin stock en el almacén origen' : undefined
    return
  }
  lin.cantidad = n
  lin.errorCantidad = undefined
}

function validarTrasladoLineas(): boolean {
  let ok = true
  trasladoLineasError.value = ''
  const seen = new Set<number>()

  if (!tieneAlmacenOrigen.value) {
    trasladoLineasError.value = 'Selecciona el almacén origen'
    toastWarning('Selecciona el almacén origen para validar el stock')
    return false
  }

  if (stockAlmacenQuery.isFetching.value || !stockAlmacenQuery.isFetched.value) {
    trasladoLineasError.value = 'Cargando stock del almacén origen...'
    toastWarning('Espera a que cargue el stock del almacén origen')
    return false
  }

  for (const lin of trasladoLineas) {
    lin.errorProducto = undefined
    lin.errorCantidad = undefined

    const id = Number(lin.idProducto)
    if (!Number.isFinite(id) || id <= 0) {
      lin.errorProducto = 'Selecciona un producto'
      ok = false
    } else if (seen.has(id)) {
      lin.errorProducto = 'Producto duplicado'
      ok = false
    } else {
      seen.add(id)
    }

    const cant =
      lin.cantidad == null || (lin.cantidad as unknown) === ''
        ? NaN
        : Number(lin.cantidad)
    if (!Number.isFinite(cant) || cant <= 0) {
      lin.errorCantidad = 'Debe ser mayor a cero'
      ok = false
      continue
    }

    const stock = stockDisponibleEnAlmacen(id)
    if (stock != null && cant > stock) {
      const info = stockPorProducto.value.get(id)
      const formateado = formatCantidadPorUnidad(
        stock,
        info?.unidad ?? null,
        info?.esGas ?? false,
      )
      lin.errorCantidad =
        stock <= 0
          ? 'Sin stock en el almacén origen'
          : `Máximo disponible: ${formateado}`
      ok = false
    }
  }

  if (!ok) {
    trasladoLineasError.value = 'Revisa las líneas del traslado'
    toastWarning('Revisa productos y cantidades del traslado')
  }
  return ok
}

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      fecha: requiredString('La fecha'),
      idAlmacen: requiredSelect('El almacén'),
      idAlmacenDestino: yup.mixed<string | number>().when('idTipoMovimiento', {
        is: (idTipo: unknown) => esTipoTraslado(idTipo),
        then: (schema) =>
          schema
            .transform((value) => (value === '' ? undefined : value))
            .required('El almacén de destino es obligatorio')
            .test(
              'distinto',
              'El destino debe ser distinto al origen',
              function (value) {
                return Number(value) !== Number(this.parent.idAlmacen)
              },
            ),
        otherwise: (schema) => schema.optional(),
      }),
      idProducto: yup.mixed<string | number>().when('idTipoMovimiento', {
        is: (idTipo: unknown) => !esTipoTraslado(idTipo),
        then: () => requiredSelect('El producto'),
        otherwise: (schema) => schema.optional(),
      }),
      idTipoMovimiento: requiredSelect('El tipo de movimiento'),
      sentidoAjuste: yup
        .mixed<SentidoAjuste>()
        .when('idTipoMovimiento', {
          is: (idTipo: unknown) => esTipoAjuste(idTipo),
          then: (schema) =>
            schema
              .oneOf(['MAS', 'MENOS'], 'Selecciona el sentido del ajuste')
              .required('El sentido del ajuste es obligatorio'),
          otherwise: (schema) => schema.optional(),
        }),
      cantidad: yup
        .number()
        .transform((_value, originalValue) => {
          if (originalValue === '' || originalValue == null) return undefined
          const n = typeof originalValue === 'number' ? originalValue : Number(originalValue)
          return Number.isFinite(n) ? n : undefined
        })
        .when('idTipoMovimiento', {
          is: (idTipo: unknown) => !esTipoTraslado(idTipo),
          then: (schema) =>
            schema
              .typeError('La cantidad debe ser un número')
              .required('La cantidad es obligatoria')
              .moreThan(0, 'La cantidad debe ser mayor a cero')
              .test('unidad-entera', MSG_CANTIDAD_UNID_ENTERA, function (value) {
                if (value == null || !Number.isFinite(value)) return true
                if (!unidadRequiereCantidadEntera(nombreUnidadMedida.value, esGasProducto.value)) {
                  return true
                }
                return Math.abs(value - Math.round(value)) < 1e-9
                  ? true
                  : this.createError({ message: MSG_CANTIDAD_UNID_ENTERA })
              })
              .test('stock-ajuste-menos', 'No puede dejar el stock en negativo', function (value) {
                if (value == null || !Number.isFinite(value)) return true
                if (!esTipoAjuste(this.parent.idTipoMovimiento)) return true
                if (this.parent.sentidoAjuste !== 'MENOS') return true
                const stock = stockDisponibleEnAlmacen(this.parent.idProducto)
                if (stock == null) return true
                if (value <= stock) return true
                const info = stockPorProducto.value.get(Number(this.parent.idProducto))
                const formateado = formatCantidadPorUnidad(
                  stock,
                  info?.unidad ?? null,
                  info?.esGas ?? false,
                )
                return this.createError({
                  message:
                    stock <= 0
                      ? 'Sin stock en el almacén'
                      : `Máximo a restar: ${formateado}`,
                })
              }),
          otherwise: (schema) => schema.optional().nullable(),
        }),
      idTipoDocumentoRef: yup
        .mixed<string | number>()
        .transform((value) => (value === '' ? undefined : value))
        .optional(),
      idDocumentoRef: optionalNumber().min(1, 'ID inválido'),
      glosa: optionalString(),
    }),
  ),
  initialValues: {
    fecha: today(),
    idAlmacen: '' as string | number,
    idAlmacenDestino: '' as string | number,
    idProducto: '' as string | number,
    idTipoMovimiento: '' as string | number,
    sentidoAjuste: 'MAS' as SentidoAjuste,
    cantidad: undefined as number | undefined,
    idTipoDocumentoRef: '' as string | number,
    idDocumentoRef: undefined as number | undefined,
    glosa: '',
  },
})

const [fecha, fechaAttrs] = defineField('fecha')
const [idAlmacen] = defineField('idAlmacen')
const [idAlmacenDestino] = defineField('idAlmacenDestino')
const [idProducto] = defineField('idProducto')
const [idTipoMovimiento, idTipoMovimientoAttrs] = defineField('idTipoMovimiento')
const [sentidoAjuste] = defineField('sentidoAjuste')
const [cantidad, cantidadAttrs] = defineField('cantidad')
const [idTipoDocumentoRef, idTipoDocumentoRefAttrs] = defineField('idTipoDocumentoRef')
const [idDocumentoRef, idDocumentoRefAttrs] = defineField('idDocumentoRef')
const [glosa, glosaAttrs] = defineField('glosa')

const esTraslado = computed(() => esTipoTraslado(idTipoMovimiento.value))
const esAjuste = computed(() => esTipoAjuste(idTipoMovimiento.value))

const tieneAlmacenOrigen = computed(() => {
  const id = Number(idAlmacen.value)
  return Number.isFinite(id) && id > 0
})

const stockAlmacenFilters = computed<StockListFilters>(() => ({
  idAlmacen: tieneAlmacenOrigen.value ? Number(idAlmacen.value) : undefined,
  pagina: 1,
  limite: 500,
  soloActivos: 1,
}))

const stockAlmacenQuery = useStockQuery(
  stockAlmacenFilters,
  () =>
    props.mode === 'create' &&
    tieneAlmacenOrigen.value &&
    (esTraslado.value || esAjuste.value),
)

/** stock disponible en el almacén seleccionado por id_producto */
const stockPorProducto = computed(() => {
  const map = new Map<number, { stock: number; unidad: string | null; esGas: boolean }>()
  for (const row of stockAlmacenQuery.data.value?.data ?? []) {
    map.set(Number(row.id_producto), {
      stock: Number(row.stock) || 0,
      unidad: row.nombre_unidad_medida ?? null,
      esGas: Boolean(row.es_gas),
    })
  }
  return map
})

function stockDisponibleEnAlmacen(
  idProductoValue: string | number | null | undefined,
): number | null {
  if (!tieneAlmacenOrigen.value) return null
  const id = Number(idProductoValue)
  if (!Number.isFinite(id) || id <= 0) return null
  const info = stockPorProducto.value.get(id)
  if (!info) {
    if (stockAlmacenQuery.isFetched.value) return 0
    return null
  }
  return info.stock
}

function maxCantidadTrasladoLinea(lin: TrasladoLineaForm): number | undefined {
  const stock = stockDisponibleEnAlmacen(lin.idProducto)
  if (stock == null) return undefined
  return stock > 0 ? stock : 0
}

function helpCantidadTrasladoLinea(lin: TrasladoLineaForm): string | undefined {
  if (!tieneAlmacenOrigen.value) {
    return 'Selecciona el almacén origen. La cantidad no puede superar el stock disponible.'
  }
  const id = Number(lin.idProducto)
  if (!Number.isFinite(id) || id <= 0) {
    return 'Selecciona un producto. La cantidad no puede superar el stock en origen.'
  }
  if (stockAlmacenQuery.isFetching.value && !stockAlmacenQuery.data.value) {
    return 'Consultando stock del almacén origen...'
  }
  const info = stockPorProducto.value.get(id)
  const stock = stockDisponibleEnAlmacen(id)
  if (stock == null) return undefined
  const formateado = formatCantidadPorUnidad(
    stock,
    info?.unidad ?? null,
    info?.esGas ?? false,
  )
  if (stock <= 0) return `Sin stock en origen (${formateado}). No se puede trasladar.`
  return `Disponible en origen: ${formateado}. No puedes superar esa cantidad.`
}

const stockDisponibleAjuste = computed(() => stockDisponibleEnAlmacen(idProducto.value))

const maxCantidadAjuste = computed(() => {
  if (!esAjuste.value || sentidoAjuste.value !== 'MENOS') return undefined
  const stock = stockDisponibleAjuste.value
  if (stock == null) return undefined
  return stock > 0 ? stock : 0
})

const helpSentidoAjuste = computed(() =>
  sentidoAjuste.value === 'MENOS'
    ? 'Disminuye el saldo actual. No puede dejar el stock en negativo.'
    : 'Aumenta el saldo actual del producto en el almacén.',
)

const helpCantidadAjuste = computed(() => {
  const partes: string[] = []
  if (unidadRequiereCantidadEntera(nombreUnidadMedida.value, esGasProducto.value)) {
    partes.push('UNID / piezas: solo números enteros.')
  }
  if (esAjuste.value && sentidoAjuste.value === 'MENOS') {
    const stock = stockDisponibleAjuste.value
    if (stock != null) {
      const info = stockPorProducto.value.get(Number(idProducto.value))
      const formateado = formatCantidadPorUnidad(
        stock,
        info?.unidad ?? nombreUnidadMedida.value,
        info?.esGas ?? esGasProducto.value,
      )
      partes.push(
        stock <= 0
          ? `Sin stock en el almacén (${formateado}).`
          : `Disponible: ${formateado}. No puedes restar más.`,
      )
    } else {
      partes.push('Se restará del saldo actual; no puede quedar negativo.')
    }
  } else if (esAjuste.value) {
    partes.push('Se sumará esta cantidad al saldo actual.')
  }
  return partes.length ? partes.join(' ') : undefined
})

const helpGlosa = computed(() => {
  if (props.mode !== 'create') return undefined
  if (esAjuste.value) {
    return sentidoAjuste.value === 'MENOS'
      ? 'Opcional. Ej.: ajuste por merma / conteo físico.'
      : 'Opcional. Ej.: ajuste por sobrante / conteo físico.'
  }
  if (esTraslado.value) {
    return 'Opcional. Aplica a todas las líneas del traslado.'
  }
  return undefined
})

const submitLabel = computed(() => {
  if (isSubmitting.value) return 'Guardando...'
  if (props.mode === 'edit') return 'Guardar cambios'
  if (esAjuste.value) return 'Registrar ajuste'
  if (esTraslado.value) return 'Registrar traslado'
  return 'Registrar movimiento'
})

watch(
  () => [props.active, props.mode, idProducto.value] as const,
  async ([active, mode, productoId]) => {
    if (!active || mode !== 'create' || esTraslado.value) return
    const id = Number(productoId)
    if (!Number.isFinite(id) || id <= 0) {
      nombreUnidadMedida.value = null
      esGasProducto.value = false
      return
    }
    try {
      const producto = await productosService.obtenerPorId(id)
      nombreUnidadMedida.value = producto.nombre_unidad_medida ?? null
      esGasProducto.value = Boolean(producto.es_gas)
    } catch {
      nombreUnidadMedida.value = null
      esGasProducto.value = false
    }
  },
)

watch(esTraslado, (traslado, wasTraslado) => {
  if (props.mode !== 'create' || !props.active) return
  if (traslado && !wasTraslado) {
    resetTrasladoLineas(props.initialIdProducto)
  }
})

watch(
  () => [idAlmacen.value, stockPorProducto.value] as const,
  () => {
    if (props.mode !== 'create' || !esTraslado.value) return
    for (const lin of trasladoLineas) {
      const stock = stockDisponibleEnAlmacen(lin.idProducto)
      if (stock == null || lin.cantidad == null) continue
      if (Number(lin.cantidad) > stock) {
        lin.cantidad = stock > 0 ? stock : undefined
        lin.errorCantidad =
          stock <= 0 ? 'Sin stock en el almacén origen' : undefined
      }
    }
  },
)

watch(
  () =>
    [
      cantidad.value,
      sentidoAjuste.value,
      stockDisponibleAjuste.value,
      esAjuste.value,
    ] as const,
  () => {
    if (props.mode !== 'create' || !esAjuste.value) return
    if (sentidoAjuste.value !== 'MENOS') return
    const stock = stockDisponibleAjuste.value
    const cant = Number(cantidad.value)
    if (stock == null || !Number.isFinite(cant)) return
    if (cant > stock) {
      cantidad.value = stock > 0 ? stock : undefined
    }
  },
)

const syncFormValues = () => {
  const data = movimiento.value
  resetForm({
    values: {
      fecha: data?.fecha?.slice(0, 10) ?? today(),
      // Hidden in edit; keep values so requiredSelect still validates on save.
      idAlmacen: data?.id_almacen ?? '',
      idAlmacenDestino: data?.id_almacen_destino ?? '',
      idProducto: data?.id_producto ?? '',
      idTipoMovimiento: data?.id_tipo_movimiento ?? '',
      sentidoAjuste: 'MAS',
      cantidad: data?.cantidad ?? 1,
      idTipoDocumentoRef: data?.id_tipo_documento_ref ?? '',
      idDocumentoRef: data?.id_documento_ref ?? undefined,
      glosa: data?.glosa ?? '',
    },
  })
}

watch(
  () => [props.active, props.mode, movimiento.value?.id] as const,
  async ([active]) => {
    if (!active) return
    if (props.mode === 'create') {
      nombreUnidadMedida.value = null
      esGasProducto.value = false
      const tipoId = resolveIdTipoPorNombreCanonico(props.initialTipoNombre)
      resetForm({
        values: {
          fecha: today(),
          idAlmacen: props.initialIdAlmacen ?? '',
          idAlmacenDestino: '',
          idProducto: props.initialIdProducto ?? '',
          idTipoMovimiento: tipoId,
          sentidoAjuste: 'MAS',
          cantidad: undefined,
          idTipoDocumentoRef: '',
          idDocumentoRef: undefined,
          glosa: '',
        },
      })
      if (props.initialTipoNombre === 'TRASLADO' || esTipoTraslado(tipoId)) {
        resetTrasladoLineas(props.initialIdProducto)
      } else {
        trasladoLineas.splice(0, trasladoLineas.length)
        trasladoLineasError.value = ''
      }
      return
    }
    if (movimiento.value) {
      syncFormValues()
      try {
        const producto = await productosService.obtenerPorId(movimiento.value.id_producto)
        nombreUnidadMedida.value = producto.nombre_unidad_medida ?? null
        esGasProducto.value = Boolean(producto.es_gas)
      } catch {
        nombreUnidadMedida.value = null
        esGasProducto.value = false
      }
    }
  },
  { immediate: true },
)

/** Cuando las opciones de tipo llegan después del reset, preseleccionar desde query. */
watch(
  () =>
    [
      props.active,
      props.mode,
      props.initialTipoNombre,
      tiposMovimientoManuales.value.map((t) => t.id).join(','),
    ] as const,
  ([active, mode, tipoNombre]) => {
    if (!active || mode !== 'create' || !tipoNombre) return
    const id = resolveIdTipoPorNombreCanonico(tipoNombre)
    if (id === '' || Number(idTipoMovimiento.value) === Number(id)) return
    idTipoMovimiento.value = id
    if (tipoNombre === 'TRASLADO' && trasladoLineas.length === 0) {
      resetTrasladoLineas(props.initialIdProducto)
    }
  },
)

const onSubmit = handleSubmit(async (values) => {
  try {
    const tipoDocRef = values.idTipoDocumentoRef
      ? Number(values.idTipoDocumentoRef)
      : undefined

    if (props.mode === 'create') {
      const esTrasladoCreate = esTipoTraslado(values.idTipoMovimiento)
      const esAjusteCreate = esTipoAjuste(values.idTipoMovimiento)

      if (esTrasladoCreate) {
        if (!validarTrasladoLineas()) return

        await createTrasladoLoteMutation.mutateAsync({
          fecha: values.fecha,
          idAlmacen: Number(values.idAlmacen),
          idAlmacenDestino: Number(values.idAlmacenDestino),
          idTipoMovimiento: Number(values.idTipoMovimiento),
          glosa: values.glosa || undefined,
          idDocumentoRef: values.idDocumentoRef ? Number(values.idDocumentoRef) : undefined,
          idTipoDocumentoRef: tipoDocRef,
          detalles: trasladoLineas.map((lin) => ({
            idProducto: Number(lin.idProducto),
            cantidad: Number(lin.cantidad),
          })),
        })
      } else {
        await createMutation.mutateAsync({
          fecha: values.fecha,
          idAlmacen: Number(values.idAlmacen),
          idProducto: Number(values.idProducto),
          idTipoMovimiento: Number(values.idTipoMovimiento),
          cantidad: Number(values.cantidad),
          idDocumentoRef: values.idDocumentoRef ? Number(values.idDocumentoRef) : undefined,
          idTipoDocumentoRef: tipoDocRef,
          glosa: values.glosa || undefined,
          ...(esAjusteCreate
            ? { sentidoAjuste: (values.sentidoAjuste as SentidoAjuste) ?? 'MAS' }
            : {}),
        })
      }
    } else if (props.movimientoId) {
      await updateMutation.mutateAsync({
        id: props.movimientoId,
        payload: {
          fecha: values.fecha,
          idDocumentoRef: values.idDocumentoRef ? Number(values.idDocumentoRef) : undefined,
          idTipoDocumentoRef: tipoDocRef,
          glosa: values.glosa || undefined,
        },
      })
    } else {
      return
    }

    emit('saved')
  } catch {
    // toast en mutation
  }
})
</script>

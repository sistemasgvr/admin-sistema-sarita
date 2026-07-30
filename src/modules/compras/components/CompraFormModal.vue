<template>
  <AppModal v-model="open" :title="modalTitle" size="xl" @close="handleClose">
    <div v-if="isEdit && loadingDetail" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando...
    </div>

    <form v-else id="compra-form" autocomplete="off" @submit.prevent="onSubmit">
      <div class="space-y-4">
        <!-- CREATE: full form -->
        <template v-if="!isEdit">
          <DetailSectionCard title="Datos" :icon="ICONS.receipt" :full-width="true">
            <div
              v-if="props.referenciaCompraId"
              class="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
            >
              <template v-if="referenciaQuery.isFetching.value">
                Cargando datos de la compra anulada...
              </template>
              <template v-else>
                Esta compra corrige a la compra anulada
                <span class="font-medium">{{ referenciaCabecera?.serie ?? '—' }}-{{ referenciaCabecera?.numero ?? '—' }}</span>.
                Los campos y líneas se prellenaron; ajústalos según corresponda.
              </template>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AppSelectSearch
                v-model="idProveedor"
                v-model:search="proveedorBuscar"
                label="Proveedor"
                placeholder="Buscar y seleccionar"
                search-placeholder="Nombre o documento..."
                required
                v-bind="idProveedorAttrs"
                :options="proveedorOptions"
                :loading="proveedoresQuery.isFetching.value"
                :disabled="saving"
                :error="errors.idProveedor"
              />
              <AppInput
                v-model="fecha"
                label="Fecha"
                type="date"
                required
                v-bind="fechaAttrs"
                :disabled="saving"
                :error="errors.fecha"
              />
              <AppInput v-model="serie" label="Serie" placeholder="F001" :disabled="saving" />
              <AppInput v-model="numero" label="Número" placeholder="00001234" :disabled="saving" />
              <AppSelect
                v-model="idTipoComprobante"
                label="Tipo comprobante"
                placeholder="Seleccionar"
                :options="tipoComprobanteOptions"
                :disabled="saving"
              />
              <AppSelect
                v-model="idTipoRegistro"
                label="Tipo registro"
                placeholder="Seleccionar"
                :options="tipoRegistroOptions"
                :disabled="saving"
              />
              <AppSelect
                v-model="idCategoriaGasto"
                label="Categoría gasto"
                placeholder="Seleccionar"
                :options="categoriaGastoOptions"
                :disabled="saving"
              />
              <AppSelectSearch
                v-model="idAlmacen"
                label="Almacén"
                placeholder="Seleccionar"
                required
                v-bind="idAlmacenAttrs"
                :options="almacenOptions"
                :loading="almacenesQuery.isFetching.value"
                :disabled="saving"
                :error="errors.idAlmacen"
              />
              <AppSelectSearch
                v-model="idSucursal"
                label="Sucursal"
                placeholder="Seleccionar"
                :options="sucursalOptions"
                :loading="sucursalesQuery.isFetching.value"
                :disabled="saving"
              />
              <AppSelect
                v-model="idMoneda"
                label="Moneda"
                placeholder="Seleccionar"
                :options="monedaOptions"
                :disabled="saving"
              />
              <AppSelectSearch
                v-model="idCondicionPago"
                label="Condición pago"
                placeholder="Seleccionar"
                :options="condicionPagoOptions"
                :loading="condicionesQuery.isFetching.value"
                :disabled="saving"
              />
            </div>
            <AppTextarea v-model="glosa" label="Glosa" placeholder="Opcional" :disabled="saving" class="mt-3" />
            <AppCheckbox
              v-model="declararSunat"
              label="Declarar SUNAT"
              :disabled="saving"
              class="mt-3"
            />
          </DetailSectionCard>

          <DetailSectionCard title="Detalle" :icon="ICONS.clipboardList" :full-width="true">
            <div class="mb-3 flex flex-wrap items-end gap-3">
              <CompraProductoField
                v-model="lineaIdProducto"
                v-model:search="lineaProductoBuscar"
                placeholder="Buscar producto..."
                class="min-w-[200px] flex-1"
                :options="productoOptions"
                :loading="productosQuery.isFetching.value"
                :disabled="saving"
                @created="onProductoCreado"
              />
              <AppInput
                v-model="lineaCantidad"
                label="Cant."
                type="number"
                min="0.001"
                step="0.001"
                class="w-24"
                :disabled="saving"
              />
              <AppInput
                v-model="lineaPrecio"
                label="P. unit. (con IGV)"
                type="number"
                min="0"
                step="0.01"
                class="w-28"
                :disabled="saving"
              />
              <button
                type="button"
                class="mb-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                :disabled="saving || lineaIdProducto === '' || lineaCantidad === ''"
                @click="agregarLinea"
              >
                <AppIcon :name="ICONS.plus" :size="20" />
              </button>
            </div>

            <p v-if="lineasError" class="mb-2 text-xs text-error-500">{{ lineasError }}</p>

            <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th class="px-3 py-2 text-left">Producto</th>
                    <th class="px-3 py-2 text-right">Cant.</th>
                    <th class="px-3 py-2 text-right">P. unit. (IGV inc.)</th>
                    <th class="px-3 py-2 text-right">Importe</th>
                    <th class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(lin, index) in lineas" :key="lin.key" class="border-t border-gray-100 dark:border-gray-800">
                    <td class="px-3 py-2">
                      <p class="font-medium text-gray-800 dark:text-white/90">{{ lin.productoLabel }}</p>
                    </td>
                    <td class="px-3 py-2 text-right tabular-nums">{{ lin.cantidad }}</td>
                    <td class="px-3 py-2 text-right tabular-nums">{{ lin.precioUnitario !== '' ? formatMoney(Number(lin.precioUnitario)) : '—' }}</td>
                    <td class="px-3 py-2 text-right tabular-nums font-medium">{{ formatMoney((Number(lin.precioUnitario) || 0) * Number(lin.cantidad)) }}</td>
                    <td class="px-3 py-2 text-right">
                      <button type="button" class="text-xs text-error-500 hover:underline" :disabled="saving" @click="lineas.splice(index, 1)">
                        Quitar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Sub total</p>
                <p class="font-semibold text-gray-800 dark:text-white/90">
                  {{ formatMoney(totalesDetalle.valorVenta) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">IGV (18%)</p>
                <p class="font-semibold text-gray-800 dark:text-white/90">
                  {{ formatMoney(totalesDetalle.igv) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p class="font-semibold text-gray-800 dark:text-white/90">
                  {{ formatMoney(totalesDetalle.total) }}
                </p>
              </div>
            </div>
          </DetailSectionCard>
        </template>

        <!-- EDIT: solo cabecera editable + líneas readonly -->
        <template v-else>
          <DetailSectionCard title="Editar Compra" :icon="ICONS.receipt" :full-width="true">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AppSelect
                v-model="idCategoriaGasto"
                label="Categoría gasto"
                placeholder="Seleccionar"
                :options="categoriaGastoOptions"
                :disabled="saving"
              />
              <AppSelectSearch
                v-model="idCondicionPago"
                label="Condición pago"
                placeholder="Seleccionar"
                :options="condicionPagoOptions"
                :loading="condicionesQuery.isFetching.value"
                :disabled="saving"
              />
            </div>
            <AppTextarea v-model="glosa" label="Glosa" placeholder="Opcional" :disabled="saving" class="mt-3" />
            <AppCheckbox
              v-model="declararSunat"
              label="Declarar SUNAT"
              :disabled="saving"
              class="mt-3"
            />
          </DetailSectionCard>

          <DetailSectionCard title="Detalle" :icon="ICONS.clipboardList" :full-width="true">
            <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th class="px-3 py-2 text-left">Producto</th>
                    <th class="px-3 py-2 text-left">Almacén</th>
                    <th class="px-3 py-2 text-right">Cant.</th>
                    <th class="px-3 py-2 text-right">P. unit. (IGV inc.)</th>
                    <th class="px-3 py-2 text-right">Importe</th>
                    <th v-if="puedeModificar" class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="det in lineasExistentes" :key="det.id" class="border-t border-gray-100 dark:border-gray-800">
                    <td class="px-3 py-2">
                      <p class="font-medium text-gray-800 dark:text-white/90">{{ det.nombre_producto ?? det.descripcion }}</p>
                    </td>
                    <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ det.almacen ?? '—' }}</td>
                    <td class="px-3 py-2 text-right tabular-nums">{{ det.cantidad }}</td>
                    <td class="px-3 py-2 text-right tabular-nums">{{ det.precio_unitario != null ? formatMoney(det.precio_unitario) : '—' }}</td>
                    <td class="px-3 py-2 text-right tabular-nums font-medium">{{ formatMoney(det.importe) }}</td>
                    <!-- <td v-if="puedeModificar" class="px-3 py-2 text-right">
                      <button type="button" class="text-xs text-error-500 hover:underline" :disabled="saving || lineaEliminando === det.id" @click="eliminarLinea(det.id)">
                        {{ lineaEliminando === det.id ? '...' : 'Quitar' }}
                      </button>
                    </td> -->
                  </tr>
                </tbody>
              </table>
            </div>

            <<!-- div v-if="puedeModificar && !detalleEditMode" class="mt-2">
              <button type="button" class="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400" @click="detalleEditMode = true">
                + Agregar línea
              </button>
            </div> -->

            <div v-if="puedeModificar && detalleEditMode" class="mt-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nueva línea</p>
              <div class="flex flex-wrap items-end gap-3">
                <CompraProductoField
                  v-model="lineaIdProducto"
                  v-model:search="lineaProductoBuscar"
                  placeholder="Buscar..."
                  class="min-w-[180px] flex-1"
                  :options="productoOptions"
                  :loading="productosQuery.isFetching.value"
                  :disabled="saving"
                  @created="onProductoCreado"
                />
                <AppInput
                  v-model="lineaCantidad"
                  label="Cant."
                  type="number"
                  min="0.001"
                  step="0.001"
                  class="w-24"
                  :disabled="saving"
                />
                <AppInput
                  v-model="lineaPrecio"
                  label="P. unit. (con IGV)"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-28"
                  :disabled="saving"
                />
                <div class="flex gap-2">
                  <button type="button" class="inline-flex h-10 items-center rounded-lg bg-brand-500 px-3 text-sm text-white hover:bg-brand-600 disabled:opacity-50" :disabled="saving || lineaIdProducto === '' || lineaCantidad === ''" @click="agregarLineaNueva">
                    <AppIcon :name="ICONS.plus" :size="16" class="mr-1" /> Agregar
                  </button>
                  <button type="button" class="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" :disabled="saving" @click="detalleEditMode = false">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </DetailSectionCard>
        </template>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        :disabled="saving"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="compra-form"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="saving || (isEdit && loadingDetail)"
      >
        {{ saving ? 'Guardando...' : isEdit ? 'Actualizar cabecera' : 'Registrar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useCompraQuery } from '@/modules/compras/composables/useComprasQuery'
import {
  useActualizarCabeceraMutation,
  useCreateCompraMutation,
  useCrearDetalleMutation,
  useEliminarDetalleMutation,
} from '@/modules/compras/composables/useCompraMutations'
import type { CompraLineaForm } from '@/modules/compras/interfaces/compra.interface'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import { useCondicionesPagoQuery } from '@/modules/configuracion/condiciones-pago/composables/useCondicionesPagoQuery'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import { calcularTotalesDesdeImporte } from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import CompraProductoField from '@/modules/compras/components/CompraProductoField.vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ListaIds } from '@/shared/constants/lista-ids'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { AppCheckbox, AppInput, AppModal, AppSelect, AppSelectSearch, AppTextarea } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { optionalString } from '@/shared/validation'
import { toastWarning } from '@/shared/composables/useToast'

const props = defineProps<{
  compraId?: number | null
  referenciaCompraId?: number | null
}>()

const emit = defineEmits<{
  saved: [id: number]
}>()

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const createMutation = useCreateCompraMutation()
const updateCabeceraMutation = useActualizarCabeceraMutation()
const crearDetalleMutation = useCrearDetalleMutation()
const eliminarDetalleMutation = useEliminarDetalleMutation()

const isEdit = computed(() => Boolean(props.compraId))

const editId = computed(() => (open.value && isEdit.value ? (props.compraId as number) : null))
const detailQuery = useCompraQuery(editId)
const compraData = computed(() => detailQuery.data.value)
const cabecera = computed(() => compraData.value?.cabecera ?? null)
const puedeModificar = computed(() => cabecera.value?.puede_modificarse_parcial ?? false)
const loadingDetail = computed(() => detailQuery.isFetching.value)

// Compra anulada que esta nueva compra corrige (com_crear_compra exige que
// esté anulada; el vínculo es solo de auditoría, no copia datos en el backend
// — el prellenado de campos/líneas se hace aquí en el front).
const referenciaId = computed(() =>
  open.value && !isEdit.value && props.referenciaCompraId ? props.referenciaCompraId : null,
)
const referenciaQuery = useCompraQuery(referenciaId)
const referenciaCabecera = computed(() => referenciaQuery.data.value?.cabecera ?? null)

const saving = computed(
  () =>
    createMutation.isPending.value ||
    updateCabeceraMutation.isPending.value ||
    crearDetalleMutation.isPending.value ||
    eliminarDetalleMutation.isPending.value,
)

const modalTitle = computed(() => {
  if (isEdit.value) return 'Editar comprobante de compra'
  if (props.referenciaCompraId) return 'Corregir compra anulada'
  return 'Nuevo comprobante de compra'
})

// Campos que la BD exige solo al crear (com_crear_compra valida existencia
// de proveedor/almacén); en edición no se muestran ni se envían.
const requiredOnCreate = (label: string) =>
  yup
    .mixed<string | number>()
    .test('required-on-create', `${label} es obligatorio`, (value) =>
      isEdit.value || (value !== '' && value != null),
    )

const requiredDateOnCreate = () =>
  yup
    .string()
    .test('required-on-create', 'La fecha es obligatoria', (value) => isEdit.value || Boolean(value))

const today = () => new Date().toISOString().slice(0, 10)

const { defineField, handleSubmit, resetForm, errors } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      fecha: requiredDateOnCreate(),
      serie: optionalString(),
      numero: optionalString(),
      idProveedor: requiredOnCreate('El proveedor'),
      idAlmacen: requiredOnCreate('El almacén'),
      idTipoComprobante: yup.mixed<string | number>().optional(),
      idTipoRegistro: yup.mixed<string | number>().optional(),
      idCategoriaGasto: yup.mixed<string | number>().optional(),
      idSucursal: yup.mixed<string | number>().optional(),
      idMoneda: yup.mixed<string | number>().optional(),
      idCondicionPago: yup.mixed<string | number>().optional(),
      glosa: optionalString(),
      declararSunat: yup.boolean().default(false),
    }),
  ),
  initialValues: {
    fecha: today(),
    serie: '',
    numero: '',
    idProveedor: '' as string | number,
    idAlmacen: '' as string | number,
    idTipoComprobante: '' as string | number,
    idTipoRegistro: '' as string | number,
    idCategoriaGasto: '' as string | number,
    idSucursal: '' as string | number,
    idMoneda: '' as string | number,
    idCondicionPago: '' as string | number,
    glosa: '',
    declararSunat: false,
  },
})

const [fecha, fechaAttrs] = defineField('fecha')
const [serie] = defineField('serie')
const [numero] = defineField('numero')
const [idProveedor, idProveedorAttrs] = defineField('idProveedor')
const [idAlmacen, idAlmacenAttrs] = defineField('idAlmacen')
const [idTipoComprobante] = defineField('idTipoComprobante')
const [idTipoRegistro] = defineField('idTipoRegistro')
const [idCategoriaGasto] = defineField('idCategoriaGasto')
const [idSucursal] = defineField('idSucursal')
const [idMoneda] = defineField('idMoneda')
const [idCondicionPago] = defineField('idCondicionPago')
const [glosa] = defineField('glosa')
const [declararSunat] = defineField('declararSunat')

const lineas = reactive<CompraLineaForm[]>([])
const lineasExistentes = computed(() => compraData.value?.detalle ?? [])
const lineasError = ref('')

const detalleEditMode = ref(false)
// const lineaEliminando = ref<number | null>(null)

// Catálogos (gen_lista_opciones vía lista-ids.ts) ---
const tipoComprobanteQuery = useListaOpcionesQuery(computed(() => ListaIds.TIPO_COMPROBANTE))
const tipoRegistroQuery = useListaOpcionesQuery(computed(() => ListaIds.TIPO_REGISTRO))
const categoriaGastoQuery = useListaOpcionesQuery(computed(() => ListaIds.CATEGORIA_GASTO))
const monedaQuery = useListaOpcionesQuery(computed(() => ListaIds.MONEDA))

const tipoComprobanteOptions = computed(() => toSelectOptions(tipoComprobanteQuery.data.value))
const tipoRegistroOptions = computed(() => toSelectOptions(tipoRegistroQuery.data.value))
const categoriaGastoOptions = computed(() => toSelectOptions(categoriaGastoQuery.data.value))
const monedaOptions = computed(() => toSelectOptions(monedaQuery.data.value))

// Proveedores
const proveedorBuscar = ref('')
const proveedoresFilters = ref({ pagina: 1, limite: 50, soloActivos: 1 as number, buscar: undefined as string | undefined })
const proveedoresQuery = useClientesQuery(proveedoresFilters)
let proveedorBuscarTimeout: ReturnType<typeof setTimeout> | undefined
watch(proveedorBuscar, (v) => {
  clearTimeout(proveedorBuscarTimeout)
  proveedorBuscarTimeout = setTimeout(() => {
    proveedoresFilters.value = { ...proveedoresFilters.value, buscar: v.trim() || undefined }
  }, 350)
})
const proveedorOptions = computed(() =>
  (proveedoresQuery.data.value?.data ?? []).map((c) => ({ value: c.id, label: getClienteOptionLabel(c) })),
)

// Almacenes
const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)
const almacenOptions = computed(() =>
  (almacenesQuery.data.value?.data ?? []).map((a) => ({ value: a.id, label: a.nombre })),
)

// Sucursales
const sucursalesFilters = ref({ pagina: 1, limite: 100 })
const sucursalesQuery = useSucursalesQuery(sucursalesFilters)
const sucursalOptions = computed(() =>
  (sucursalesQuery.data.value?.data ?? []).map((s) => ({ value: s.id, label: s.nombre })),
)

// Condiciones de pago
const condicionesFilters = ref({ pagina: 1, limite: 100 })
const condicionesQuery = useCondicionesPagoQuery(condicionesFilters)
const condicionPagoOptions = computed(() =>
  (condicionesQuery.data.value?.data ?? []).map((c) => ({ value: c.id, label: c.nombre })),
)

// Productos (para líneas)
const productosFilters = ref({ pagina: 1, limite: 50, soloActivos: 1 as number, buscar: undefined as string | undefined })
const productosQuery = useProductosQuery(productosFilters)
const lineaProductoBuscar = ref('')
let productoBuscarTimeout: ReturnType<typeof setTimeout> | undefined
watch(lineaProductoBuscar, (v) => {
  clearTimeout(productoBuscarTimeout)
  productoBuscarTimeout = setTimeout(() => {
    productosFilters.value = { ...productosFilters.value, buscar: v.trim() || undefined }
  }, 350)
})
const productoOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.codigo} - ${p.nombre}`,
  })),
)

async function onProductoCreado(producto: Producto) {
  lineaProductoBuscar.value = producto.codigo
  productosFilters.value = { ...productosFilters.value, buscar: producto.codigo }
  await productosQuery.refetch()
  lineaIdProducto.value = producto.id
}

// --- Línea en edición (temporal, antes de agregarla) ---
const lineaIdProducto = ref<number | ''>('')
const lineaCantidad = ref<number | ''>('')
const lineaPrecio = ref<number | ''>('')

function resetLineaTemporal() {
  lineaIdProducto.value = ''
  lineaCantidad.value = ''
  lineaPrecio.value = ''
}

function agregarLinea() {
  if (lineaIdProducto.value === '' || lineaCantidad.value === '') return
  const prod = productosQuery.data.value?.data?.find((p) => p.id === lineaIdProducto.value)
  lineas.push({
    key: crypto.randomUUID(),
    idProducto: lineaIdProducto.value,
    cantidad: lineaCantidad.value,
    precioUnitario: lineaPrecio.value,
    productoLabel: prod ? `${prod.codigo} - ${prod.nombre}` : `ID ${lineaIdProducto.value}`,
  })
  lineasError.value = ''
  resetLineaTemporal()
}

async function agregarLineaNueva() {
  if (lineaIdProducto.value === '' || lineaCantidad.value === '' || !props.compraId) return
  const userId = authStore.user?.id
  if (!userId) return
  await crearDetalleMutation.mutateAsync({
    id: props.compraId,
    payload: {
      idUsuarioAuditoria: userId,
      idProducto: Number(lineaIdProducto.value),
      cantidad: Number(lineaCantidad.value),
      precioUnitario: lineaPrecio.value !== '' ? Number(lineaPrecio.value) : undefined,
    },
  })
  resetLineaTemporal()
  detalleEditMode.value = false
}

/* async function eliminarLinea(idDetalle: number) {
  const userId = authStore.user?.id
  if (!userId) return
  lineaEliminando.value = idDetalle
  try {
    await eliminarDetalleMutation.mutateAsync({ idDetalle, idUsuarioAuditoria: userId })
  } finally {
    lineaEliminando.value = null
  }
} */

const totalLineas = computed(() =>
  lineas.reduce((acc, lin) => acc + (Number(lin.precioUnitario) || 0) * Number(lin.cantidad), 0),
)

// precioUnitario se ingresa con IGV incluido (igual que en ventas); se
// descompone solo para mostrar el desglose, el backend recalcula lo mismo
// al guardar (com_crear_compra / com_recalcular_totales_compra).
const totalesDetalle = computed(() => calcularTotalesDesdeImporte(totalLineas.value))

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function resetCreateForm() {
  resetForm({
    values: {
      fecha: today(),
      serie: '',
      numero: '',
      idProveedor: '',
      idAlmacen: '',
      idTipoComprobante: '',
      idTipoRegistro: '',
      idCategoriaGasto: '',
      idSucursal: '',
      idMoneda: '',
      idCondicionPago: '',
      glosa: '',
      declararSunat: false,
    },
  })
  lineas.splice(0, lineas.length)
  lineasError.value = ''
  proveedorBuscar.value = ''
  lineaProductoBuscar.value = ''
  resetLineaTemporal()
  detalleEditMode.value = false
}

function prefillFromReferencia(data: NonNullable<typeof referenciaQuery.data.value>) {
  const c = data.cabecera

  resetForm({
    values: {
      fecha: today(),
      serie: c.serie ?? '',
      numero: '',
      idProveedor: c.id_proveedor ?? '',
      idAlmacen: c.id_almacen ?? '',
      idTipoComprobante: c.id_tipo_comprobante ?? '',
      idTipoRegistro: c.id_tipo_registro ?? '',
      idCategoriaGasto: c.id_categoria_gasto ?? '',
      idSucursal: c.id_sucursal ?? '',
      idMoneda: c.id_moneda ?? '',
      idCondicionPago: c.id_condicion_pago ?? '',
      glosa: '',
      declararSunat: c.declarar_sunat,
    },
  })

  // Trae al proveedor referenciado a las opciones cargadas (la lista por
  // defecto solo trae los primeros 50 activos y podría no incluirlo).
  proveedorBuscar.value = c.proveedor ?? ''

  lineas.splice(
    0,
    lineas.length,
    ...(data.detalle ?? []).map((d) => ({
      key: crypto.randomUUID(),
      idProducto: d.id_producto ?? ('' as number | ''),
      cantidad: d.cantidad,
      precioUnitario: d.precio_unitario ?? ('' as number | ''),
      productoLabel: d.codigo_producto ? `${d.codigo_producto} - ${d.nombre_producto ?? ''}` : (d.nombre_producto ?? d.descripcion),
    })),
  )
  lineasError.value = ''
}

// --- Reset/prellenado al abrir en modo creación ---
// Si hay referenciaCompraId: espera los datos de la compra anulada (pueden
// venir de caché, así que se evalúa junto con open/isEdit en un solo watcher
// para no depender de que referenciaQuery.data "cambie") y prellena con
// ellos. Si no hay referencia, arranca en blanco.
watch(
  () => [open.value, isEdit.value, props.referenciaCompraId, referenciaQuery.data.value] as const,
  ([isOpen, edit, refId, refData]) => {
    if (!isOpen || edit) return

    if (!refId) {
      resetCreateForm()
      return
    }

    if (refData) {
      prefillFromReferencia(refData)
    }
  },
  { immediate: true },
)

// --- Cargar cabecera al abrir en modo edición ---
watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data || !isEdit.value) return
    resetForm({
      values: {
        fecha: today(),
        serie: '',
        numero: '',
        idProveedor: '',
        idAlmacen: '',
        idTipoComprobante: '',
        idTipoRegistro: '',
        idCategoriaGasto: data.cabecera.id_categoria_gasto ?? '',
        idSucursal: '',
        idMoneda: '',
        idCondicionPago: data.cabecera.id_condicion_pago ?? '',
        glosa: data.cabecera.glosa ?? '',
        declararSunat: data.cabecera.declarar_sunat,
      },
    })
  },
)

const onSubmit = handleSubmit(async (values) => {
  const userId = authStore.user?.id
  if (!userId) return

  const toOptionalNumber = (value: string | number | undefined) =>
    value !== '' && value != null ? Number(value) : undefined

  if (isEdit.value && props.compraId) {
    const updated = await updateCabeceraMutation.mutateAsync({
      id: props.compraId,
      payload: {
        idUsuarioAuditoria: userId,
        glosa: values.glosa?.trim() || undefined,
        idCondicionPago: toOptionalNumber(values.idCondicionPago),
        idCategoriaGasto: toOptionalNumber(values.idCategoriaGasto),
        declararSunat: values.declararSunat,
      },
    })
    emit('saved', updated.cabecera.id)
    open.value = false
    return
  }

  const detalles = lineas
    .filter((l) => l.idProducto !== '' && Number(l.cantidad) > 0)
    .map((l) => ({
      idProducto: Number(l.idProducto),
      cantidad: Number(l.cantidad),
      precioUnitario: l.precioUnitario !== '' ? Number(l.precioUnitario) : undefined,
    }))

  if (detalles.length === 0) {
    lineasError.value = 'Agrega al menos un producto'
    toastWarning('Agrega al menos un producto')
    return
  }
  lineasError.value = ''

  const created = await createMutation.mutateAsync({
    idUsuarioAuditoria: userId,
    fecha: values.fecha as string,
    serie: values.serie?.trim() || undefined,
    numero: values.numero?.trim() || undefined,
    idProveedor: toOptionalNumber(values.idProveedor),
    idAlmacen: toOptionalNumber(values.idAlmacen),
    idTipoComprobante: toOptionalNumber(values.idTipoComprobante),
    idTipoRegistro: toOptionalNumber(values.idTipoRegistro),
    idCategoriaGasto: toOptionalNumber(values.idCategoriaGasto),
    idSucursal: toOptionalNumber(values.idSucursal),
    idMoneda: toOptionalNumber(values.idMoneda),
    idCondicionPago: toOptionalNumber(values.idCondicionPago),
    idComprobanteReferencia: props.referenciaCompraId ?? undefined,
    declararSunat: values.declararSunat,
    glosa: values.glosa?.trim() || undefined,
    detalles,
  })
  emit('saved', created.cabecera.id)
  open.value = false
})

function handleClose() {
  open.value = false
}
</script>

<template>
  <AppModal v-model="open" :title="modalTitle" size="lg">
    <div v-if="isEdit && detailQuery.isLoading.value" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando...
    </div>

    <div v-else class="space-y-4">
      <!-- CREATE: full form -->
      <template v-if="!isEdit">
        <DetailSectionCard title="Datos" :icon="ICONS.receipt" :full-width="true">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AppSelectSearch
              v-model="idProveedor"
              v-model:search="proveedorBuscar"
              label="Proveedor"
              placeholder="Buscar y seleccionar"
              search-placeholder="Nombre o documento..."
              :options="proveedorOptions"
              :loading="proveedoresQuery.isFetching.value"
              :disabled="saving"
            />
            <AppInput
              v-model="fecha"
              label="Fecha"
              type="date"
              :disabled="saving"
              required
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
              :options="almacenOptions"
              :loading="almacenesQuery.isFetching.value"
              :disabled="saving"
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
          <div class="mt-3 flex items-center gap-6">
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input v-model="declararSunat" type="checkbox" class="rounded border-gray-300" :disabled="saving" />
              Declarar SUNAT
            </label>
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Detalle" :icon="ICONS.clipboardList" :full-width="true">
          <div class="mb-3 flex flex-wrap items-end gap-3">
            <AppSelectSearch
              v-model="lineaIdProducto"
              label="Producto"
              placeholder="Buscar producto..."
              class="min-w-[200px] flex-1"
              :options="productoOptions"
              :loading="productosQuery.isFetching.value"
              :disabled="saving"
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
              label="P. unit."
              type="number"
              min="0"
              step="0.01"
              class="w-28"
              :disabled="saving"
            />
            <button
              type="button"
              class="mb-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
              :disabled="saving || !lineaIdProducto || !lineaCantidad"
              @click="agregarLinea"
            >
              <AppIcon :name="ICONS.plus" :size="20" />
            </button>
          </div>

          <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th class="px-3 py-2 text-left">Producto</th>
                  <th class="px-3 py-2 text-right">Cant.</th>
                  <th class="px-3 py-2 text-right">P. unit.</th>
                  <th class="px-3 py-2 text-right">Importe</th>
                  <th class="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(lin, index) in lineas" :key="index" class="border-t border-gray-100 dark:border-gray-800">
                  <td class="px-3 py-2">
                    <p class="font-medium text-gray-800 dark:text-white/90">{{ lin.productoLabel }}</p>
                  </td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ lin.cantidad }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ lin.precioUnitario != null ? formatMoney(lin.precioUnitario) : '—' }}</td>
                  <td class="px-3 py-2 text-right tabular-nums font-medium">{{ formatMoney((lin.precioUnitario ?? 0) * lin.cantidad) }}</td>
                  <td class="px-3 py-2 text-right">
                    <button type="button" class="text-xs text-error-500 hover:underline" :disabled="saving" @click="lineas.splice(index, 1)">
                      Quitar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-2 text-right text-sm font-semibold text-gray-800 dark:text-white/90">
            Total detalle: {{ formatMoney(totalLineas) }}
          </p>
        </DetailSectionCard>
      </template>

      <!-- EDIT: solo cabecera editable + líneas readonly -->
      <template v-else>
        <DetailSectionCard title="Cabecera editable" :icon="ICONS.receipt" :full-width="true">
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
          <div class="mt-3 flex items-center gap-6">
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input v-model="declararSunat" type="checkbox" class="rounded border-gray-300" :disabled="saving" />
              Declarar SUNAT
            </label>
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Detalle" :icon="ICONS.clipboardList" :full-width="true">
          <div v-if="!detalleEditMode" class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th class="px-3 py-2 text-left">Producto</th>
                  <th class="px-3 py-2 text-left">Almacén</th>
                  <th class="px-3 py-2 text-right">Cant.</th>
                  <th class="px-3 py-2 text-right">P. unit.</th>
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
                  <td v-if="puedeModificar" class="px-3 py-2 text-right">
                    <button type="button" class="text-xs text-error-500 hover:underline" :disabled="saving || lineaEliminando === det.id" @click="eliminarLinea(det.id)">
                      {{ lineaEliminando === det.id ? '...' : 'Quitar' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="puedeModificar && !detalleEditMode" class="mt-2">
            <button type="button" class="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400" @click="detalleEditMode = true">
              + Agregar línea
            </button>
          </div>

          <div v-if="puedeModificar && detalleEditMode" class="mt-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nueva línea</p>
            <div class="flex flex-wrap items-end gap-3">
              <AppSelectSearch
                v-model="lineaIdProducto"
                label="Producto"
                placeholder="Buscar..."
                class="min-w-[180px] flex-1"
                :options="productoOptions"
                :loading="productosQuery.isFetching.value"
                :disabled="saving"
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
                label="P. unit."
                type="number"
                min="0"
                step="0.01"
                class="w-28"
                :disabled="saving"
              />
              <div class="flex gap-2">
                <button type="button" class="inline-flex h-10 items-center rounded-lg bg-brand-500 px-3 text-sm text-white hover:bg-brand-600 disabled:opacity-50" :disabled="saving || !lineaIdProducto || !lineaCantidad" @click="agregarLineaNueva">
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

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        :disabled="saving"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="saving || !canSave"
        @click="confirm"
      >
        {{ saving ? 'Guardando...' : isEdit ? 'Actualizar cabecera' : 'Registrar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCompraQuery } from '@/modules/compras/composables/useComprasQuery'
import {
  useActualizarCabeceraMutation,
  useCreateCompraMutation,
  useCrearDetalleMutation,
  useEliminarDetalleMutation,
} from '@/modules/compras/composables/useCompraMutations'
import type { CompraListItem, CreateCompraDetallePayload } from '@/modules/compras/interfaces/compra.interface'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import { useCondicionesPagoQuery } from '@/modules/configuracion/condiciones-pago/composables/useCondicionesPagoQuery'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ListaIds } from '@/shared/constants/lista-ids'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { AppInput, AppModal, AppSelect, AppSelectSearch, AppTextarea } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  modelValue: boolean
  compra?: CompraListItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateCompraMutation()
const updateCabeceraMutation = useActualizarCabeceraMutation()
const crearDetalleMutation = useCrearDetalleMutation()
const eliminarDetalleMutation = useEliminarDetalleMutation()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const isEdit = computed(() => !!props.compra)

const compraId = computed(() => (props.modelValue && isEdit.value ? props.compra!.id : null))
const detailQuery = useCompraQuery(compraId)
const compraData = computed(() => detailQuery.data.value)
const cabecera = computed(() => compraData.value?.cabecera ?? null)
const puedeModificar = computed(() => cabecera.value?.puede_modificarse_parcial ?? false)

const saving = computed(
  () =>
    createMutation.isPending.value ||
    updateCabeceraMutation.isPending.value ||
    crearDetalleMutation.isPending.value ||
    eliminarDetalleMutation.isPending.value,
)

// --- Form fields ---
const fecha = ref(new Date().toISOString().slice(0, 10))
const serie = ref('')
const numero = ref('')
const glosa = ref('')
const declararSunat = ref(false)
const idProveedor = ref<number | ''>('')
const idAlmacen = ref<number | ''>('')
const idTipoComprobante = ref<number | ''>('')
const idTipoRegistro = ref<number | ''>('')
const idCategoriaGasto = ref<number | ''>('')
const idSucursal = ref<number | ''>('')
const idMoneda = ref<number | ''>('')
const idCondicionPago = ref<number | ''>('')
const lineas = ref<CreateCompraDetallePayload[]>([])
const lineasExistentes = computed(() => compraData.value?.detalle ?? [])

// Edit-only: detail line add mode
const detalleEditMode = ref(false)
const lineaEliminando = ref<number | null>(null)

// --- Catalogs ---
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
  if (proveedorBuscarTimeout) clearTimeout(proveedorBuscarTimeout)
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

// Condiciones pago
const condicionesFilters = ref({ pagina: 1, limite: 100 })
const condicionesQuery = useCondicionesPagoQuery(condicionesFilters)
const condicionPagoOptions = computed(() =>
  (condicionesQuery.data.value?.data ?? []).map((c) => ({ value: c.id, label: c.nombre })),
)

// Productos (for lines)
const productosFilters = ref({ pagina: 1, limite: 50, soloActivos: 1 as number, buscar: undefined as string | undefined })
const productosQuery = useProductosQuery(productosFilters)
let productoBuscarTimeout: ReturnType<typeof setTimeout> | undefined
const lineaProductoBuscar = ref('')
watch(lineaProductoBuscar, (v) => {
  if (productoBuscarTimeout) clearTimeout(productoBuscarTimeout)
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

// --- Temporary line entry ---
const lineaIdProducto = ref<number | ''>('')
const lineaCantidad = ref<number | ''>('')
const lineaPrecio = ref<number | ''>('')

function agregarLinea() {
  if (!lineaIdProducto.value || !lineaCantidad.value) return
  const prod = productosQuery.data.value?.data?.find((p) => p.id === lineaIdProducto.value)
  lineas.value.push({
    idProducto: Number(lineaIdProducto.value),
    cantidad: Number(lineaCantidad.value),
    precioUnitario: lineaPrecio.value !== '' ? Number(lineaPrecio.value) : undefined,
    productoLabel: prod ? `${prod.codigo} - ${prod.nombre}` : `ID ${lineaIdProducto.value}`,
  } as CreateCompraDetallePayload & { productoLabel: string })
  lineaIdProducto.value = ''
  lineaCantidad.value = ''
  lineaPrecio.value = ''
}

async function agregarLineaNueva() {
  if (!lineaIdProducto.value || !lineaCantidad.value || !props.compra) return
  const userId = authStore.user?.id
  if (!userId) return
  await crearDetalleMutation.mutateAsync({
    id: props.compra.id,
    payload: {
      idUsuarioAuditoria: userId,
      idProducto: Number(lineaIdProducto.value),
      cantidad: Number(lineaCantidad.value),
      precioUnitario: lineaPrecio.value !== '' ? Number(lineaPrecio.value) : undefined,
    },
  })
  lineaIdProducto.value = ''
  lineaCantidad.value = ''
  lineaPrecio.value = ''
  detalleEditMode.value = false
}

async function eliminarLinea(idDetalle: number) {
  const userId = authStore.user?.id
  if (!userId) return
  lineaEliminando.value = idDetalle
  try {
    await eliminarDetalleMutation.mutateAsync({ idDetalle, idUsuarioAuditoria: userId })
  } finally {
    lineaEliminando.value = null
  }
}

const totalLineas = computed(() =>
  lineas.value.reduce((acc, lin) => acc + (lin.precioUnitario ?? 0) * lin.cantidad, 0),
)

const canSave = computed(() => {
  if (isEdit.value) return true
  return Boolean(fecha.value) && lineas.value.length > 0
})

const modalTitle = computed(() => (isEdit.value ? 'Editar comprobante de compra' : 'Nuevo comprobante de compra'))

// --- Reset form on open (create mode) ---
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen || isEdit.value) return
    fecha.value = new Date().toISOString().slice(0, 10)
    serie.value = ''
    numero.value = ''
    glosa.value = ''
    declararSunat.value = false
    idProveedor.value = ''
    idAlmacen.value = ''
    idTipoComprobante.value = ''
    idTipoRegistro.value = ''
    idCategoriaGasto.value = ''
    idSucursal.value = ''
    idMoneda.value = ''
    idCondicionPago.value = ''
    lineas.value = []
  },
)

// --- Load data for edit mode ---
watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data || !isEdit.value) return
    const c = data.cabecera
    glosa.value = c.glosa ?? ''
    declararSunat.value = c.declarar_sunat
    idCategoriaGasto.value = c.id_categoria_gasto ?? ''
    idCondicionPago.value = c.id_condicion_pago ?? ''
  },
)

async function confirm() {
  const userId = authStore.user?.id
  if (!userId || !canSave.value) return

  if (isEdit.value && props.compra) {
    await updateCabeceraMutation.mutateAsync({
      id: props.compra.id,
      payload: {
        idUsuarioAuditoria: userId,
        glosa: glosa.value.trim() || undefined,
        idCondicionPago: idCondicionPago.value !== '' ? Number(idCondicionPago.value) : undefined,
        idCategoriaGasto: idCategoriaGasto.value !== '' ? Number(idCategoriaGasto.value) : undefined,
        declararSunat: declararSunat.value || undefined,
      },
    })
  } else {
    await createMutation.mutateAsync({
      idUsuarioAuditoria: userId,
      fecha: fecha.value,
      serie: serie.value.trim() || undefined,
      numero: numero.value.trim() || undefined,
      idProveedor: idProveedor.value !== '' ? Number(idProveedor.value) : undefined,
      idAlmacen: idAlmacen.value !== '' ? Number(idAlmacen.value) : undefined,
      idTipoComprobante: idTipoComprobante.value !== '' ? Number(idTipoComprobante.value) : undefined,
      idTipoRegistro: idTipoRegistro.value !== '' ? Number(idTipoRegistro.value) : undefined,
      idCategoriaGasto: idCategoriaGasto.value !== '' ? Number(idCategoriaGasto.value) : undefined,
      idSucursal: idSucursal.value !== '' ? Number(idSucursal.value) : undefined,
      idMoneda: idMoneda.value !== '' ? Number(idMoneda.value) : undefined,
      idCondicionPago: idCondicionPago.value !== '' ? Number(idCondicionPago.value) : undefined,
      declararSunat: declararSunat.value || undefined,
      glosa: glosa.value.trim() || undefined,
      detalles: lineas.value,
    })
  }

  open.value = false
  emit('saved')
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}
</script>

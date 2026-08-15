<template>
  <AppModal
    v-model="open"
    :title="modalTitle"
    :subtitle="comprobanteLabel"
    size="xl"
  >
    <div
      v-if="comprobanteQuery.isLoading.value"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando comprobante...
    </div>

    <div v-else-if="comprobanteDetalle" class="space-y-4">
      <!-- Identidad del documento -->
      <div
        class="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="min-w-0">
          <p class="text-xs text-gray-500 dark:text-gray-400">Documento</p>
          <p class="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
            {{ comprobanteDetalle.serie }}-{{ comprobanteDetalle.numero }}
          </p>
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
            <ListaOpcionBadge
              v-if="comprobanteDetalle.nombre_tipo_comprobante || comprobanteDetalle.codigo_tipo_comprobante"
              :value="comprobanteDetalle.nombre_tipo_comprobante ?? comprobanteDetalle.codigo_tipo_comprobante"
            />
            <ListaOpcionBadge
              v-if="comprobanteDetalle.nombre_estado_sunat"
              :value="comprobanteDetalle.nombre_estado_sunat"
            />
          </div>
        </div>
        <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>Al editar cantidades se ajusta el stock</span>
          <AppHelpTip
            text="Si aumentas cantidad se descuenta stock; si bajas o quitas un producto, se restaura. El almacén debe coincidir con el de la venta."
          />
        </div>
      </div>

      <!-- 1. Cabecera -->
      <DetailSectionCard title="Cabecera" :icon="ICONS.receipt" :full-width="true">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <ClienteSelectField
              v-model="idCliente"
              label="Cliente"
              required
              :disabled="saving"
            />
          </div>
          <AppInput
            v-model="fecha"
            label="Fecha"
            type="date"
            :disabled="saving"
            required
          />
          <AlmacenSelectField
            v-model="idAlmacen"
            label="Almacén"
            hint="Desde aquí se descuenta o restaura stock"
            :disabled="saving"
            required
          />
        </div>
      </DetailSectionCard>

      <!-- 2. Productos (foco principal) -->
      <DetailSectionCard title="Productos" :icon="ICONS.package" :full-width="true">
        <template #actions>
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ lineas.length }} {{ lineas.length === 1 ? 'ítem' : 'ítems' }}
          </span>
        </template>

        <div class="mb-3">
          <AppSelectSearch
            v-model="idProductoAgregar"
            v-model:search="productoBuscar"
            remote
            label="Agregar producto"
            placeholder="Buscar y agregar al detalle"
            search-placeholder="Código o nombre..."
            :options="productoOptions"
            :loading="isFetchingProductos"
            :disabled="saving || !idAlmacen"
            :hint="productoSelectHint"
            :empty-text="productoSelectEmptyText"
          />
        </div>

        <div
          v-if="lineas.length === 0"
          class="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          No hay productos. Busca arriba para agregar al menos uno.
        </div>

        <div
          v-else
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
                    class="w-28 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300"
                  >
                    Cant.
                  </th>
                  <th
                    class="w-32 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300"
                  >
                    P. unit.
                  </th>
                  <th
                    class="w-28 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300"
                  >
                    Importe
                  </th>
                  <th class="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(linea, index) in lineas"
                  :key="linea.key"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td class="px-3 py-2.5">
                    <p class="font-medium text-gray-800 dark:text-white/90">
                      {{ linea.descripcion }}
                    </p>
                  </td>
                  <td class="px-3 py-2.5">
                    <CantidadUnidadInput
                      v-model="linea.cantidad"
                      :name="`comprobante-edit-cantidad-${linea.key}`"
                      :nombre-unidad="linea.nombreUnidadMedida"
                      :disabled="saving"
                    />
                  </td>
                  <td class="px-3 py-2.5">
                    <input
                      v-model.number="linea.precioUnitario"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-full rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-right tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700"
                      :disabled="saving"
                      aria-label="Precio unitario"
                    />
                  </td>
                  <td
                    class="px-3 py-2.5 text-right tabular-nums font-medium text-gray-800 dark:text-white/90"
                  >
                    {{ formatMoney(linea.cantidad * linea.precioUnitario) }}
                  </td>
                  <td class="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      title="Quitar producto"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-error-500/10"
                      :disabled="saving || lineas.length <= 1"
                      @click="removeLinea(index)"
                    >
                      <AppIcon :name="ICONS.trash" :size="15" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            class="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Total estimado (con IGV en precio)
            </p>
            <p class="text-base font-semibold tabular-nums text-gray-900 dark:text-white">
              {{ formatMoney(totalEstimado) }}
            </p>
          </div>
        </div>
      </DetailSectionCard>

      <!-- 3. Notas (secundario) -->
      <AppCollapsibleSection
        v-model:open="notasOpen"
        title="Notas"
        description="Glosa y observaciones opcionales"
        :icon="ICONS.messageSquare"
        :badge="tieneNotas ? 'Con texto' : undefined"
      >
        <div class="grid grid-cols-1 gap-3">
          <AppInput
            v-model="glosa"
            label="Glosa"
            placeholder="Texto corto en el comprobante"
            :disabled="saving"
          />
          <AppTextarea
            v-model="observaciones"
            label="Observaciones"
            placeholder="Notas internas u observaciones"
            :rows="2"
            :disabled="saving"
          />
        </div>
      </AppCollapsibleSection>
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
        <AppIcon v-if="!saving" :name="ICONS.check" :size="16" />
        <AppIcon v-else :name="ICONS.refreshCw" :size="16" class="animate-spin" />
        {{ saving ? 'Guardando...' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComprobanteQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import { useUpdateComprobanteMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import type { ComprobanteListItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import {
  esVentaSinDocumentoTipo,
  LABEL_VENTA_SIN_DOCUMENTO,
} from '@/modules/ventas/comprobantes/constants/tipoComprobante'
import type {
  Producto,
  ProductoListFilters,
} from '@/modules/productos/articulos/interfaces/producto.interface'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import CantidadUnidadInput from '@/modules/ventas/comprobantes/components/CantidadUnidadInput.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import {
  AppCollapsibleSection,
  AppHelpTip,
  AppInput,
  AppModal,
  AppSelectSearch,
  AppTextarea,
  ListaOpcionBadge,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { validarStockParaAgregar } from '@/modules/ventas/comprobantes/utils/stockPos'
import {
  filtrosPorCatalogoPos,
  labelCatalogoPosEdicion,
  resolverCatalogoPosEdicion,
  type CatalogoPosEdicion,
} from '@/modules/ventas/comprobantes/utils/catalogoPosEdicion'
import {
  unidadRequiereCantidadEntera,
  validarCantidadSegunUnidad,
} from '@/modules/ventas/comprobantes/utils/unidadMedidaCantidad'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'

interface LineaEdit {
  key: string
  idProducto: number
  descripcion: string
  nombreUnidadMedida?: string | null
  cantidad: number
  precioUnitario: number
  descuento: number
  porcentajeIgv: number
  idAfectacionIgv?: number
}

const props = defineProps<{
  modelValue: boolean
  comprobante: ComprobanteListItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const updateMutation = useUpdateComprobanteMutation()
const saving = computed(() => updateMutation.isPending.value)

const comprobanteId = computed(() => (props.modelValue ? props.comprobante?.id ?? null : null))
const comprobanteQuery = useComprobanteQuery(comprobanteId)

const fecha = ref('')
const glosa = ref('')
const observaciones = ref('')
const idCliente = ref<number | ''>('')
const idAlmacen = ref<number | ''>('')
const lineas = ref<LineaEdit[]>([])

const idProductoAgregar = ref<number | ''>('')
const productoBuscar = ref('')
const notasOpen = ref(false)
/** Catálogo POS inferido del detalle al abrir (no cambia al agregar ítems). */
const catalogoPos = ref<CatalogoPosEdicion>('todos')

const productosFilters = ref<ProductoListFilters>({
  pagina: 1,
  limite: 80,
  soloActivos: 1,
  incluirImagenes: false,
})
const productosQuery = useProductosQuery(productosFilters)
const isFetchingProductos = computed(() => productosQuery.isFetching.value)
const isProductosError = computed(() => productosQuery.isError.value)

let productoBuscarTimeout: ReturnType<typeof setTimeout> | undefined

const productoSelectHint = computed(() => {
  if (!idAlmacen.value) {
    return 'Selecciona un almacén para listar productos con stock'
  }
  return labelCatalogoPosEdicion(catalogoPos.value)
})

const productoSelectEmptyText = computed(() => {
  if (isProductosError.value) {
    return 'No se pudieron cargar productos. Reintenta.'
  }
  if (isFetchingProductos.value) {
    return 'Cargando productos...'
  }
  return 'Sin resultados'
})

function syncProductosFilters(buscar?: string) {
  productosFilters.value = {
    pagina: 1,
    limite: 80,
    soloActivos: 1,
    incluirImagenes: false,
    buscar: buscar?.trim() || undefined,
    idAlmacen: idAlmacen.value ? Number(idAlmacen.value) : undefined,
    ...filtrosPorCatalogoPos(catalogoPos.value),
  }
}

watch(productoBuscar, (value) => {
  if (productoBuscarTimeout) clearTimeout(productoBuscarTimeout)
  productoBuscarTimeout = setTimeout(() => {
    syncProductosFilters(value)
  }, 300)
})

watch(idAlmacen, () => {
  syncProductosFilters(productoBuscar.value)
})

const productoOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((producto) => {
    const base = [producto.codigo, producto.nombre].filter(Boolean).join(' — ')
    if (producto.stock_actual == null) {
      return { value: producto.id, label: base }
    }
    return {
      value: producto.id,
      label: `${base} (stock: ${producto.stock_actual})`,
    }
  }),
)

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const comprobanteDetalle = computed(() => comprobanteQuery.data.value ?? null)

const esVsd = computed(() =>
  esVentaSinDocumentoTipo({
    codigo: comprobanteDetalle.value?.codigo_tipo_comprobante ?? props.comprobante?.codigo_tipo_comprobante,
    nombre: comprobanteDetalle.value?.nombre_tipo_comprobante ?? props.comprobante?.nombre_tipo_comprobante,
  }),
)

const modalTitle = computed(() =>
  esVsd.value ? `Editar ${LABEL_VENTA_SIN_DOCUMENTO.toLowerCase()}` : 'Editar comprobante',
)

const comprobanteLabel = computed(() => {
  if (!props.comprobante) return undefined
  return `${props.comprobante.serie}-${props.comprobante.numero}`
})

const tieneNotas = computed(
  () => Boolean(glosa.value.trim()) || Boolean(observaciones.value.trim()),
)

const totalEstimado = computed(() =>
  lineas.value.reduce((acc, linea) => acc + Number(linea.cantidad) * Number(linea.precioUnitario), 0),
)

const canSave = computed(
  () =>
    Boolean(fecha.value) &&
    Boolean(idCliente.value) &&
    Boolean(idAlmacen.value) &&
    lineas.value.length > 0 &&
    lineas.value.every((l) => l.cantidad > 0 && l.precioUnitario >= 0),
)

watch(
  () => comprobanteQuery.data.value,
  (data) => {
    if (!data) return
    fecha.value = String(data.fecha ?? '').slice(0, 10)
    glosa.value = data.glosa ?? ''
    observaciones.value = data.observaciones ?? ''
    idCliente.value = data.id_cliente ?? ''
    idAlmacen.value = data.id_almacen ?? ''
    lineas.value = (data.detalles ?? []).map((detalle, index) => ({
      key: `${detalle.id ?? detalle.id_producto}-${index}`,
      idProducto: detalle.id_producto,
      descripcion:
        detalle.descripcion || detalle.nombre_producto || `Producto ${detalle.id_producto}`,
      nombreUnidadMedida: detalle.nombre_unidad_medida ?? null,
      cantidad: Number(detalle.cantidad),
      precioUnitario: Number(detalle.precio_unitario),
      descuento: Number(detalle.descuento ?? 0),
      porcentajeIgv: Number(detalle.porcentaje_igv ?? 18),
      idAfectacionIgv: detalle.id_afectacion_igv ?? undefined,
    }))
    idProductoAgregar.value = ''
    productoBuscar.value = ''
    notasOpen.value = Boolean((data.glosa ?? '').trim() || (data.observaciones ?? '').trim())
    catalogoPos.value = resolverCatalogoPosEdicion({
      origenPos: data.origen_pos,
      detalles: data.detalles ?? [],
    })
    syncProductosFilters('')
  },
  { immediate: true },
)

watch(idProductoAgregar, (id) => {
  if (id === '' || id == null) return
  const selectedId = Number(id)
  idProductoAgregar.value = ''

  if (!idAlmacen.value) {
    toastWarning('Selecciona el almacén antes de agregar productos')
    return
  }

  const producto = (productosQuery.data.value?.data ?? []).find((item) => item.id === selectedId)
  if (!producto) {
    toastWarning('No se pudo cargar el producto seleccionado. Intenta de nuevo.')
    return
  }
  agregarProducto(producto)
})

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function removeLinea(index: number) {
  if (lineas.value.length <= 1) {
    toastWarning('Debe quedar al menos un producto')
    return
  }
  lineas.value.splice(index, 1)
}

function agregarProducto(producto: Producto) {
  const existente = lineas.value.find((linea) => linea.idProducto === producto.id)
  const unidad = producto.nombre_unidad_medida ?? null
  const incremento = unidadRequiereCantidadEntera(unidad) ? 1 : 0.01
  const cantidadDeseada = existente
    ? Math.max(incremento, Number(existente.cantidad || 0) + incremento)
    : 1

  const errorStock = validarStockParaAgregar(producto, cantidadDeseada, {
    requiereAlmacenSeleccionado: true,
  })
  if (errorStock) {
    toastWarning(errorStock)
    return
  }

  if (existente) {
    existente.cantidad = cantidadDeseada
    existente.nombreUnidadMedida = unidad ?? existente.nombreUnidadMedida
    toastSuccess(`${producto.nombre}: cantidad ${existente.cantidad}`)
    return
  }

  const afectacionDefault = lineas.value.find((l) => l.idAfectacionIgv)?.idAfectacionIgv
  lineas.value.push({
    key: crypto.randomUUID(),
    idProducto: producto.id,
    descripcion: producto.nombre,
    nombreUnidadMedida: unidad,
    cantidad: 1,
    precioUnitario: Number(producto.precio ?? 0),
    descuento: 0,
    porcentajeIgv: 18,
    idAfectacionIgv: afectacionDefault,
  })
  toastSuccess(`${producto.nombre} agregado`)
}

async function confirm() {
  const row = props.comprobante
  const userId = authStore.user?.id
  if (!row || !userId || !canSave.value) return

  if (lineas.value.some((l) => !l.idProducto || l.cantidad <= 0)) {
    toastWarning('Revisa cantidades y productos del detalle')
    return
  }

  for (const linea of lineas.value) {
    const errorCantidad = validarCantidadSegunUnidad(
      Number(linea.cantidad),
      linea.nombreUnidadMedida,
      linea.descripcion,
    )
    if (errorCantidad) {
      toastWarning(errorCantidad)
      return
    }
  }

  if (!idAlmacen.value) {
    toastWarning('Selecciona el almacén')
    return
  }

  try {
    await updateMutation.mutateAsync({
      id: row.id,
      payload: {
        idUsuarioAuditoria: userId,
        idCliente: Number(idCliente.value) || undefined,
        idAlmacen: Number(idAlmacen.value) || undefined,
        fecha: fecha.value,
        glosa: glosa.value.trim() || undefined,
        observaciones: observaciones.value.trim() || undefined,
        detalles: lineas.value.map((linea) => ({
          idProducto: linea.idProducto,
          cantidad: Number(linea.cantidad),
          precioUnitario: Number(linea.precioUnitario),
          descuento: linea.descuento || undefined,
          porcentajeIgv: linea.porcentajeIgv,
          idAfectacionIgv: linea.idAfectacionIgv,
          descripcion: linea.descripcion,
        })),
      },
    })
    open.value = false
  } catch {
    // toast en la mutación
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
    <section class="space-y-4">
      <FormCardsLayout>
        <DetailSectionCard
          title="Comprobante"
          :icon="ICONS.receipt"
          help="Venta de accesorios y productos. Selecciona cliente y almacén, agrega ítems desde el catálogo y confirma en el resumen."
        >
          <template #actions>
            <button
              type="button"
              title="Restablecer formulario"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              :disabled="
                createMutation.isPending.value ||
                emitMutation.isPending.value ||
                imprimiendoTicket
              "
              @click="limpiarFormulario"
            >
              <AppIcon :name="ICONS.brushCleaning" :size="14" />
              Limpiar
            </button>
          </template>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AppSelect
              v-model="idTipoComprobante"
              label="Tipo"
              placeholder="Selecciona"
              :options="tipoComprobanteOptions"
              :disabled="catalogosQuery.isLoading.value"
            />
            <AppInput v-model="serie" label="Serie" placeholder="B001 / F001" disabled />
            <AppInput v-model="numero" label="Número" placeholder="Automático" disabled />
            <AppInput v-model="fecha" label="Fecha" type="date" />
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <PosClienteField
              v-model="idCliente"
              v-model:search="clienteBuscar"
              :options="clienteOptions"
              :loading="clientesQuery.isFetching.value"
              :disabled="clientesQuery.isLoading.value"
              :can-create="canCreateCliente"
              @created="seleccionarCliente"
            />
            <AppInput
              v-model="clienteDescripcion"
              label="Observaciones"
              placeholder="Opcional"
            />
            <AlmacenSelectField
              v-model="idAlmacen"
              searchable
              :required="requiereAlmacen"
              :disabled="almacenesQuery.isLoading.value"
              @created="onAlmacenCreated"
            />
          </div>
        </DetailSectionCard>
      </FormCardsLayout>

      <PosProductPicker
        v-model:search="buscar"
        v-model:filters="dynamicFilters"
        :filter-fields="filterFields"
        :productos="productos"
        :total="productosQuery.data.value?.meta?.total ?? null"
        :loading="productosQuery.isLoading.value || productosQuery.isFetching.value"
        @filter-change="onFiltersChange"
        @add="agregarProducto"
      />
    </section>

    <aside class="space-y-4 xl:sticky xl:top-20 xl:self-start">
      <DetailSectionCard
        title="Carrito"
        :icon="ICONS.boxes"
        help="Revisa cantidades y precios antes de guardar. El total del resumen incluye IGV según el tipo de comprobante."
      >
        <template #actions>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ lineasActivas.length }} ítem{{ lineasActivas.length === 1 ? '' : 's' }}
          </span>
        </template>

        <div
          v-if="lineasActivas.length === 0"
          class="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          Toca un producto en el catálogo para agregarlo.
        </div>

        <div v-else class="max-h-[min(50vh,420px)] space-y-3 overflow-y-auto pr-1">
          <div
            v-for="linea in lineasActivas"
            :key="linea.key"
            class="rounded-xl border border-gray-100 p-3 dark:border-gray-800"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ linea.nombre }}
                </p>
                <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ linea.codigo }}</p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-lg p-1.5 text-error-500 hover:bg-error-500/10"
                @click="quitarLinea(linea.key)"
              >
                <AppIcon :name="ICONS.trash" :size="16" />
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <CantidadUnidadInput
                v-model="linea.cantidad"
                :name="`pos-accesorios-cantidad-${linea.key}`"
                :nombre-unidad="linea.nombreUnidadMedida ?? 'UNID'"
                label="Cant"
              />
              <AppFormField label="P. unit.">
                <MoneyInput
                  v-model="linea.precioUnitario"
                  placeholder="0.00"
                  @blur="blurPrecioLinea(linea)"
                />
              </AppFormField>
            </div>

            <p class="mt-2 text-right text-sm font-medium tabular-nums text-gray-700 dark:text-gray-300">
              {{ formatPosMoney(calcularImporteLinea(linea)) }}
            </p>
          </div>
        </div>
      </DetailSectionCard>

      <PosResumenAside
        v-model:glosa="glosa"
        v-model:id-condicion-pago="idCondicionPago"
        v-model:id-medio-pago="idMedioPago"
        :totales="totales"
        :condicion-pago-options="condicionPagoOptions"
        :medio-pago-options="medioPagoOptions"
        :es-venta-credito="esVentaCredito"
        :dias-credito="diasCredito"
        :numero-cuotas="numeroCuotasCondicion"
        :dia-mes-pago="diaMesPagoCondicion"
        :fecha-vencimiento="fechaVencimiento"
        :motivo-no-guardar="motivoNoGuardar"
        :puede-guardar="puedeGuardar"
        :guardando="createMutation.isPending.value"
        :emitiendo="emitMutation.isPending.value || imprimiendoTicket"
        :can-emit="canEmit"
        :can-print="canPrint"
        :es-nota-venta="esNotaVenta"
        :comprobante-guardado-id="comprobanteGuardadoId"
        :comprobante-guardado-serie="comprobanteGuardadoSerie"
        :comprobante-guardado-numero="comprobanteGuardadoNumero"
        guardar-label="Guardar comprobante"
        guardando-label="Guardando..."
        @guardar="guardarComprobante"
        @emitir="emitirComprobante"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { categoriasProductoService } from '@/modules/productos/categorias/services/categorias-producto.service'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { subCategoriasProductoService } from '@/modules/productos/sub-categorias/services/sub-categorias-producto.service'
import type { SubCategoriaProducto } from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type { Producto, ProductoListFilters } from '@/modules/productos/articulos/interfaces/producto.interface'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import CantidadUnidadInput from '@/modules/ventas/comprobantes/components/CantidadUnidadInput.vue'
import PosClienteField from '@/modules/ventas/comprobantes/components/PosClienteField.vue'
import PosProductPicker from '@/modules/ventas/comprobantes/components/PosProductPicker.vue'
import PosResumenAside from '@/modules/ventas/comprobantes/components/PosResumenAside.vue'
import {
  useCreateComprobanteMutation,
  useEmitirComprobanteMutation,
} from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import { usePosAlmacenDefault } from '@/modules/ventas/comprobantes/composables/usePosAlmacenDefault'
import {
  calcularTotalesDesdeImporte,
  formatPosMoney,
  usePosComprobanteForm,
} from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import type { PosLineItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import {
  emitirConImpresionTicket,
  imprimirTicketSinEmision,
} from '@/modules/ventas/comprobantes/utils/imprimirTicketTrasEmision'
import { OrigenPos } from '@/modules/ventas/comprobantes/constants/origenPos'
import { validarStockParaAgregar } from '@/modules/ventas/comprobantes/utils/stockPos'
import { validarCantidadSegunUnidad } from '@/modules/ventas/comprobantes/utils/unidadMedidaCantidad'
import { AppInput, AppSelect, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'
import {
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  roundMoney,
} from '@/shared/utils/currency'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'

const {
  authStore,
  catalogosQuery,
  clientesQuery,
  clienteBuscar,
  idTipoComprobante,
  serie,
  numero,
  fecha,
  idCliente,
  idCondicionPago,
  idMedioPago,
  canEmit,
  canPrint,
  canCreateCliente,
  tipoComprobanteOptions,
  esNotaVenta,
  clienteOptions,
  condicionPagoOptions,
  medioPagoOptions,
  esVentaCredito,
  diasCredito,
  numeroCuotasCondicion,
  diaMesPagoCondicion,
  fechaVencimiento,
  idAfectacionGravado,
  idMonedaPen,
  idTipoOperacionVentaInterna,
  mensajeValidacionComprobante,
  reiniciarTrasOperacion,
  seleccionarCliente,
  clienteDescripcion,
} = usePosComprobanteForm()

const createMutation = useCreateComprobanteMutation()
const emitMutation = useEmitirComprobanteMutation()
const imprimiendoTicket = ref(false)

const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)
const idAlmacen = ref<number | ''>('')
const almacenesData = computed(() => almacenesQuery.data.value?.data)
const { aplicarAlmacenPorDefecto } = usePosAlmacenDefault(almacenesData, idAlmacen)

async function onAlmacenCreated() {
  await almacenesQuery.refetch()
}

const categorias = ref<CategoriaProducto[]>([])
const subCategorias = ref<SubCategoriaProducto[]>([])
const dynamicFilters = ref<DynamicFilterValues>({})
const buscar = ref('')

const filters = ref<ProductoListFilters>({
  buscar: '',
  pagina: 1,
  limite: 500,
  esGas: false,
  esServicio: false,
  incluirImagenes: true,
})

const productosQuery = useProductosQuery(filters)

const glosa = ref('')
const comprobanteGuardadoId = ref<number | null>(null)
const comprobanteGuardadoSerie = ref<string | null>(null)
const comprobanteGuardadoNumero = ref<string | null>(null)
type PosLineItemEdit = Omit<PosLineItem, 'precioUnitario'> & { precioUnitario: string }

const lineas = ref<PosLineItemEdit[]>([])

const productosBase = computed(() => productosQuery.data.value?.data ?? [])

const productos = computed(() => {
  const marca = dynamicFilters.value.marca
  if (!marca) return productosBase.value

  return productosBase.value.filter((producto) => producto.marca === marca)
})

/**
 * IDs vistos en el catálogo de la pestaña (esGas/esServicio ya filtrados).
 * Se acumulan cuando no hay filtro de categoría, para no perder opciones al filtrar.
 */
const categoriaIdsEnPestana = ref<Set<number>>(new Set())
const subCategoriaIdsEnPestana = ref<Set<number>>(new Set())

watch(
  productosBase,
  (list) => {
    if (dynamicFilters.value.idCategoria != null) return

    const cats = new Set(categoriaIdsEnPestana.value)
    const subs = new Set(subCategoriaIdsEnPestana.value)
    for (const producto of list) {
      if (producto.id_categoria != null) cats.add(producto.id_categoria)
      if (producto.id_sub_categoria != null) subs.add(producto.id_sub_categoria)
    }
    categoriaIdsEnPestana.value = cats
    subCategoriaIdsEnPestana.value = subs
  },
  { immediate: true },
)

const categoriasEnPestana = computed(() => {
  const ids = new Set(categoriaIdsEnPestana.value)
  const selected = dynamicFilters.value.idCategoria
  if (selected != null) ids.add(Number(selected))

  return categorias.value
    .filter((categoria) => ids.has(categoria.id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
})

const subCategoriasEnPestana = computed(() => {
  const ids = new Set(subCategoriaIdsEnPestana.value)
  const selected = dynamicFilters.value.idSubCategoria
  if (selected != null) ids.add(Number(selected))

  return subCategorias.value
    .filter((subCategoria) => ids.has(subCategoria.id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
})

const filterFields = computed<DynamicFilterFieldDef[]>(() => {
  const categoriaId =
    dynamicFilters.value.idCategoria != null
      ? Number(dynamicFilters.value.idCategoria)
      : null

  const marcas = new Set<string>()
  for (const producto of productosBase.value) {
    const valor = producto.marca?.trim()
    if (valor) marcas.add(valor)
  }

  return [
    {
      key: 'idCategoria',
      label: 'Categoría',
      type: 'select',
      placeholder: 'Seleccionar categoría',
      options: categoriasEnPestana.value.map((categoria) => ({
        value: categoria.id,
        label: categoria.nombre,
      })),
    },
    {
      key: 'idSubCategoria',
      label: 'Subcategoría',
      type: 'select',
      placeholder: 'Seleccionar subcategoría',
      disabled: !categoriaId,
      options: subCategoriasEnPestana.value
        .filter((subCategoria) =>
          categoriaId ? subCategoria.id_categoria === categoriaId : true,
        )
        .map((subCategoria) => ({
          value: subCategoria.id,
          label: subCategoria.nombre,
        })),
    },
    {
      key: 'marca',
      label: 'Marca',
      type: 'select',
      placeholder: 'Seleccionar marca',
      options: [...marcas].sort((a, b) => a.localeCompare(b, 'es')).map((valor) => ({
        value: valor,
        label: valor,
      })),
    },
  ]
})

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const loadCatalogos = async () => {
  try {
    const [categoriasResponse, subCategoriasResponse] = await Promise.all([
      categoriasProductoService.listar({ pagina: 1, limite: 100 }),
      subCategoriasProductoService.listar({ pagina: 1, limite: 500 }),
    ])
    categorias.value = categoriasResponse.data
    subCategorias.value = subCategoriasResponse.data
  } catch {
    categorias.value = []
    subCategorias.value = []
  }
}

const syncFilters = () => {
  const active = dynamicFilters.value

  filters.value = {
    buscar: buscar.value.trim(),
    pagina: 1,
    limite: 500,
    esGas: false,
    esServicio: false,
    soloActivos: 1,
    incluirImagenes: true,
    idAlmacen: idAlmacen.value ? Number(idAlmacen.value) : undefined,
    idCategoria: active.idCategoria != null ? Number(active.idCategoria) : undefined,
    idSubCategoria:
      active.idSubCategoria != null ? Number(active.idSubCategoria) : undefined,
  }
}

const onFiltersChange = () => {
  const active = { ...dynamicFilters.value }
  const categoriaId =
    active.idCategoria != null ? Number(active.idCategoria) : null

  if (active.idSubCategoria != null) {
    const subCategoria = subCategorias.value.find(
      (item) => item.id === Number(active.idSubCategoria),
    )

    if (!categoriaId || subCategoria?.id_categoria !== categoriaId) {
      delete active.idSubCategoria
      dynamicFilters.value = active
    }
  }

  syncFilters()
}

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    syncFilters()
  }, 350)
})

watch(idAlmacen, () => {
  syncFilters()
})

onMounted(() => {
  void loadCatalogos()
  syncFilters()
})

const lineasActivas = computed(() =>
  lineas.value.filter((linea) => linea.idProducto && Number(linea.cantidad) > 0),
)

const requiereAlmacen = computed(() =>
  lineasActivas.value.some((linea) => linea.afectaStock !== false),
)

const totales = computed(() => {
  const importeConIgv = lineasActivas.value.reduce(
    (sum, linea) => sum + calcularImporteLinea(linea),
    0,
  )
  return calcularTotalesDesdeImporte(importeConIgv)
})

const motivoNoGuardar = computed(() => {
  if (comprobanteGuardadoId.value) return null
  const base = mensajeValidacionComprobante()
  if (base) return base
  if (!lineasActivas.value.length) return 'Añade al menos un ítem'
  if (requiereAlmacen.value && !idAlmacen.value) return 'Selecciona el almacén'
  for (const linea of lineasActivas.value) {
    if (
      validarCantidadSegunUnidad(
        Number(linea.cantidad),
        linea.nombreUnidadMedida ?? 'UNID',
      )
    ) {
      return `${linea.nombre}: cantidad inválida para la unidad`
    }
    const errorPrecio = mensajeErrorMontoMoneda(linea.precioUnitario, { min: 0, allowZero: true })
    if (errorPrecio) return `${linea.nombre}: ${errorPrecio}`
  }
  return null
})

const puedeGuardar = computed(() => !comprobanteGuardadoId.value && motivoNoGuardar.value === null)

function crearLineaDesdeProducto(producto: Producto): PosLineItemEdit {
  return {
    key: crypto.randomUUID(),
    idProducto: producto.id,
    codigo: producto.codigo,
    nombre: producto.nombre,
    cantidad: 1,
    precioUnitario: roundMoney(Number(producto.precio ?? 0)).toFixed(2),
    idAfectacionIgv: idAfectacionGravado.value,
    afectaStock: producto.afecta_stock !== false,
    stockDisponible: producto.stock_actual ?? null,
    nombreUnidadMedida: producto.nombre_unidad_medida ?? 'UNID',
  }
}

function agregarProducto(producto: Producto) {
  const existente = lineas.value.find((linea) => linea.idProducto === producto.id)
  const cantidadDeseada = existente
    ? Math.max(1, Math.round(Number(existente.cantidad || 0) + 1))
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
    existente.stockDisponible = producto.stock_actual ?? existente.stockDisponible
    toastSuccess(`${producto.nombre}: cantidad ${existente.cantidad}`)
    return
  }

  lineas.value.push(crearLineaDesdeProducto(producto))
  toastSuccess(`${producto.nombre} agregado`)
}

function quitarLinea(key: string) {
  lineas.value = lineas.value.filter((linea) => linea.key !== key)
}

function calcularImporteLinea(linea: PosLineItemEdit) {
  return Number(linea.cantidad || 0) * (parseMoneyInput(linea.precioUnitario) ?? 0)
}

function blurPrecioLinea(linea: PosLineItemEdit) {
  const n = parseMoneyInput(linea.precioUnitario)
  if (n != null) linea.precioUnitario = roundMoney(n).toFixed(2)
}

async function guardarComprobante() {
  const userId = authStore.user?.id
  if (!userId) {
    toastWarning('Sesión inválida')
    return
  }

  const errorValidacion = mensajeValidacionComprobante()
  if (errorValidacion) {
    toastWarning(errorValidacion)
    return
  }

  if (requiereAlmacen.value && !idAlmacen.value) {
    toastWarning('Selecciona el almacén para descontar stock')
    return
  }

  for (const linea of lineasActivas.value) {
    const errorCantidad = validarCantidadSegunUnidad(
      Number(linea.cantidad),
      linea.nombreUnidadMedida ?? 'UNID',
      linea.nombre,
    )
    if (errorCantidad) {
      toastWarning(errorCantidad)
      return
    }

    if (linea.afectaStock === false) continue
    const stock = linea.stockDisponible
    if (stock != null && Number(linea.cantidad) > Number(stock)) {
      toastWarning(
        `${linea.nombre}: stock insuficiente (disponible: ${stock})`,
      )
      return
    }
    if (stock != null && Number(stock) <= 0) {
      toastWarning(`${linea.nombre} no tiene stock disponible`)
      return
    }
  }

  const comprobante = await createMutation.mutateAsync({
    idUsuarioAuditoria: userId,
    idTipoComprobante: Number(idTipoComprobante.value),
    serie: serie.value.trim(),
    numero: numero.value || undefined,
    fecha: fecha.value,
    idCliente: Number(idCliente.value),
    idAlmacen: idAlmacen.value ? Number(idAlmacen.value) : undefined,
    detalles: lineasActivas.value.map((linea) => ({
      idProducto: Number(linea.idProducto),
      cantidad: Number(linea.cantidad),
      precioUnitario: roundMoney(parseMoneyInput(linea.precioUnitario) ?? 0),
      descuento: 0,
      porcentajeIgv: 18,
      idAfectacionIgv: linea.idAfectacionIgv ?? idAfectacionGravado.value,
      descripcion: linea.nombre,
    })),
    idTipoOperacionSunat: idTipoOperacionVentaInterna.value,
    idMoneda: idMonedaPen.value,
    idCondicionPago: idCondicionPago.value ? Number(idCondicionPago.value) : undefined,
    idMedioPago: idMedioPago.value ? Number(idMedioPago.value) : undefined,
    fechaVencimiento: esVentaCredito.value ? fechaVencimiento.value || undefined : undefined,
    glosa: glosa.value || undefined,
    observaciones: clienteDescripcion.value || undefined,
    origenPos: OrigenPos.ACCESORIOS,
  })

  comprobanteGuardadoId.value = comprobante.id
  comprobanteGuardadoSerie.value = comprobante.serie
  comprobanteGuardadoNumero.value = comprobante.numero
}

async function limpiarFormulario() {
  lineas.value = []
  glosa.value = ''
  idAlmacen.value = ''
  comprobanteGuardadoId.value = null
  comprobanteGuardadoSerie.value = null
  comprobanteGuardadoNumero.value = null
  await reiniciarTrasOperacion()
  await productosQuery.refetch()
  await almacenesQuery.refetch()
  aplicarAlmacenPorDefecto()
}

async function emitirComprobante() {
  const userId = authStore.user?.id
  if (!userId || !comprobanteGuardadoId.value) return

  const id = comprobanteGuardadoId.value
  try {
    if (esNotaVenta.value) {
      imprimiendoTicket.value = true
      const resultado = await imprimirTicketSinEmision(id)
      if (resultado === 'sin_ventana') {
        toastWarning(
          'Venta sin documento guardada. Permite ventanas emergentes para imprimir el ticket.',
        )
      } else {
        toastSuccess('Ticket de venta sin documento listo para imprimir')
      }
      await limpiarFormulario()
      return
    }

    const resultado = await emitirConImpresionTicket({
      comprobanteId: id,
      emitir: () =>
        emitMutation.mutateAsync({
          id,
          idUsuarioAuditoria: userId,
        }),
    })

    if (resultado === 'sin_ventana') {
      toastWarning(
        'Emitido OK. Permite ventanas emergentes en la URL para imprimir el ticket automáticamente.',
      )
    }

    await limpiarFormulario()
  } catch {
    // mutateAsync ya muestra el toast de error
  } finally {
    imprimiendoTicket.value = false
  }
}
</script>

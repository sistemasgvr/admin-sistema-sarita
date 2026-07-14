<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
    <section class="space-y-4">
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AppSelect
            v-model="idTipoComprobante"
            label="Tipo"
            placeholder="Selecciona"
            :options="tipoComprobanteOptions"
            :disabled="catalogosQuery.isLoading.value"
          />
          <AppInput v-model="serie" label="Serie" placeholder="B001 / F001" />
          <AppInput v-model="numero" label="Número" placeholder="Automático" readonly />
          <AppInput v-model="fecha" label="Fecha" type="date" />
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppSelectSearch
            v-model="idCliente"
            v-model:search="clienteBuscar"
            remote
            label="Cliente"
            placeholder="Selecciona cliente"
            search-placeholder="Razón social, documento o código..."
            :options="clienteOptions"
            :loading="clientesQuery.isFetching.value"
            :disabled="clientesQuery.isLoading.value"
          />
          <AppSelectSearch
            v-model="idAlmacen"
            v-model:search="almacenBuscar"
            label="Almacén"
            placeholder="Selecciona almacén"
            search-placeholder="Nombre..."
            :options="almacenOptions"
            :loading="almacenesQuery.isLoading.value"
            :disabled="almacenesQuery.isLoading.value"
            :required="requiereAlmacen"
          />
        </div>
      </div>

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

    <aside class="space-y-4 xl:sticky xl:top-4 xl:self-start">
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Carrito</h3>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ lineasActivas.length }} ítem{{ lineasActivas.length === 1 ? '' : 's' }}
          </span>
        </div>

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
              <AppInput
                v-model="linea.cantidad"
                label="Cant."
                type="number"
                :min="NUMBER_MIN.unit"
                :step="NUMBER_STEP.unit"
              />
              <AppInput
                v-model="linea.precioUnitario"
                label="P. unit."
                type="number"
                :min="NUMBER_MIN.money"
                :step="NUMBER_STEP.money"
              />
            </div>

            <p class="mt-2 text-right text-sm font-medium tabular-nums text-gray-700 dark:text-gray-300">
              {{ formatPosMoney(calcularImporteLinea(linea)) }}
            </p>
          </div>
        </div>
      </div>

      <PosResumenAside
        v-model:glosa="glosa"
        :totales="totales"
        :puede-guardar="puedeGuardar"
        :guardando="createMutation.isPending.value"
        :emitiendo="emitMutation.isPending.value"
        :can-emit="canEmit"
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
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import PosProductPicker from '@/modules/ventas/comprobantes/components/PosProductPicker.vue'
import PosResumenAside from '@/modules/ventas/comprobantes/components/PosResumenAside.vue'
import {
  useCreateComprobanteMutation,
  useEmitirComprobanteMutation,
} from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import {
  calcularTotalesDesdeImporte,
  formatPosMoney,
  usePosComprobanteForm,
} from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import type { PosLineItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import {
  emitirConImpresionTicket,
} from '@/modules/ventas/comprobantes/utils/imprimirTicketTrasEmision'
import { AppInput, AppSelect, AppSelectSearch } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'
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
  canEmit,
  tipoComprobanteOptions,
  clienteOptions,
  idAfectacionGravado,
  idMonedaPen,
  idTipoOperacionVentaInterna,
  comprobanteBaseValido,
  mensajeValidacionComprobante,
  reiniciarTrasOperacion,
} = usePosComprobanteForm()

const createMutation = useCreateComprobanteMutation()
const emitMutation = useEmitirComprobanteMutation()

const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)
const idAlmacen = ref<number | ''>('')
const almacenBuscar = ref('')

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
})

const productosQuery = useProductosQuery(filters)

const glosa = ref('')
const comprobanteGuardadoId = ref<number | null>(null)
const comprobanteGuardadoSerie = ref<string | null>(null)
const comprobanteGuardadoNumero = ref<string | null>(null)
const lineas = ref<PosLineItem[]>([])

const productosBase = computed(() => productosQuery.data.value?.data ?? [])

const almacenOptions = computed(() =>
  (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
)

const productos = computed(() => {
  const marca = dynamicFilters.value.marca
  if (!marca) return productosBase.value

  return productosBase.value.filter((producto) => producto.marca === marca)
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
      options: categorias.value.map((categoria) => ({
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
      options: subCategorias.value
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

onMounted(() => {
  void loadCatalogos()
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

const puedeGuardar = computed(
  () =>
    comprobanteBaseValido() &&
    lineasActivas.value.length > 0 &&
    (!requiereAlmacen.value || Boolean(idAlmacen.value)),
)

function crearLineaDesdeProducto(producto: Producto): PosLineItem {
  return {
    key: crypto.randomUUID(),
    idProducto: producto.id,
    codigo: producto.codigo,
    nombre: producto.nombre,
    cantidad: 1,
    precioUnitario: Number(producto.precio ?? 0),
    idAfectacionIgv: idAfectacionGravado.value,
    afectaStock: producto.afecta_stock !== false,
  }
}

function agregarProducto(producto: Producto) {
  const existente = lineas.value.find((linea) => linea.idProducto === producto.id)

  if (existente) {
    existente.cantidad = Math.max(1, Math.round(Number(existente.cantidad || 0) + 1))
    toastSuccess(`${producto.nombre}: cantidad ${existente.cantidad}`)
    return
  }

  lineas.value.push(crearLineaDesdeProducto(producto))
  toastSuccess(`${producto.nombre} agregado`)
}

function quitarLinea(key: string) {
  lineas.value = lineas.value.filter((linea) => linea.key !== key)
}

function calcularImporteLinea(linea: PosLineItem) {
  return Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0)
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
      precioUnitario: Number(linea.precioUnitario),
      descuento: 0,
      porcentajeIgv: 18,
      idAfectacionIgv: linea.idAfectacionIgv ?? idAfectacionGravado.value,
      descripcion: linea.nombre,
    })),
    idTipoOperacionSunat: idTipoOperacionVentaInterna.value,
    idMoneda: idMonedaPen.value,
    glosa: glosa.value || undefined,
  })

  comprobanteGuardadoId.value = comprobante.id
  comprobanteGuardadoSerie.value = comprobante.serie
  comprobanteGuardadoNumero.value = comprobante.numero
}

async function limpiarTrasEmitir() {
  lineas.value = []
  glosa.value = ''
  idAlmacen.value = ''
  almacenBuscar.value = ''
  comprobanteGuardadoId.value = null
  comprobanteGuardadoSerie.value = null
  comprobanteGuardadoNumero.value = null
  await reiniciarTrasOperacion()
  await productosQuery.refetch()
  await almacenesQuery.refetch()
}

async function emitirComprobante() {
  const userId = authStore.user?.id
  if (!userId || !comprobanteGuardadoId.value) return

  const id = comprobanteGuardadoId.value
  try {
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

    await limpiarTrasEmitir()
  } catch {
    // mutateAsync ya muestra el toast de error
  }
}
</script>

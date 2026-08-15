<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
    <section>
      <FormCardsLayout>
        <DetailSectionCard
          title="Kit medicinal"
          :icon="ICONS.receipt"
          help="Kit comercial: cilindro en préstamo + regulador en alquiler + descartables/flete en venta. El cilindro no se alquila."
        >
          <template #actions>
            <button
              type="button"
              title="Restablecer formulario"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              :disabled="guardando || emitMutation.isPending.value || imprimiendoTicket"
              @click="limpiarFormulario"
            >
              <AppIcon :name="ICONS.brushCleaning" :size="14" />
              Limpiar
            </button>
          </template>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AppSelect
              v-model="idTipoComprobante"
              label="Comprobante"
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
              required
              @created="seleccionarCliente"
            />
            <AppInput
              v-model="observacion"
              label="Observaciones"
              placeholder="Opcional"
            />
            <AlmacenSelectField
              v-model="idAlmacen"
              searchable
              required
              :disabled="almacenesQuery.isLoading.value"
              @created="onAlmacenCreated"
            />
          </div>

          <div class="mt-5 min-w-0 overflow-hidden">
            <PosBalonSelectField
              v-model="idBalon"
              mode="alquiler"
              :id-cliente="idCliente"
              :id-almacen="idAlmacen"
              familia-gas="medicinal"
              label="Cilindro a prestar"
              placeholder="Selecciona cilindro medicinal disponible"
              register-label="Registrar cilindro en almacén"
              empty-text="Sin cilindros medicinales disponibles."
              required
            />
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Custodia del envase = <strong>préstamo</strong>. Lo que se alquila es el regulador del kit.
            </p>
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="Líneas del kit"
          :icon="ICONS.boxes"
          help="Ejemplo: gas ~165 + alquiler regulador ~70 (2 semanas) + descartables ~50 + flete ~15 ≈ 285. Descartables = venta."
        >
          <div class="space-y-4">
            <div
              v-for="linea in lineasFijas"
              :key="linea.key"
              class="rounded-xl border border-gray-100 p-3 dark:border-gray-800"
            >
              <div class="mb-2 flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ KIT_MEDICINAL_ROL_LABEL[linea.rol] }}
                  <span v-if="linea.rol === 'regulador'" class="text-error-500">*</span>
                </p>
                <span class="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                  {{ formatPosMoney(importeLineaKit(linea)) }}
                </span>
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_88px_110px]">
                <AppSelectSearch
                  v-model="linea.idProducto"
                  v-model:search="linea.buscar"
                  :label="labelProductoParaRol(linea.rol)"
                  placeholder="Selecciona..."
                  search-placeholder="Código o nombre..."
                  remote
                  :options="optionsParaRol(linea.rol)"
                  :loading="loadingProductosParaRol(linea.rol)"
                  :required="linea.rol === 'regulador'"
                  @update:model-value="(id) => onProductoLinea(linea, id)"
                  @update:search="(term) => onBuscarProductoRol(linea.rol, term)"
                />
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
            </div>

            <div
              v-for="linea in lineasDescartables"
              :key="linea.key"
              class="rounded-xl border border-gray-100 p-3 dark:border-gray-800"
            >
              <div class="mb-2 flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ KIT_MEDICINAL_ROL_LABEL.descartable }}
                </p>
                <button
                  type="button"
                  class="rounded-lg p-1.5 text-error-500 hover:bg-error-500/10"
                  title="Quitar descartable"
                  @click="quitarDescartable(linea.key)"
                >
                  <AppIcon :name="ICONS.trash" :size="16" />
                </button>
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_88px_110px]">
                <AppSelectSearch
                  v-model="linea.idProducto"
                  v-model:search="linea.buscar"
                  label="Producto (venta)"
                  placeholder="Selecciona..."
                  search-placeholder="Código o nombre..."
                  remote
                  :options="productoVentaOptions"
                  :loading="productosVentaQuery.isLoading.value"
                  @update:search="(term) => onBuscarProductoRol('descartable', term)"
                  @update:model-value="(id) => onProductoLinea(linea, id)"
                />
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
                {{ formatPosMoney(importeLineaKit(linea)) }}
              </p>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
              @click="agregarDescartable"
            >
              <AppIcon :name="ICONS.plus" :size="14" />
              Agregar descartable
            </button>
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="Contrato de alquiler"
          :icon="ICONS.calendar"
          help="El contrato guarda el regulador (producto) y su tarifa para renovaciones. El cilindro solo se registra como entrega física en el detalle."
        >
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AppInput v-model="fechaInicio" label="Inicio" type="date" />
            <AppInput v-model="fechaFinPactada" label="Fin pactado" type="date" required />
            <AppInput
              v-model="tarifaPeriodo"
              label="Tarifa regulador (periodo)"
              type="number"
              min="0"
              step="0.01"
            />
            <AppInput
              v-model="montoGarantia"
              label="Garantía / depósito"
              type="number"
              :min="NUMBER_MIN.money"
              :step="NUMBER_STEP.money"
              hint="Prefill del producto alquilable. 0 si no se cobra."
            />
          </div>
          <p
            v-if="origenMontoGarantia"
            class="mt-2 text-xs text-gray-500 dark:text-gray-400"
          >
            {{ origenMontoGarantia }}
          </p>
          <div v-if="Number(montoGarantia || 0) > 0" class="mt-4">
            <GarantiaRecepcionFields
              v-model:id-medio-pago="idMedioPagoGarantia"
              v-model:observacion="observacionGarantia"
            />
          </div>
          <div class="mt-5">
            <AppInput v-model="observacion" label="Observación" placeholder="Opcional" />
          </div>
        </DetailSectionCard>
      </FormCardsLayout>
    </section>

    <aside class="space-y-4 xl:sticky xl:top-20 xl:self-start">
      <DetailSectionCard title="Resumen del kit" :icon="ICONS.list">
        <div v-if="lineasActivas.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          Selecciona productos del kit para ver el desglose.
        </div>
        <ul v-else class="space-y-2 text-sm">
          <li
            v-for="linea in lineasActivas"
            :key="linea.key"
            class="flex items-start justify-between gap-2"
          >
            <span class="min-w-0 text-gray-600 dark:text-gray-400">
              <span class="block truncate font-medium text-gray-800 dark:text-white/90">
                {{ linea.nombre || KIT_MEDICINAL_ROL_LABEL[linea.rol] }}
              </span>
              <span class="text-theme-xs">{{ KIT_MEDICINAL_ROL_LABEL[linea.rol] }}</span>
            </span>
            <span class="shrink-0 tabular-nums text-gray-800 dark:text-white/90">
              {{ formatPosMoney(importeLineaKit(linea)) }}
            </span>
          </li>
        </ul>
        <div
          class="mt-3 flex justify-between border-t border-gray-200 pt-2 text-sm font-semibold dark:border-gray-800"
        >
          <span class="text-gray-800 dark:text-white/90">Total kit</span>
          <span class="tabular-nums text-gray-800 dark:text-white/90">{{
            formatPosMoney(totalKit)
          }}</span>
        </div>
      </DetailSectionCard>

      <PosResumenAside
        v-model:glosa="observacion"
        v-model:id-condicion-pago="idCondicionPago"
        v-model:id-medio-pago="idMedioPago"
        v-model:generar-gre="generarGre"
        :mostrar-generar-gre="Boolean(idBalon)"
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
        :guardando="guardando"
        :emitiendo="emitMutation.isPending.value || imprimiendoTicket"
        :can-emit="canEmit"
        :can-print="canPrint"
        :es-nota-venta="esNotaVenta"
        :comprobante-guardado-id="comprobanteGuardadoId"
        :comprobante-guardado-serie="comprobanteGuardadoSerie"
        :comprobante-guardado-numero="comprobanteGuardadoNumero"
        guardar-label="Registrar kit medicinal"
        guardando-label="Registrando..."
        @guardar="registrarKit"
        @emitir="emitirComprobante"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import GarantiaRecepcionFields from '@/modules/balones/garantias/components/GarantiaRecepcionFields.vue'
import { catalogoPreciosService } from '@/modules/productos/catalogo-precios/services/catalogo-precios.service'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import PosClienteField from '@/modules/ventas/comprobantes/components/PosClienteField.vue'
import PosResumenAside from '@/modules/ventas/comprobantes/components/PosResumenAside.vue'
import {
  useCreateComprobanteMutation,
  useEmitirComprobanteMutation,
} from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import {
  addDaysIso,
  crearKitMedicinalInicial,
  crearLineaKit,
  importeLineaKit,
  KIT_MEDICINAL_ROL_LABEL,
  lineasKitConProducto,
  totalKitMedicinal,
  type KitMedicinalLinea,
  type KitMedicinalRol,
} from '@/modules/ventas/comprobantes/composables/usePosKitMedicinal'
import { OrigenPos } from '@/modules/ventas/comprobantes/constants/origenPos'
import { usePosAlmacenDefault } from '@/modules/ventas/comprobantes/composables/usePosAlmacenDefault'
import {
  calcularTotalesDesdeImporte,
  formatPosMoney,
  usePosComprobanteForm,
} from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import {
  emitirConImpresionTicket,
  imprimirTicketSinEmision,
} from '@/modules/ventas/comprobantes/utils/imprimirTicketTrasEmision'
import { AppInput, AppSelect, AppSelectSearch } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { hoyIsoLima } from '@/shared/utils/date'

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
} = usePosComprobanteForm()

const createComprobanteMutation = useCreateComprobanteMutation()
const emitMutation = useEmitirComprobanteMutation()
const imprimiendoTicket = ref(false)

const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

/** Productos alquilables (servicio o físico). */
const serviciosAlquilerFilters = ref({
  pagina: 1,
  limite: 100,
  esAlquilable: true,
  soloActivos: 1,
  buscar: undefined as string | undefined,
})
const serviciosQuery = useProductosQuery(serviciosAlquilerFilters)

/** Contenido / descartables: productos (no servicios). */
const productosVentaFilters = ref({
  pagina: 1,
  limite: 100,
  esServicio: false,
  soloActivos: 1,
  buscar: undefined as string | undefined,
})
const productosVentaQuery = useProductosQuery(productosVentaFilters)

/** Flete: servicios no alquilables. */
const serviciosFleteFilters = ref({
  pagina: 1,
  limite: 100,
  esServicio: true,
  esAlquilable: false,
  soloActivos: 1,
  buscar: undefined as string | undefined,
})
const serviciosFleteQuery = useProductosQuery(serviciosFleteFilters)

const idBalon = ref<number | ''>('')
const idAlmacen = ref<number | ''>('')
const almacenesData = computed(() => almacenesQuery.data.value?.data)
const { aplicarAlmacenPorDefecto } = usePosAlmacenDefault(almacenesData, idAlmacen)

const listaTipoPrestamoId = ref(ListaIds.TIPO_PRESTAMO)
const tiposPrestamoQuery = useListaOpcionesQuery(listaTipoPrestamoId)
const idTipoPrestamoEmpresaCliente = computed(
  () =>
    tiposPrestamoQuery.data.value?.find(
      (item) => (item.nombre ?? '').toUpperCase() === 'ENVASE_EMPRESA_A_CLIENTE',
    )?.id ?? null,
)

const listaEstadoPrestamoId = ref(ListaIds.ESTADO_PRESTAMO)
const estadosPrestamoQuery = useListaOpcionesQuery(listaEstadoPrestamoId)
const idEstadoPrestamoActivo = computed(
  () =>
    estadosPrestamoQuery.data.value?.find(
      (item) => (item.nombre ?? '').toUpperCase() === 'ACTIVO',
    )?.id ?? null,
)

async function onAlmacenCreated() {
  await almacenesQuery.refetch()
}

const hoy = hoyIsoLima()
const fechaInicio = ref(hoy)
const fechaFinPactada = ref(addDaysIso(hoy, 14))
const tarifaPeriodo = ref(0)
const montoGarantia = ref<number | string>(0)
const idMedioPagoGarantia = ref<string | number>('')
const observacionGarantia = ref('')
const origenMontoGarantia = ref('')
const observacion = ref('')
const generarGre = ref(false)
const guardando = ref(false)

const kitLineas = reactive<KitMedicinalLinea[]>(crearKitMedicinalInicial())
const descartables = reactive<KitMedicinalLinea[]>([])

const comprobanteGuardadoId = ref<number | null>(null)
const comprobanteGuardadoSerie = ref<string | null>(null)
const comprobanteGuardadoNumero = ref<string | null>(null)

const serviciosAlquiler = computed(() => serviciosQuery.data.value?.data ?? [])
const productosVenta = computed(() => productosVentaQuery.data.value?.data ?? [])
const serviciosFlete = computed(() => serviciosFleteQuery.data.value?.data ?? [])

const servicioOptions = computed(() =>
  serviciosAlquiler.value.map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  })),
)

const productoVentaOptions = computed(() =>
  productosVenta.value.map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  })),
)

const servicioFleteOptions = computed(() =>
  serviciosFlete.value.map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  })),
)

const lineasFijas = computed(() =>
  kitLineas.filter((linea) => linea.rol !== 'descartable'),
)

const lineasDescartables = computed(() => descartables)

const todasLasLineas = computed(() => [...kitLineas, ...descartables])

const lineasActivas = computed(() => lineasKitConProducto(todasLasLineas.value))

const totalKit = computed(
  () => totalKitMedicinal(todasLasLineas.value) + Math.max(0, Number(montoGarantia.value || 0)),
)

const totales = computed(() => calcularTotalesDesdeImporte(totalKit.value))

async function prefillMontoGarantia(producto: Producto) {
  let sugerido = Number(producto.precio_garantia ?? 0)
  let origen = sugerido > 0 ? `producto (${producto.nombre})` : ''
  try {
    const catalogo = await catalogoPreciosService.listar({
      idProducto: producto.id,
      pagina: 1,
      limite: 5,
    })
    const conGarantia = (catalogo.data ?? []).find(
      (row) => row.precio_garantia != null && Number(row.precio_garantia) > 0,
    )
    if (conGarantia) {
      sugerido = Number(conGarantia.precio_garantia)
      origen = `catálogo (${conGarantia.nombre_item})`
    }
  } catch {
    // sin catálogo
  }
  montoGarantia.value = sugerido
  origenMontoGarantia.value =
    sugerido > 0
      ? `Sugerido S/ ${sugerido.toFixed(2)} desde ${origen}`
      : 'Sin precio_garantia configurado — ingresa el monto o déjalo en 0'
}

const lineaRegulador = computed(() => kitLineas.find((linea) => linea.rol === 'regulador'))

const motivoNoGuardar = computed(() => {
  if (comprobanteGuardadoId.value) return null
  const base = mensajeValidacionComprobante()
  if (base) return base
  if (!idBalon.value) return 'Selecciona el cilindro'
  if (!idAlmacen.value) return 'Selecciona el almacén'
  if (!lineaRegulador.value?.idProducto) return 'Selecciona el producto alquilable'
  if (!fechaInicio.value) return 'Indica la fecha de inicio'
  if (!lineasActivas.value.length) return 'Completa al menos una línea del kit'
  if (totalKit.value < 0) return 'El total del kit no puede ser negativo'
  return null
})

const puedeGuardar = computed(() => !comprobanteGuardadoId.value && motivoNoGuardar.value === null)

function labelProductoParaRol(rol: KitMedicinalRol) {
  switch (rol) {
    case 'regulador':
      return 'Producto alquilable'
    case 'flete':
      return 'Servicio (flete)'
    case 'contenido':
      return 'Producto (contenido)'
    default:
      return 'Producto'
  }
}

function optionsParaRol(rol: KitMedicinalRol) {
  if (rol === 'regulador') return servicioOptions.value
  if (rol === 'flete') return servicioFleteOptions.value
  return productoVentaOptions.value
}

function loadingProductosParaRol(rol: KitMedicinalRol) {
  if (rol === 'regulador') return serviciosQuery.isLoading.value
  if (rol === 'flete') return serviciosFleteQuery.isLoading.value
  return productosVentaQuery.isLoading.value
}

function onBuscarProductoRol(rol: KitMedicinalRol, term: string) {
  const buscar = term.trim() || undefined
  if (rol === 'regulador') {
    serviciosAlquilerFilters.value = { ...serviciosAlquilerFilters.value, buscar }
    return
  }
  if (rol === 'flete') {
    serviciosFleteFilters.value = { ...serviciosFleteFilters.value, buscar }
    return
  }
  productosVentaFilters.value = { ...productosVentaFilters.value, buscar }
}

function findProducto(rol: KitMedicinalRol, id: number): Producto | undefined {
  if (rol === 'regulador') {
    return serviciosAlquiler.value.find((item) => item.id === id)
  }
  if (rol === 'flete') {
    return serviciosFlete.value.find((item) => item.id === id)
  }
  return productosVenta.value.find((item) => item.id === id)
}

function onProductoLinea(linea: KitMedicinalLinea, id: unknown) {
  const productId = Number(id)
  if (!productId) {
    linea.codigo = ''
    linea.nombre = ''
    linea.precioUnitario = 0
    if (linea.rol === 'regulador') {
      tarifaPeriodo.value = 0
      montoGarantia.value = 0
      idMedioPagoGarantia.value = ''
      observacionGarantia.value = ''
      origenMontoGarantia.value = ''
    }
    return
  }

  const producto = findProducto(linea.rol, productId)
  if (!producto) return

  linea.codigo = producto.codigo
  linea.nombre = producto.nombre
  linea.precioUnitario = Number(producto.precio ?? 0)
  if (linea.rol === 'regulador') {
    tarifaPeriodo.value = Number(producto.precio ?? 0)
    void prefillMontoGarantia(producto)
  }
}

function agregarDescartable() {
  descartables.push(crearLineaKit('descartable'))
}

function quitarDescartable(key: string) {
  const index = descartables.findIndex((linea) => linea.key === key)
  if (index >= 0) descartables.splice(index, 1)
}


async function registrarKit() {
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

  if (!lineaRegulador.value?.idProducto) {
    toastWarning('Selecciona el regulador (alquiler) del kit')
    return
  }
  if (!fechaFinPactada.value) {
    toastWarning('Indica la fecha de fin del alquiler')
    return
  }
  if (fechaFinPactada.value < fechaInicio.value) {
    toastWarning('La fecha de fin no puede ser anterior al inicio')
    return
  }

  const activas = lineasActivas.value
  if (activas.length === 0) {
    toastWarning('Agrega al menos una línea del kit con producto')
    return
  }

  const garantia = Math.max(0, Number(montoGarantia.value || 0))
  if (garantia > 0 && !idMedioPagoGarantia.value) {
    toastWarning('Indica el medio con el que se recibe la garantía')
    return
  }
  if (!idTipoPrestamoEmpresaCliente.value) {
    toastWarning('No se encontró el tipo de préstamo ENVASE_EMPRESA_A_CLIENTE')
    return
  }

  guardando.value = true

  try {
    const idProductoReg = Number(lineaRegulador.value.idProducto)
    const detallesKit = activas.map((linea) => ({
      idProducto: Number(linea.idProducto),
      cantidad: Number(linea.cantidad),
      precioUnitario: Number(linea.precioUnitario),
      descuento: 0,
      porcentajeIgv: 18,
      idAfectacionIgv: idAfectacionGravado.value,
      descripcion: `${KIT_MEDICINAL_ROL_LABEL[linea.rol]}: ${linea.nombre || linea.codigo}`,
      idBalon: linea.rol === 'regulador' ? Number(idBalon.value) : undefined,
    }))
    if (garantia > 0) {
      detallesKit.push({
        idProducto: idProductoReg,
        cantidad: 1,
        precioUnitario: garantia,
        descuento: 0,
        porcentajeIgv: 18,
        idAfectacionIgv: idAfectacionGravado.value,
        descripcion: `Garantía reembolsable — ${lineaRegulador.value.nombre || 'alquiler'}`,
        idBalon: Number(idBalon.value) || undefined,
      })
    }

    const productoReg = findProducto('regulador', idProductoReg)
    const idProductoStock =
      productoReg &&
      productoReg.afecta_stock &&
      !productoReg.es_servicio &&
      !productoReg.es_gas
        ? idProductoReg
        : undefined

    const montoRegulador = importeLineaKit(lineaRegulador.value)
    const comprobante = await createComprobanteMutation.mutateAsync({
      idUsuarioAuditoria: userId,
      idTipoComprobante: Number(idTipoComprobante.value),
      serie: serie.value.trim(),
      numero: numero.value || undefined,
      fecha: fecha.value,
      idCliente: Number(idCliente.value),
      detalles: detallesKit,
      idTipoOperacionSunat: idTipoOperacionVentaInterna.value,
      idMoneda: idMonedaPen.value,
      idCondicionPago: idCondicionPago.value ? Number(idCondicionPago.value) : undefined,
      idMedioPago: idMedioPago.value ? Number(idMedioPago.value) : undefined,
      fechaVencimiento: esVentaCredito.value ? fechaVencimiento.value || undefined : undefined,
      glosa: observacion.value || 'Kit medicinal',
      observaciones: observacion.value || undefined,
      origenPos: OrigenPos.MEDICINAL,
      efectosPos: {
        alquileres: [
          {
            idAlmacen: Number(idAlmacen.value),
            fechaInicio: fechaInicio.value,
            fechaFinPactada: fechaFinPactada.value,
            tarifaDiaria: Number(tarifaPeriodo.value || 0),
            totalCobrado: totalKitMedicinal(todasLasLineas.value),
            idProductoRegulador: idProductoReg,
            idProductoStock,
            observacion: observacion.value || 'Kit medicinal (alquiler regulador)',
            periodo: {
              fechaInicio: fechaInicio.value,
              fechaFin: fechaFinPactada.value || addDaysIso(fechaInicio.value, 14),
              monto: montoRegulador,
              idProducto: idProductoReg,
              observacion: 'Periodo 1 — kit medicinal (regulador)',
            },
            garantia:
              garantia > 0
                ? {
                    monto: garantia,
                    idProducto: idProductoReg,
                    cantidadVenta: 1,
                    fechaRegistro: fecha.value,
                    idMedioPago: Number(idMedioPagoGarantia.value),
                    observacion:
                      observacionGarantia.value.trim() ||
                      `Garantía kit medicinal · ${lineaRegulador.value.nombre || 'alquiler'}`,
                  }
                : undefined,
          },
        ],
        prestamos: [
          {
            idTipoPrestamo: idTipoPrestamoEmpresaCliente.value,
            idAlmacen: Number(idAlmacen.value),
            fechaSalida: fechaInicio.value,
            fechaRetornoPactada: fechaFinPactada.value || undefined,
            idEstado: idEstadoPrestamoActivo.value ?? undefined,
            titulo: `Préstamo kit medicinal · balón #${idBalon.value}`,
            observacion:
              observacion.value ||
              'Cilindro en préstamo junto a alquiler de regulador (kit medicinal)',
            idBalon: Number(idBalon.value),
            fechaEntregado: fechaInicio.value,
            fechaPrestamo: fechaInicio.value,
            fechaVencimiento: fechaFinPactada.value || undefined,
            observacionDetalle: 'Entrega kit medicinal — cilindro en préstamo',
          },
        ],
        generarGre: generarGre.value,
      },
    })

    comprobanteGuardadoId.value = comprobante.id
    comprobanteGuardadoSerie.value = comprobante.serie
    comprobanteGuardadoNumero.value = comprobante.numero
    toastSuccess('Kit medicinal: alquiler de regulador + préstamo de cilindro')
  } catch (error) {
    toastApiError(error, 'No se pudo registrar el kit medicinal')
  } finally {
    guardando.value = false
  }
}

async function limpiarFormulario() {
  idBalon.value = ''
  idAlmacen.value = ''
  const inicio = hoyIsoLima()
  fechaInicio.value = inicio
  fechaFinPactada.value = addDaysIso(inicio, 14)
  tarifaPeriodo.value = 0
  montoGarantia.value = 0
  origenMontoGarantia.value = ''
  idMedioPagoGarantia.value = ''
  observacionGarantia.value = ''
  observacion.value = ''
  generarGre.value = false
  kitLineas.splice(0, kitLineas.length, ...crearKitMedicinalInicial())
  descartables.splice(0, descartables.length)
  comprobanteGuardadoId.value = null
  comprobanteGuardadoSerie.value = null
  comprobanteGuardadoNumero.value = null
  await reiniciarTrasOperacion()
  await Promise.all([serviciosQuery.refetch(), productosVentaQuery.refetch(), almacenesQuery.refetch()])
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

watch(fechaInicio, (inicio) => {
  if (!inicio) return
  if (!fechaFinPactada.value || fechaFinPactada.value < inicio) {
    fechaFinPactada.value = addDaysIso(inicio, 14)
  }
})
</script>

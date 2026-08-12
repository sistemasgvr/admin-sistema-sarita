<template>
  <div class="space-y-4">
    <PosCajaEstadoBanner
      :mensaje="mensajeBloqueoCaja"
      :caja-cerrada="cajaCerrada"
      :pendiente-cierre="hayPendienteCierre || sesionEsPendiente"
      :fecha-pendiente="fechaCajaPendiente"
    />

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
    <section class="space-y-4">
      <FormCardsLayout>
        <DetailSectionCard
          title="Comprobante"
          :icon="ICONS.receipt"
          help="Datos del documento. Luego añade ítems (accesorio, gas, alquiler de accesorio, mantenimiento). En gas: recarga, préstamo de cilindro o venta de envase."
        >
          <template #actions>
            <button
              type="button"
              title="Restablecer formulario"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              :disabled="
                createMutation.isPending.value ||
                emitMutation.isPending.value ||
                imprimiendoTicket ||
                guardandoExtra
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

        <DetailSectionCard
          title="Ítems"
          :icon="ICONS.boxes"
          help="Añade lo que necesite el cliente. Cada ítem abre su propio catálogo y configuración."
        >
          <template #actions>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-600"
              @click="abrirAnadir"
            >
              <AppIcon :name="ICONS.plus" :size="14" />
              Añadir
            </button>
          </template>

          <div
            v-if="lineasActivas.length === 0"
            class="rounded-xl border border-dashed border-gray-200 px-4 py-12 text-center dark:border-gray-700"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Aún no hay ítems. Pulsa <strong>Añadir</strong> para vender un accesorio, gas
              (recarga / préstamo / venta envase), alquiler de accesorio o mantenimiento.
            </p>
            <button
              type="button"
              class="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
              @click="abrirAnadir"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
              Añadir ítem
            </button>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="linea in lineasActivas"
              :key="linea.key"
              class="rounded-xl border border-gray-100 p-3 dark:border-gray-800"
            >
              <div class="flex items-start justify-between gap-2">
                <button
                  type="button"
                  class="min-w-0 flex-1 rounded-lg text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  title="Editar detalles"
                  @click="abrirEditarLinea(linea)"
                >
                  <div class="mb-1 flex flex-wrap gap-1">
                    <span
                      class="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      :class="badgeClass(linea)"
                    >
                      {{ badgeLabel(linea) }}
                    </span>
                    <span
                      v-if="linea.escenarioGas === 'comprar_balon'"
                      class="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
                    >
                      + Envase
                    </span>
                    <span
                      v-else-if="esEntregarPrestamo(linea)"
                      class="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400"
                    >
                      + Préstamo
                    </span>
                    <span
                      v-if="
                        (esEntregarPrestamo(linea) ||
                          linea.tipoPos === 'alquiler' ||
                          linea.esAlquilable) &&
                        Number(linea.montoGarantia || 0) > 0
                      "
                      class="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400"
                    >
                      + Garantía
                    </span>
                  </div>
                  <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {{ linea.nombre }}
                  </p>
                  <template v-if="linea.escenarioGas === 'comprar_balon'">
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Gas {{ formatPosMoney(importeGasLinea(linea)) }}
                      + Envase {{ formatPosMoney(Number(linea.precioBalon || 0)) }}
                      = {{ formatPosMoney(calcularImporteLinea(linea)) }}
                    </p>
                    <p class="mt-0.5 truncate text-xs text-brand-600 dark:text-brand-400">
                      {{ resumenLinea(linea) }}
                    </p>
                  </template>
                  <template v-else-if="esEntregarPrestamo(linea)">
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Gas {{ formatPosMoney(importeGasLinea(linea)) }}
                      <template v-if="Number(linea.montoGarantia || 0) > 0">
                        + Garantía {{ formatPosMoney(Number(linea.montoGarantia || 0)) }}
                        = {{ formatPosMoney(calcularImporteLinea(linea)) }}
                      </template>
                      <template v-else>
                        · Préstamo cilindro (sin garantía)
                      </template>
                    </p>
                    <p class="mt-0.5 truncate text-xs text-brand-600 dark:text-brand-400">
                      {{ resumenLinea(linea) }}
                    </p>
                  </template>
                  <template
                    v-else-if="
                      (linea.tipoPos === 'alquiler' || linea.esAlquilable) &&
                      Number(linea.montoGarantia || 0) > 0
                    "
                  >
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Alquiler {{ formatPosMoney(importeGasLinea(linea)) }}
                      + Garantía {{ formatPosMoney(Number(linea.montoGarantia || 0)) }}
                      = {{ formatPosMoney(calcularImporteLinea(linea)) }}
                    </p>
                    <p class="mt-0.5 truncate text-xs text-brand-600 dark:text-brand-400">
                      {{ resumenLinea(linea) }}
                    </p>
                  </template>
                  <template v-else>
                    <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                      {{ linea.codigo }}
                      · Cant. {{ linea.cantidad }}
                      · {{ formatPosMoney(calcularImporteLinea(linea)) }}
                    </p>
                    <p
                      v-if="resumenLinea(linea)"
                      class="mt-1 truncate text-xs text-brand-600 dark:text-brand-400"
                    >
                      {{ resumenLinea(linea) }}
                    </p>
                  </template>
                </button>
                <button
                  type="button"
                  class="shrink-0 rounded-lg p-1.5 text-error-500 hover:bg-error-500/10"
                  @click="quitarLinea(linea.key)"
                >
                  <AppIcon :name="ICONS.trash" :size="16" />
                </button>
              </div>
            </div>

            <button
              type="button"
              class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
              @click="abrirAnadir"
            >
              <AppIcon :name="ICONS.plus" :size="16" />
              Añadir otro ítem
            </button>
          </div>
        </DetailSectionCard>
      </FormCardsLayout>
    </section>

    <aside class="space-y-4 xl:sticky xl:top-20 xl:self-start">
      <DetailSectionCard
        title="Carrito"
        :icon="ICONS.shoppingcard"
        help="Resumen de lo añadido. El total incluye IGV según el tipo de comprobante."
      >
        <template #actions>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ lineasActivas.length }} ítem{{ lineasActivas.length === 1 ? '' : 's' }}
          </span>
        </template>

        <div
          v-if="lineasActivas.length === 0"
          class="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          Los ítems que añadas aparecerán aquí.
        </div>

        <ul v-else class="max-h-[min(40vh,320px)] space-y-2 overflow-y-auto pr-1">
          <li
            v-for="linea in lineasActivas"
            :key="`cart-${linea.key}`"
            class="text-sm"
          >
            <template v-if="linea.escenarioGas === 'comprar_balon'">
              <div class="flex items-baseline justify-between gap-2">
                <span class="min-w-0 truncate text-gray-700 dark:text-gray-300">
                  {{ linea.cantidad }}× {{ linea.nombre }}
                  <span class="text-gray-400">(gas)</span>
                </span>
                <span class="shrink-0 tabular-nums text-gray-700 dark:text-gray-300">
                  {{ formatPosMoney(importeGasLinea(linea)) }}
                </span>
              </div>
              <div class="mt-0.5 flex items-baseline justify-between gap-2 pl-3 text-xs">
                <span class="min-w-0 truncate text-gray-500 dark:text-gray-400">
                  + Venta envase
                  <template v-if="etiquetaCilindro(linea)">
                    · {{ etiquetaCilindro(linea) }}
                  </template>
                </span>
                <span class="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                  {{ formatPosMoney(Number(linea.precioBalon || 0)) }}
                </span>
              </div>
              <div
                class="mt-0.5 flex items-baseline justify-between gap-2 border-t border-dashed border-gray-200 pt-0.5 text-xs dark:border-gray-700"
              >
                <span class="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span class="tabular-nums font-medium text-gray-800 dark:text-white/90">
                  {{ formatPosMoney(calcularImporteLinea(linea)) }}
                </span>
              </div>
            </template>
            <template v-else-if="esEntregarPrestamo(linea)">
              <div class="flex items-baseline justify-between gap-2">
                <span class="min-w-0 truncate text-gray-700 dark:text-gray-300">
                  {{ linea.cantidad }}× {{ linea.nombre }}
                  <span class="text-gray-400">(gas)</span>
                </span>
                <span class="shrink-0 tabular-nums text-gray-700 dark:text-gray-300">
                  {{ formatPosMoney(importeGasLinea(linea)) }}
                </span>
              </div>
              <div class="mt-0.5 flex items-baseline justify-between gap-2 pl-3 text-xs">
                <span class="min-w-0 truncate text-gray-500 dark:text-gray-400">
                  + Préstamo cilindro
                  <template v-if="etiquetaCilindro(linea)">
                    · {{ etiquetaCilindro(linea) }}
                  </template>
                </span>
                <span class="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                  S/ 0.00
                </span>
              </div>
              <div
                v-if="Number(linea.montoGarantia || 0) > 0"
                class="mt-0.5 flex items-baseline justify-between gap-2 pl-3 text-xs"
              >
                <span class="min-w-0 truncate text-amber-600 dark:text-amber-400">
                  + Garantía (depósito)
                </span>
                <span class="shrink-0 tabular-nums text-amber-600 dark:text-amber-400">
                  {{ formatPosMoney(Number(linea.montoGarantia || 0)) }}
                </span>
              </div>
              <div
                v-if="Number(linea.montoGarantia || 0) > 0"
                class="mt-0.5 flex items-baseline justify-between gap-2 border-t border-dashed border-gray-200 pt-0.5 text-xs dark:border-gray-700"
              >
                <span class="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span class="tabular-nums font-medium text-gray-800 dark:text-white/90">
                  {{ formatPosMoney(calcularImporteLinea(linea)) }}
                </span>
              </div>
            </template>
            <div v-else class="flex items-baseline justify-between gap-2">
              <span class="min-w-0 truncate text-gray-700 dark:text-gray-300">
                {{ linea.cantidad }}× {{ linea.nombre }}
              </span>
              <span class="shrink-0 tabular-nums font-medium text-gray-800 dark:text-white/90">
                {{ formatPosMoney(calcularImporteLinea(linea)) }}
              </span>
            </div>
          </li>
        </ul>
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
        :guardando="createMutation.isPending.value || guardandoExtra"
        :emitiendo="emitMutation.isPending.value || imprimiendoTicket"
        :can-emit="canEmit"
        :can-print="canPrint"
        :es-nota-venta="esNotaVenta"
        :comprobante-guardado-id="comprobanteGuardadoId"
        :comprobante-guardado-serie="comprobanteGuardadoSerie"
        :comprobante-guardado-numero="comprobanteGuardadoNumero"
        guardar-label="Guardar venta"
        guardando-label="Guardando..."
        @guardar="guardarComprobante"
        @emitir="emitirComprobante"
      />
    </aside>
    </div>

    <PosAnadirItemModal
      v-model="anadirOpen"
      :id-cliente="idCliente"
      :id-almacen="idAlmacen"
      :nombre-cliente="nombreClienteSeleccionado"
      :es-clientes-varios="esClienteVariosSeleccionado"
      :linea="lineaEditando"
      :producto-edicion="productoEdicion"
      :inicio-preferido="inicioPreferidoAnadir"
      @confirm="onConfirmLinea"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { alquileresService } from '@/modules/balones/alquileres/services/alquileres.service'
import { bajasPendientesService } from '@/modules/balones/bajas-pendientes/services/bajas-pendientes.service'
import { balonesService } from '@/modules/balones/cilindros/services/balones.service'
import { mantenimientosService } from '@/modules/balones/mantenimientos/services/mantenimientos.service'
import { garantiasService } from '@/modules/balones/garantias/services/garantias.service'
import { prestamosDetalleService } from '@/modules/balones/prestamos/services/prestamos-detalle.service'
import { prestamosService } from '@/modules/balones/prestamos/services/prestamos.service'
import { movimientosRecargaService } from '@/modules/balones/recargas/services/movimientos-recarga.service'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import PosCajaEstadoBanner from '@/modules/caja/components/PosCajaEstadoBanner.vue'
import { useCajaAbiertaRequerida } from '@/modules/caja/composables/useCajaAbiertaRequerida'
import PosAnadirItemModal, {
  type PosLineaConfirmada,
} from '@/modules/ventas/comprobantes/components/PosAnadirItemModal.vue'
import PosClienteField from '@/modules/ventas/comprobantes/components/PosClienteField.vue'
import PosResumenAside from '@/modules/ventas/comprobantes/components/PosResumenAside.vue'
import {
  useCreateComprobanteMutation,
  useEmitirComprobanteMutation,
} from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import { usePosAlmacenDefault } from '@/modules/ventas/comprobantes/composables/usePosAlmacenDefault'
import { addDaysIso } from '@/modules/ventas/comprobantes/composables/usePosKitMedicinal'
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
import { productoAfectaStock } from '@/modules/ventas/comprobantes/utils/stockPos'
import { validarCantidadSegunUnidad } from '@/modules/ventas/comprobantes/utils/unidadMedidaCantidad'
import { esClientesVarios } from '@/modules/clientes/utils/clientesVarios'
import { AppInput, AppSelect } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'

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
  clienteSeleccionado,
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

const {
  cajaCerrada,
  puedeOperar,
  hayPendienteCierre,
  sesionEsPendiente,
  pendienteCierre,
  mensajeBloqueo: mensajeBloqueoCaja,
  assertCajaAbierta,
} = useCajaAbiertaRequerida(fecha)

const fechaCajaPendiente = computed(() => {
  if (sesionEsPendiente.value) return String(fecha.value).slice(0, 10)
  return pendienteCierre.value?.fecha ? String(pendienteCierre.value.fecha).slice(0, 10) : null
})

const createMutation = useCreateComprobanteMutation()
const emitMutation = useEmitirComprobanteMutation()
const imprimiendoTicket = ref(false)
const guardandoExtra = ref(false)

const listaMotivoBajaId = ref(ListaIds.MOTIVO_BAJA_BALON)
const motivosBajaQuery = useListaOpcionesQuery(listaMotivoBajaId)
const idMotivoVendido = computed(
  () =>
    motivosBajaQuery.data.value?.find(
      (item) => (item.nombre ?? '').toUpperCase() === 'VENDIDO',
    )?.id ?? null,
)

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

function esEntregarPrestamo(linea: PosLineItem) {
  return (
    linea.escenarioGas === 'entregar_prestamo' ||
    linea.escenarioGas === 'entregar_alquiler'
  )
}

function esRecargaCliente(linea: PosLineItem) {
  return linea.escenarioGas === 'balon_cliente' || linea.escenarioGas === 'solo_gas'
}

const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)
const idAlmacen = ref<number | ''>('')
const almacenesData = computed(() => almacenesQuery.data.value?.data)
const { aplicarAlmacenPorDefecto } = usePosAlmacenDefault(almacenesData, idAlmacen)

const route = useRoute()
const router = useRouter()

const anadirOpen = ref(false)
const lineaEditando = ref<PosLineItem | null>(null)
const productoEdicion = ref<Producto | null>(null)
/** Productos de líneas (para editar sin depender del catálogo visible). */
const productosPorId = ref<Map<number, Producto>>(new Map())
const inicioPreferidoAnadir = ref<'gas' | null>(null)

const glosa = ref('')
const comprobanteGuardadoId = ref<number | null>(null)
const comprobanteGuardadoSerie = ref<string | null>(null)
const comprobanteGuardadoNumero = ref<string | null>(null)
const lineas = ref<PosLineItem[]>([])

async function onAlmacenCreated() {
  await almacenesQuery.refetch()
}

onMounted(() => {
  aplicarAlmacenPorDefecto()

  if (String(route.query.tab ?? '') === 'recarga') {
    inicioPreferidoAnadir.value = 'gas'
    anadirOpen.value = true
    const nextQuery = { ...route.query }
    delete nextQuery.tab
    void router.replace({ query: nextQuery })
  }
})

const lineasActivas = computed(() =>
  lineas.value.filter((linea) => linea.idProducto && Number(linea.cantidad) > 0),
)

function importeGasLinea(linea: PosLineItem) {
  return Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0)
}

function calcularImporteLinea(linea: PosLineItem) {
  const base = importeGasLinea(linea)
  if (linea.escenarioGas === 'comprar_balon') {
    return base + Number(linea.precioBalon || 0)
  }
  if (
    esEntregarPrestamo(linea) ||
    linea.tipoPos === 'alquiler' ||
    Boolean(linea.esAlquilable)
  ) {
    return base + Number(linea.montoGarantia || 0)
  }
  return base
}

const nombreClienteSeleccionado = computed(() => {
  const opt = clienteOptions.value.find((item) => item.value === idCliente.value)
  return opt?.label ?? ''
})

const esClienteVariosSeleccionado = computed(() => esClientesVarios(clienteSeleccionado.value))

const tieneAlquilable = computed(() =>
  lineasActivas.value.some(
    (linea) =>
      linea.esAlquilable ||
      linea.tipoPos === 'alquiler' ||
      esEntregarPrestamo(linea) ||
      linea.escenarioGas === 'comprar_balon',
  ),
)
const tieneMantenimiento = computed(() =>
  lineasActivas.value.some((linea) => linea.esMantenimiento),
)

const requiereAlmacen = computed(
  () =>
    lineasActivas.value.some((linea) => linea.afectaStock !== false) ||
    tieneAlquilable.value,
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
  if (!puedeOperar.value) {
    return mensajeBloqueoCaja.value || 'Debes abrir la caja del día para vender'
  }
  const base = mensajeValidacionComprobante()
  if (base) return base
  if (!lineasActivas.value.length) return 'Añade al menos un ítem a la venta'
  if (requiereAlmacen.value && !idAlmacen.value) return 'Selecciona el almacén'
  if (!idAfectacionGravado.value) return 'Falta la afectación IGV en catálogos'
  for (const linea of lineasActivas.value) {
    if (
      validarCantidadSegunUnidad(
        Number(linea.cantidad),
        linea.nombreUnidadMedida ?? 'UNID',
      )
    ) {
      return `${linea.nombre}: cantidad inválida para la unidad`
    }
    if (linea.escenarioGas === 'comprar_balon' && !(linea.idBalon && linea.idProductoEnvase)) {
      return `${linea.nombre}: falta cilindro o producto envase`
    }
    if (esEntregarPrestamo(linea) && !(linea.idBalon && linea.fechaInicioAlquiler)) {
      return `${linea.nombre}: falta cilindro o fecha de préstamo`
    }
    if (
      (linea.esMantenimiento || esRecargaCliente(linea)) &&
      !(linea.idBalon && (linea.esMantenimiento || linea.idBalonOrigen))
    ) {
      return `${linea.nombre}: falta cilindro u origen de recarga`
    }
    if (
      (linea.tipoPos === 'alquiler' || linea.esAlquilable) &&
      !(linea.fechaInicioAlquiler && linea.fechaFinAlquiler)
    ) {
      return `${linea.nombre}: faltan fechas de alquiler`
    }
  }
  return null
})

const puedeGuardar = computed(
  () => !comprobanteGuardadoId.value && motivoNoGuardar.value === null,
)

function badgeLabel(linea: PosLineItem) {
  if (linea.esMantenimiento || linea.tipoPos === 'mantenimiento') return 'Mantenimiento'
  if (linea.esGas || linea.tipoPos === 'gas') return 'Gas'
  if (linea.esAlquilable || linea.tipoPos === 'alquiler') return 'Alquiler'
  return 'Producto'
}

function badgeClass(linea: PosLineItem) {
  if (linea.esMantenimiento || linea.tipoPos === 'mantenimiento') {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  }
  if (linea.esGas || linea.tipoPos === 'gas') {
    return 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
  }
  if (linea.esAlquilable || linea.tipoPos === 'alquiler') {
    return 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
  }
  return 'bg-gray-500/10 text-gray-600 dark:text-gray-300'
}

function etiquetaCilindro(linea: PosLineItem): string {
  const etiqueta = linea.etiquetaBalon?.trim()
  if (etiqueta) {
    // En listados cortos basta el código (antes del primer ·)
    return etiqueta.split(' · ')[0] || etiqueta
  }
  return linea.idBalon ? `Cilindro #${linea.idBalon}` : ''
}

function resumenLinea(linea: PosLineItem): string {
  const parts: string[] = []
  if (esRecargaCliente(linea)) parts.push('Recarga cliente')
  if (esEntregarPrestamo(linea)) {
    parts.push('Préstamo cilindro')
    if (Number(linea.montoGarantia || 0) > 0) {
      parts.push(`Garantía ${formatPosMoney(Number(linea.montoGarantia || 0))}`)
    }
  }
  if (linea.escenarioGas === 'comprar_balon') {
    parts.push(linea.nombreProductoEnvase?.trim() || 'Venta de envase')
  }

  const cilindro = etiquetaCilindro(linea)
  if (cilindro) parts.push(cilindro)

  if (linea.escenarioGas === 'balon_cliente' && linea.etiquetaBalonOrigen) {
    parts.push(`Origen ${linea.etiquetaBalonOrigen.split(' · ')[0]}`)
  }

  if (
    (linea.tipoPos === 'alquiler' || linea.esAlquilable || esEntregarPrestamo(linea)) &&
    linea.fechaInicioAlquiler
  ) {
    parts.push(
      linea.fechaFinAlquiler
        ? `${linea.fechaInicioAlquiler} / ${linea.fechaFinAlquiler}`
        : `Entrega ${linea.fechaInicioAlquiler}`,
    )
  }
  if (linea.esMantenimiento && linea.fechaIngresoMantenimiento) {
    parts.push(`Ingreso ${linea.fechaIngresoMantenimiento}`)
  }
  if (linea.capacidad != null) parts.push(`Cap. ${linea.capacidad}`)
  if (linea.observacionLinea) parts.push(linea.observacionLinea)
  return parts.join(' · ')
}

function abrirAnadir() {
  lineaEditando.value = null
  productoEdicion.value = null
  inicioPreferidoAnadir.value = null
  anadirOpen.value = true
}

function productoDesdeLinea(linea: PosLineItem): Producto {
  const cached = productosPorId.value.get(linea.idProducto)
  if (cached) return cached

  return {
    id: linea.idProducto,
    codigo: linea.codigo,
    nombre: linea.nombre,
    es_gas: Boolean(linea.esGas),
    es_servicio: Boolean(linea.esServicio),
    es_alquilable: Boolean(linea.esAlquilable),
    afecta_stock: linea.afectaStock !== false,
    precio: Number(linea.precioUnitario || 0),
    stock_actual: linea.stockDisponible ?? null,
    nombre_unidad_medida: linea.nombreUnidadMedida ?? 'UNID',
    estado: 1,
    fecha_creacion: '',
    fecha_modificacion: '',
  }
}

function abrirEditarLinea(linea: PosLineItem) {
  lineaEditando.value = linea
  productoEdicion.value = productoDesdeLinea(linea)
  anadirOpen.value = true
}

function onConfirmLinea(payload: PosLineaConfirmada) {
  const { producto, tipo } = payload
  productosPorId.value.set(producto.id, producto)

  if (lineaEditando.value) {
    const linea = lineaEditando.value
    aplicarPayloadALinea(linea, payload)
    toastSuccess(`${linea.nombre} actualizado`)
    lineaEditando.value = null
    productoEdicion.value = null
    return
  }

  const linea: PosLineItem = {
    key: crypto.randomUUID(),
    idProducto: producto.id,
    codigo: producto.codigo,
    nombre: producto.nombre,
    cantidad: payload.cantidad,
    precioUnitario: payload.precioUnitario,
    idAfectacionIgv: idAfectacionGravado.value,
    afectaStock: productoAfectaStock(producto),
    stockDisponible: producto.stock_actual ?? null,
    nombreUnidadMedida: producto.nombre_unidad_medida ?? 'UNID',
    esGas: tipo === 'gas' || Boolean(producto.es_gas),
    esServicio: Boolean(producto.es_servicio),
    esAlquilable: tipo === 'alquiler' || Boolean(producto.es_alquilable),
    tipoPos: tipo,
    esMantenimiento: tipo === 'mantenimiento',
  }
  aplicarPayloadALinea(linea, payload)
  lineas.value.push(linea)
  toastSuccess(`${producto.nombre} agregado`)
}

function aplicarPayloadALinea(linea: PosLineItem, payload: PosLineaConfirmada) {
  linea.cantidad = payload.cantidad
  linea.precioUnitario = payload.precioUnitario
  linea.idBalon = payload.idBalon
  linea.etiquetaBalon = payload.etiquetaBalon
  linea.idBalonOrigen = payload.idBalonOrigen
  linea.etiquetaBalonOrigen = payload.etiquetaBalonOrigen
  linea.capacidad = payload.capacidad
  linea.fechaInicioAlquiler = payload.fechaInicioAlquiler
  linea.fechaFinAlquiler = payload.fechaFinAlquiler
  linea.observacionLinea = payload.observacionLinea
  linea.tipoPos = payload.tipo
  linea.esMantenimiento = payload.tipo === 'mantenimiento'
  linea.esGas = payload.tipo === 'gas'
  linea.esAlquilable = payload.tipo === 'alquiler'
  linea.escenarioGas = payload.escenarioGas
  linea.precioBalon = payload.precioBalon
  linea.idProductoEnvase = payload.idProductoEnvase
  linea.nombreProductoEnvase = payload.nombreProductoEnvase
  linea.precioAlquiler = payload.precioAlquiler
  linea.idProductoAlquiler = payload.idProductoAlquiler
  linea.nombreProductoAlquiler = payload.nombreProductoAlquiler
  linea.montoGarantia =
    payload.escenarioGas === 'entregar_prestamo' || payload.tipo === 'alquiler'
      ? Math.max(0, Number(payload.montoGarantia || 0))
      : undefined
  if (Number(linea.montoGarantia || 0) > 0) {
    linea.idMedioPagoGarantia = payload.idMedioPagoGarantia
    linea.observacionGarantia = payload.observacionGarantia
  } else {
    linea.idMedioPagoGarantia = undefined
    linea.observacionGarantia = undefined
  }
  linea.idTipoMantenimiento = payload.idTipoMantenimiento
  linea.fechaIngresoMantenimiento = payload.fechaIngresoMantenimiento
  linea.descripcionMantenimiento = payload.descripcionMantenimiento
  if (payload.tipo === 'mantenimiento' && payload.descripcionMantenimiento) {
    linea.nombre = payload.descripcionMantenimiento
  } else if (payload.producto) {
    linea.nombre = payload.producto.nombre
    linea.codigo = payload.producto.codigo
  }
}

function quitarLinea(key: string) {
  lineas.value = lineas.value.filter((linea) => linea.key !== key)
}

function resolverOrigenPos(): string {
  // Carrito unificado: marcar siempre como venta POS, salvo mantenimiento puro.
  if (tieneMantenimiento.value && lineasActivas.value.every((l) => l.esMantenimiento)) {
    return OrigenPos.MANTENIMIENTO
  }
  return OrigenPos.VENTA
}

async function guardarComprobante() {
  const userId = authStore.user?.id
  if (!userId) {
    toastWarning('Sesión inválida')
    return
  }

  if (!assertCajaAbierta()) return

  if (comprobanteGuardadoId.value) {
    toastWarning('Ya hay un comprobante guardado. Emite o limpia para una nueva venta.')
    return
  }

  const errorValidacion = mensajeValidacionComprobante()
  if (errorValidacion) {
    toastWarning(errorValidacion)
    return
  }

  if (!idAfectacionGravado.value) {
    toastWarning('No se encontró la afectación IGV gravado (10). Revisa los catálogos.')
    return
  }

  if (requiereAlmacen.value && !idAlmacen.value) {
    toastWarning('Selecciona el almacén')
    return
  }

  const cilindrosUsados = new Set<number>()

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

    if (
      (linea.esMantenimiento ||
        esRecargaCliente(linea) ||
        esEntregarPrestamo(linea) ||
        linea.escenarioGas === 'comprar_balon') &&
      !linea.idBalon
    ) {
      toastWarning(`${linea.nombre}: falta el cilindro`)
      return
    }

    if (esRecargaCliente(linea) && !linea.idBalonOrigen) {
      toastWarning(
        `${linea.nombre}: falta el balón empresa origen. Sin stock físico no se puede recargar.`,
      )
      return
    }

    if (
      (linea.tipoPos === 'alquiler' || linea.esAlquilable || esEntregarPrestamo(linea)) &&
      linea.fechaInicioAlquiler &&
      linea.fechaFinAlquiler &&
      linea.fechaFinAlquiler < linea.fechaInicioAlquiler
    ) {
      toastWarning(`${linea.nombre}: la fecha fin no puede ser anterior al inicio`)
      return
    }

    if (
      (linea.tipoPos === 'alquiler' || linea.esAlquilable) &&
      (!linea.fechaInicioAlquiler || !linea.fechaFinAlquiler)
    ) {
      toastWarning(`${linea.nombre}: indica el periodo de alquiler`)
      return
    }

    if (esEntregarPrestamo(linea) && !linea.fechaInicioAlquiler) {
      toastWarning(`${linea.nombre}: indica la fecha de entrega del préstamo`)
      return
    }

    if (
      Number(linea.montoGarantia || 0) > 0 &&
      !linea.idMedioPagoGarantia &&
      (esEntregarPrestamo(linea) || linea.tipoPos === 'alquiler' || linea.esAlquilable)
    ) {
      toastWarning(
        `${linea.nombre}: indica el medio con el que se recibe la garantía`,
      )
      return
    }

    // Operaciones con seguimiento del cilindro exigen cliente identificado.
    if (
      esClienteVariosSeleccionado.value &&
      (linea.tipoPos === 'alquiler' ||
        esEntregarPrestamo(linea) ||
        esRecargaCliente(linea) ||
        linea.tipoPos === 'mantenimiento' ||
        linea.esMantenimiento)
    ) {
      toastWarning(
        'Recarga, préstamo, alquiler o mantenimiento no puede ir a Clientes Varios. Selecciona un cliente identificado.',
      )
      return
    }

    if (
      esEntregarPrestamo(linea) &&
      !authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_CREAR)
    ) {
      toastWarning(
        `${linea.nombre}: no tienes permiso para registrar préstamos de cilindro`,
      )
      return
    }

    if (
      linea.escenarioGas === 'comprar_balon' &&
      !authStore.hasPermission(PermisoBanderas.BAJAS_BALON_SOLICITAR)
    ) {
      toastWarning(
        `${linea.nombre}: no tienes permiso para registrar la baja por venta del cilindro`,
      )
      return
    }

    if (linea.escenarioGas === 'comprar_balon' && !linea.idProductoEnvase) {
      toastWarning(
        `${linea.nombre}: no se resolvió el producto de venta de envase (VTA-ENVASE)`,
      )
      return
    }

    if (linea.idBalon) {
      const idBalonNum = Number(linea.idBalon)
      if (cilindrosUsados.has(idBalonNum)) {
        toastWarning(
          `El cilindro ${etiquetaCilindro(linea) || idBalonNum} está en más de un ítem del carrito`,
        )
        return
      }
      cilindrosUsados.add(idBalonNum)
    }

    if (linea.afectaStock === false) continue
    const stock = linea.stockDisponible
    if (stock != null && Number(linea.cantidad) > Number(stock)) {
      toastWarning(`${linea.nombre}: stock insuficiente (disponible: ${stock})`)
      return
    }
    if (stock != null && Number(stock) <= 0) {
      toastWarning(`${linea.nombre} no tiene stock disponible`)
      return
    }
  }

  const lineasAlquiler = lineasActivas.value.filter(
    (linea) =>
      (linea.tipoPos === 'alquiler' || linea.esAlquilable) &&
      !esEntregarPrestamo(linea) &&
      linea.fechaInicioAlquiler,
  )
  // Cilindro siempre es préstamo (nunca alquiler_detalle / estado ALQUILADO).
  const lineasPrestamo = lineasActivas.value.filter(
    (linea) =>
      Boolean(linea.idBalon) &&
      (esEntregarPrestamo(linea) ||
        ((linea.tipoPos === 'alquiler' || linea.esAlquilable) && linea.fechaInicioAlquiler)),
  )
  const lineasGasConBalon = lineasActivas.value.filter(
    (linea) =>
      linea.esGas &&
      linea.idBalon &&
      esRecargaCliente(linea),
  )
  const lineasMantenimiento = lineasActivas.value.filter(
    (linea) => linea.esMantenimiento && linea.idBalon,
  )
  const lineasCompraBalon = lineasActivas.value.filter(
    (linea) => linea.escenarioGas === 'comprar_balon' && linea.idBalon,
  )

try {
    guardandoExtra.value = true

    const detalles = lineasActivas.value.flatMap((linea) => {
      const base = {
        idProducto: Number(linea.idProducto),
        cantidad: Number(linea.cantidad),
        precioUnitario: Number(linea.precioUnitario),
        descuento: 0,
        porcentajeIgv: 18,
        idAfectacionIgv: linea.idAfectacionIgv ?? idAfectacionGravado.value,
        descripcion: linea.descripcionMantenimiento
          || (linea.observacionLinea
            ? `${linea.nombre} — ${linea.observacionLinea}`
            : linea.nombre),
        idBalon: linea.idBalon,
      }

      if (
        linea.escenarioGas === 'comprar_balon' &&
        linea.idProductoEnvase &&
        Number(linea.precioBalon || 0) >= 0
      ) {
        return [
          base,
          {
            idProducto: Number(linea.idProductoEnvase),
            cantidad: 1,
            precioUnitario: Number(linea.precioBalon || 0),
            descuento: 0,
            porcentajeIgv: 18,
            idAfectacionIgv: linea.idAfectacionIgv ?? idAfectacionGravado.value,
            descripcion: `Venta cilindro — ${linea.nombreProductoEnvase || 'Envase'}`,
            idBalon: linea.idBalon,
          },
        ]
      }

      const esAlquilerLinea =
        linea.tipoPos === 'alquiler' || Boolean(linea.esAlquilable)
      if (
        (esEntregarPrestamo(linea) || esAlquilerLinea) &&
        Number(linea.montoGarantia || 0) > 0
      ) {
        return [
          base,
          {
            idProducto: Number(linea.idProducto),
            cantidad: 1,
            precioUnitario: Number(linea.montoGarantia || 0),
            descuento: 0,
            porcentajeIgv: 18,
            idAfectacionIgv: linea.idAfectacionIgv ?? idAfectacionGravado.value,
            descripcion: `Garantía reembolsable — ${linea.nombre}`,
            idBalon: linea.idBalon,
          },
        ]
      }

      return [base]
    })

    const comprobante = await createMutation.mutateAsync({
      idUsuarioAuditoria: userId,
      idTipoComprobante: Number(idTipoComprobante.value),
      serie: serie.value.trim(),
      numero: numero.value || undefined,
      fecha: fecha.value,
      idCliente: Number(idCliente.value),
      idAlmacen: idAlmacen.value ? Number(idAlmacen.value) : undefined,
      detalles,
      idTipoOperacionSunat: idTipoOperacionVentaInterna.value,
      idMoneda: idMonedaPen.value,
      idCondicionPago: idCondicionPago.value ? Number(idCondicionPago.value) : undefined,
      idMedioPago: idMedioPago.value ? Number(idMedioPago.value) : undefined,
      fechaVencimiento: esVentaCredito.value ? fechaVencimiento.value || undefined : undefined,
      glosa: glosa.value || undefined,
      observaciones: clienteDescripcion.value || undefined,
      origenPos: resolverOrigenPos(),
    })

    // Marcar guardado de inmediato para evitar reintento/duplicado si falla un efecto colateral.
    comprobanteGuardadoId.value = comprobante.id
    comprobanteGuardadoSerie.value = comprobante.serie
    comprobanteGuardadoNumero.value = comprobante.numero

    let advertencias = 0

    if (authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR)) {
      for (const lineaGas of lineasGasConBalon) {
        try {
          await movimientosRecargaService.vincularRecargaClienteComprobante({
            idUsuarioAuditoria: userId,
            idComprobante: comprobante.id,
            idCliente: Number(idCliente.value),
            idBalon: Number(lineaGas.idBalon),
            idProducto: Number(lineaGas.idProducto),
            capacidad: lineaGas.capacidad,
            idAlmacen: idAlmacen.value ? Number(idAlmacen.value) : undefined,
            observacion: lineaGas.observacionLinea || glosa.value || undefined,
            idBalonOrigen: lineaGas.idBalonOrigen
              ? Number(lineaGas.idBalonOrigen)
              : undefined,
          })
        } catch (error) {
          advertencias += 1
          toastApiError(
            error,
            `Comprobante creado, pero falló la vinculación de recarga de ${lineaGas.nombre}`,
          )
        }
      }
    }

    if (
      lineasPrestamo.length > 0 &&
      authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_CREAR)
    ) {
      if (!idTipoPrestamoEmpresaCliente.value) {
        advertencias += 1
        toastWarning(
          'Comprobante creado, pero no se encontró el tipo de préstamo ENVASE_EMPRESA_A_CLIENTE',
        )
      } else {
        for (const lineaPrestamo of lineasPrestamo) {
          try {
            const salida =
              lineaPrestamo.fechaInicioAlquiler ||
              fecha.value ||
              new Date().toISOString().slice(0, 10)
            const conAlquilerRegulador =
              (lineaPrestamo.tipoPos === 'alquiler' || lineaPrestamo.esAlquilable) &&
              !esEntregarPrestamo(lineaPrestamo)
            const prestamo = await prestamosService.crear({
              idUsuarioAuditoria: userId,
              idTipoPrestamo: idTipoPrestamoEmpresaCliente.value,
              idCliente: Number(idCliente.value),
              idAlmacen: idAlmacen.value ? Number(idAlmacen.value) : undefined,
              fechaSalida: salida,
              fechaRetornoPactada: lineaPrestamo.fechaFinAlquiler || undefined,
              idComprobanteVenta: comprobante.id,
              idEstado: idEstadoPrestamoActivo.value ?? undefined,
              titulo: `Préstamo POS · ${etiquetaCilindro(lineaPrestamo) || lineaPrestamo.nombre}`,
              observacion:
                lineaPrestamo.observacionLinea ||
                glosa.value ||
                (conAlquilerRegulador
                  ? `Préstamo de cilindro junto a alquiler de regulador (${lineaPrestamo.nombre})`
                  : `Préstamo de cilindro con venta de gas desde POS`),
            })

            await prestamosDetalleService.crear({
              idUsuarioAuditoria: userId,
              idPrestamo: prestamo.id,
              idBalon: Number(lineaPrestamo.idBalon),
              idProducto: conAlquilerRegulador
                ? undefined
                : Number(lineaPrestamo.idProducto),
              fechaEntregado: salida,
              fechaPrestamo: salida,
              fechaVencimiento: lineaPrestamo.fechaFinAlquiler || undefined,
              observacion: conAlquilerRegulador
                ? 'Cilindro en préstamo (kit/regulador en alquiler aparte)'
                : 'Entrega desde POS unificado',
            })

            const montoGarantia = Number(lineaPrestamo.montoGarantia || 0)
            if (esEntregarPrestamo(lineaPrestamo) && montoGarantia > 0) {
              try {
                const productoLinea = productosPorId.value.get(
                  Number(lineaPrestamo.idProducto),
                )
                await garantiasService.crear({
                  idUsuarioAuditoria: userId,
                  idCliente: Number(idCliente.value),
                  monto: montoGarantia,
                  idComprobante: comprobante.id,
                  idPrestamo: prestamo.id,
                  idProducto: Number(lineaPrestamo.idProducto),
                  cantidadVenta: 1,
                  idUnidadMedida: productoLinea?.id_unidad_medida ?? undefined,
                  fechaRegistro: fecha.value,
                  idMedioPago: lineaPrestamo.idMedioPagoGarantia
                    ? Number(lineaPrestamo.idMedioPagoGarantia)
                    : undefined,
                  observacion:
                    lineaPrestamo.observacionGarantia?.trim() ||
                    `Garantía POS · ${etiquetaCilindro(lineaPrestamo) || lineaPrestamo.nombre}`,
                })
              } catch (error) {
                advertencias += 1
                toastApiError(
                  error,
                  `Comprobante y préstamo creados, pero falló el registro de garantía de ${lineaPrestamo.nombre}`,
                )
              }
            }
          } catch (error) {
            advertencias += 1
            toastApiError(
              error,
              `Comprobante creado, pero falló el préstamo de ${lineaPrestamo.nombre}`,
            )
          }
        }
      }
    }

    if (
      lineasAlquiler.length > 0 &&
      authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR)
    ) {
      for (const lineaAlquilable of lineasAlquiler) {
        try {
          // Sin garantía: esa va en línea aparte del comprobante y en ven_garantia.
          const montoAlquiler = importeGasLinea(lineaAlquilable)
          const idProductoAlquiler = Number(lineaAlquilable.idProducto)
          const inicio =
            lineaAlquilable.fechaInicioAlquiler || new Date().toISOString().slice(0, 10)
          const fin = lineaAlquilable.fechaFinAlquiler || addDaysIso(inicio, 14)

          const idProductoStock =
            lineaAlquilable.afectaStock &&
            !lineaAlquilable.esServicio &&
            !lineaAlquilable.esGas
              ? idProductoAlquiler
              : undefined

          // En este dominio tarifa_diaria se usa como monto del periodo (ver bal_renovar_alquiler).
          const alquiler = await alquileresService.crear({
            idUsuarioAuditoria: userId,
            idCliente: Number(idCliente.value),
            idAlmacen: Number(idAlmacen.value),
            fechaInicio: inicio,
            fechaFinPactada: fin,
            tarifaDiaria: montoAlquiler,
            totalCobrado: montoAlquiler,
            idComprobanteVenta: comprobante.id,
            idProductoRegulador: idProductoAlquiler,
            idProductoStock,
            observacion:
              lineaAlquilable.observacionLinea ||
              glosa.value ||
              `Alquiler de regulador/accesorio ${lineaAlquilable.nombre} desde POS`,
          })

          // El cilindro opcional se registra como préstamo (arriba), no como detalle de alquiler.

          await alquileresService.registrarPeriodo(alquiler.id, {
            idUsuarioAuditoria: userId,
            fechaInicio: inicio,
            fechaFin: fin,
            monto: montoAlquiler,
            idProducto: idProductoAlquiler,
            idComprobante: comprobante.id,
            observacion: 'Periodo 1 — POS unificado',
          })

          const montoGarantiaAlq = Number(lineaAlquilable.montoGarantia || 0)
          if (montoGarantiaAlq > 0) {
            try {
              await garantiasService.crear({
                idUsuarioAuditoria: userId,
                idCliente: Number(idCliente.value),
                monto: montoGarantiaAlq,
                idComprobante: comprobante.id,
                idAlquiler: alquiler.id,
                idProducto: idProductoAlquiler,
                cantidadVenta: 1,
                fechaRegistro: fecha.value,
                idMedioPago: lineaAlquilable.idMedioPagoGarantia
                  ? Number(lineaAlquilable.idMedioPagoGarantia)
                  : undefined,
                observacion:
                  lineaAlquilable.observacionGarantia?.trim() ||
                  `Garantía POS · alquiler ${lineaAlquilable.nombre}`,
              })
            } catch (error) {
              advertencias += 1
              toastApiError(
                error,
                `Comprobante y alquiler creados, pero falló la garantía de ${lineaAlquilable.nombre}`,
              )
            }
          }
        } catch (error) {
          advertencias += 1
          toastApiError(
            error,
            `Comprobante creado, pero falló el alquiler de ${lineaAlquilable.nombre}`,
          )
        }
      }
    } else if (
      lineasAlquiler.length > 0 &&
      !authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR)
    ) {
      advertencias += 1
      toastWarning(
        'Comprobante creado, pero no se registró el alquiler: sin permiso ALQUILERES_BALON_CREAR',
      )
    }

    if (authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_CREAR)) {
      for (const lineaMant of lineasMantenimiento) {
        try {
          await mantenimientosService.crear({
            idUsuarioAuditoria: userId,
            idBalon: Number(lineaMant.idBalon),
            fechaIngreso:
              lineaMant.fechaIngresoMantenimiento ||
              new Date().toISOString().slice(0, 10),
            idTipoMantenimiento: lineaMant.idTipoMantenimiento,
            descripcion:
              lineaMant.descripcionMantenimiento || lineaMant.nombre,
            costo: Number(lineaMant.precioUnitario),
            idComprobanteVenta: comprobante.id,
            observacion: lineaMant.observacionLinea || undefined,
          })
        } catch (error) {
          advertencias += 1
          toastApiError(
            error,
            `Comprobante creado, pero falló el mantenimiento de ${lineaMant.nombre}`,
          )
        }
      }
    }

    if (lineasCompraBalon.length > 0) {
      if (!authStore.hasPermission(PermisoBanderas.BAJAS_BALON_SOLICITAR)) {
        advertencias += 1
        toastWarning(
          'Comprobante creado, pero no se registró la baja del cilindro: sin permiso BAJAS_BALON_SOLICITAR',
        )
      } else if (!idMotivoVendido.value) {
        advertencias += 1
        toastWarning(
          'Comprobante creado, pero no se encontró el motivo de baja VENDIDO para registrar el cilindro',
        )
      } else {
        for (const linea of lineasCompraBalon) {
          try {
            const baja = await balonesService.darBaja(Number(linea.idBalon), {
              idUsuarioAuditoria: userId,
              idMotivoBaja: Number(idMotivoVendido.value),
              idUsuarioSolicita: userId,
              idClienteComprador: Number(idCliente.value),
              idComprobanteVenta: comprobante.id,
              serieComprobante: comprobante.serie,
              numeroComprobante: comprobante.numero,
              montoVenta: Number(linea.precioBalon || 0),
              observacion:
                linea.observacionLinea || 'Venta de cilindro desde POS',
              fechaBaja: fecha.value,
            })

            if (
              baja?.id &&
              authStore.hasPermission(PermisoBanderas.BAJAS_BALON_APROBAR)
            ) {
              await bajasPendientesService.aprobar(baja.id, {
                idUsuarioAuditoria: userId,
                idUsuarioAutoriza: userId,
              })
            }
          } catch (error) {
            advertencias += 1
            toastApiError(
              error,
              `Comprobante creado, pero falló la baja por venta del cilindro ${etiquetaCilindro(linea) || linea.idBalon}`,
            )
          }
        }
      }
    }

    if (advertencias > 0) {
      toastSuccess('Venta registrada (con advertencias en operaciones de balón)')
    } else {
      toastSuccess('Venta registrada')
    }
  } catch (error) {
    toastApiError(error, 'No se pudo guardar la venta')
  } finally {
    guardandoExtra.value = false
  }
}

async function limpiarFormulario() {
  lineas.value = []
  glosa.value = ''
  idAlmacen.value = ''
  lineaEditando.value = null
  productoEdicion.value = null
  productosPorId.value = new Map()
  comprobanteGuardadoId.value = null
  comprobanteGuardadoSerie.value = null
  comprobanteGuardadoNumero.value = null
  await reiniciarTrasOperacion()
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

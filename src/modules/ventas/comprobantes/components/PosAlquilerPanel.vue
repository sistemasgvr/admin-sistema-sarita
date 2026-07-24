<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
    <section>
      <FormCardsLayout>
        <DetailSectionCard
          title="Kit medicinal"
          :icon="ICONS.receipt"
          help="Una sola operación: cilindro físico + líneas del kit (contenido, regulador en alquiler, descartables y flete) en un comprobante. Para industrial usa la pestaña Industrial."
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

          <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <AppSelectSearch
              v-model="idAlmacen"
              v-model:search="almacenBuscar"
              label="Almacén"
              placeholder="Selecciona almacén"
              search-placeholder="Nombre del almacén..."
              :options="almacenOptions"
              :loading="almacenesQuery.isLoading.value"
              :disabled="almacenesQuery.isLoading.value"
              required
            />
          </div>

          <div class="mt-5 min-w-0 overflow-hidden">
            <PosBalonSelectField
              v-model="idBalon"
              mode="alquiler"
              :id-cliente="idCliente"
              :id-almacen="idAlmacen"
              label="Cilindro a entregar"
              placeholder="Selecciona cilindro disponible"
              register-label="Registrar cilindro en almacén"
              empty-text="Sin cilindros disponibles."
              required
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="Líneas del kit"
          :icon="ICONS.boxes"
          help="Ejemplo oficina: contenido ~165 + regulador ~70 (2 semanas) + descartables ~50 + flete ~15 ≈ 285. Los descartables se venden (quedan con el cliente)."
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
                  :label="linea.rol === 'regulador' ? 'Servicio / producto' : 'Producto'"
                  placeholder="Selecciona..."
                  search-placeholder="Código o nombre..."
                  :options="optionsParaRol(linea.rol)"
                  :loading="loadingProductosParaRol(linea.rol)"
                  :required="linea.rol === 'regulador'"
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
                  label="Producto"
                  placeholder="Selecciona..."
                  search-placeholder="Código o nombre..."
                  :options="productoVentaOptions"
                  :loading="productosVentaQuery.isLoading.value"
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
            <AppInput v-model="fechaFinPactada" label="Fin pactado" type="date" />
            <AppInput
              v-model="tarifaPeriodo"
              label="Tarifa regulador (periodo)"
              type="number"
              min="0"
              step="0.01"
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
        :totales="totales"
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
import { alquileresDetalleService } from '@/modules/balones/alquileres/services/alquileres-detalle.service'
import { alquileresService } from '@/modules/balones/alquileres/services/alquileres.service'
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
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'

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
  canPrint,
  canCreateCliente,
  tipoComprobanteOptions,
  esNotaVenta,
  clienteOptions,
  idAfectacionGravado,
  idMonedaPen,
  idTipoOperacionVentaInterna,
  comprobanteBaseValido,
  mensajeValidacionComprobante,
  reiniciarTrasOperacion,
  seleccionarCliente,
} = usePosComprobanteForm()

const createComprobanteMutation = useCreateComprobanteMutation()
const emitMutation = useEmitirComprobanteMutation()
const imprimiendoTicket = ref(false)

const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const serviciosFilters = ref({ pagina: 1, limite: 100, esServicio: true, esAlquilable: true })
const serviciosQuery = useProductosQuery(serviciosFilters)

const productosVentaFilters = ref({ pagina: 1, limite: 100, buscar: undefined as string | undefined })
const productosVentaQuery = useProductosQuery(productosVentaFilters)

const idBalon = ref<number | ''>('')
const idAlmacen = ref<number | ''>('')
const almacenBuscar = ref('')
const almacenesData = computed(() => almacenesQuery.data.value?.data)
const { aplicarAlmacenPorDefecto } = usePosAlmacenDefault(almacenesData, idAlmacen)

const hoy = new Date().toISOString().slice(0, 10)
const fechaInicio = ref(hoy)
const fechaFinPactada = ref(addDaysIso(hoy, 14))
const tarifaPeriodo = ref(0)
const observacion = ref('')
const guardando = ref(false)

const kitLineas = reactive<KitMedicinalLinea[]>(crearKitMedicinalInicial())
const descartables = reactive<KitMedicinalLinea[]>([])

const comprobanteGuardadoId = ref<number | null>(null)
const comprobanteGuardadoSerie = ref<string | null>(null)
const comprobanteGuardadoNumero = ref<string | null>(null)

const almacenOptions = computed(() =>
  (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
)

const serviciosAlquiler = computed(() => serviciosQuery.data.value?.data ?? [])
const productosVenta = computed(() => productosVentaQuery.data.value?.data ?? [])

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

const lineasFijas = computed(() =>
  kitLineas.filter((linea) => linea.rol !== 'descartable'),
)

const lineasDescartables = computed(() => descartables)

const todasLasLineas = computed(() => [...kitLineas, ...descartables])

const lineasActivas = computed(() => lineasKitConProducto(todasLasLineas.value))

const totalKit = computed(() => totalKitMedicinal(todasLasLineas.value))

const totales = computed(() => calcularTotalesDesdeImporte(totalKit.value))

const lineaRegulador = computed(() => kitLineas.find((linea) => linea.rol === 'regulador'))

const puedeGuardar = computed(() => {
  return (
    comprobanteBaseValido() &&
    Boolean(idBalon.value) &&
    Boolean(idAlmacen.value) &&
    Boolean(lineaRegulador.value?.idProducto) &&
    Boolean(fechaInicio.value) &&
    lineasActivas.value.length > 0 &&
    totalKit.value >= 0
  )
})

function optionsParaRol(rol: KitMedicinalRol) {
  return rol === 'regulador' ? servicioOptions.value : productoVentaOptions.value
}

function loadingProductosParaRol(rol: KitMedicinalRol) {
  return rol === 'regulador'
    ? serviciosQuery.isLoading.value
    : productosVentaQuery.isLoading.value
}

function findProducto(rol: KitMedicinalRol, id: number): Producto | undefined {
  if (rol === 'regulador') {
    return serviciosAlquiler.value.find((item) => item.id === id)
  }
  return productosVenta.value.find((item) => item.id === id)
}

function onProductoLinea(linea: KitMedicinalLinea, id: unknown) {
  const productId = Number(id)
  if (!productId) {
    linea.codigo = ''
    linea.nombre = ''
    linea.precioUnitario = 0
    if (linea.rol === 'regulador') tarifaPeriodo.value = 0
    return
  }

  const producto = findProducto(linea.rol, productId)
  if (!producto) return

  linea.codigo = producto.codigo
  linea.nombre = producto.nombre
  linea.precioUnitario = Number(producto.precio ?? 0)
  if (linea.rol === 'regulador') {
    tarifaPeriodo.value = Number(producto.precio ?? 0)
  }
}

function agregarDescartable() {
  descartables.push(crearLineaKit('descartable'))
}

function quitarDescartable(key: string) {
  const index = descartables.findIndex((linea) => linea.key === key)
  if (index >= 0) descartables.splice(index, 1)
}

function generarNumeroAlquiler() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `ALQ-${stamp}-${String(Date.now()).slice(-4)}`
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

  const activas = lineasActivas.value
  if (activas.length === 0) {
    toastWarning('Agrega al menos una línea del kit con producto')
    return
  }

  guardando.value = true

  try {
    const comprobante = await createComprobanteMutation.mutateAsync({
      idUsuarioAuditoria: userId,
      idTipoComprobante: Number(idTipoComprobante.value),
      serie: serie.value.trim(),
      numero: numero.value || undefined,
      fecha: fecha.value,
      idCliente: Number(idCliente.value),
      detalles: activas.map((linea) => ({
        idProducto: Number(linea.idProducto),
        cantidad: Number(linea.cantidad),
        precioUnitario: Number(linea.precioUnitario),
        descuento: 0,
        porcentajeIgv: 18,
        idAfectacionIgv: idAfectacionGravado.value,
        descripcion: `${KIT_MEDICINAL_ROL_LABEL[linea.rol]}: ${linea.nombre || linea.codigo}`,
        idBalon: linea.rol === 'regulador' ? Number(idBalon.value) : undefined,
      })),
      idTipoOperacionSunat: idTipoOperacionVentaInterna.value,
      idMoneda: idMonedaPen.value,
      glosa: observacion.value || 'Kit medicinal',
    })

    const alquiler = await alquileresService.crear({
      idUsuarioAuditoria: userId,
      numeroAlquiler: generarNumeroAlquiler(),
      idCliente: Number(idCliente.value),
      idAlmacen: Number(idAlmacen.value),
      fechaInicio: fechaInicio.value,
      fechaFinPactada: fechaFinPactada.value || undefined,
      tarifaDiaria: Number(tarifaPeriodo.value || 0),
      totalCobrado: totalKit.value,
      idComprobanteVenta: comprobante.id,
      idProductoRegulador: Number(lineaRegulador.value.idProducto),
      observacion: observacion.value || 'Kit medicinal',
    })

    await alquileresDetalleService.crear({
      idUsuarioAuditoria: userId,
      idAlquiler: alquiler.id,
      idBalon: Number(idBalon.value),
    })

    const montoRegulador = importeLineaKit(lineaRegulador.value)
    await alquileresService.registrarPeriodo(alquiler.id, {
      idUsuarioAuditoria: userId,
      fechaInicio: fechaInicio.value,
      fechaFin: fechaFinPactada.value || addDaysIso(fechaInicio.value, 14),
      monto: montoRegulador,
      idProducto: Number(lineaRegulador.value.idProducto),
      idComprobante: comprobante.id,
      observacion: 'Periodo 1 — kit medicinal (regulador)',
    })

    comprobanteGuardadoId.value = comprobante.id
    comprobanteGuardadoSerie.value = comprobante.serie
    comprobanteGuardadoNumero.value = comprobante.numero
    toastSuccess('Kit medicinal registrado con periodo 1 del regulador')
  } finally {
    guardando.value = false
  }
}

async function limpiarFormulario() {
  idBalon.value = ''
  idAlmacen.value = ''
  almacenBuscar.value = ''
  const inicio = new Date().toISOString().slice(0, 10)
  fechaInicio.value = inicio
  fechaFinPactada.value = addDaysIso(inicio, 14)
  tarifaPeriodo.value = 0
  observacion.value = ''
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

<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
    <section>
      <FormCardsLayout>
        <DetailSectionCard
          title="Comprobante y cliente"
          :icon="ICONS.receipt"
          help="El cliente trae su cilindro (propio o prestado). Se cobra el gas."
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
              v-model="clienteDescripcion"
              label="Observaciones"
              placeholder="Opcional"
            />
            <AlmacenSelectField
              v-model="idAlmacen"
              label="Almacén"
              searchable
              required
              :disabled="almacenesQuery.isLoading.value"
              @created="onAlmacenCreated"
            />
          </div>

          <div class="mt-5 min-w-0 overflow-hidden">
            <PosBalonSelectField
              v-model="idBalon"
              mode="cliente"
              :id-cliente="idCliente"
              :extra-filters="extraFiltersProductoGas"
              label="Cilindro del cliente"
              placeholder="Buscar código o serie"
              register-label="Registrar cilindro del cliente"
              empty-text="No hay cilindros de este cliente. Regístralo con el +."
              required
              @selected="onBalonClienteSelected"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="Datos de recarga"
          :icon="ICONS.cylinder"
          help="Al elegir el cilindro se completa la cantidad (m³). El gas se descuenta de los cilindros llenos de la empresa."
        >
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="flex items-end gap-2">
              <div class="min-w-0 flex-1">
                <AppSelectSearch
                  v-model="idProducto"
                  v-model:search="gasBuscar"
                  label="Gas"
                  placeholder="Selecciona gas"
                  search-placeholder="Código o nombre..."
                  :options="productoOptions"
                  :loading="productosQuery.isLoading.value"
                  :disabled="productosQuery.isLoading.value"
                  required
                  @update:model-value="onProductoChange"
                />
              </div>
              <ProductoBarcodeScanButton
                :filters="scanFiltersGas"
                :disabled="productosQuery.isLoading.value"
                @scanned="onGasScanned"
              />
            </div>
            <AppInput
              v-model="cantidad"
              label="Cantidad de gas (m³)"
              type="number"
              :min="NUMBER_MIN.measurePositive"
              :step="NUMBER_STEP.measure"
              :disabled="cantidadBloqueadaPorBalon"
              :hint="
                cantidadBloqueadaPorBalon
                  ? `${capacidadBalonSeleccionado} m³ — se toma del cilindro elegido`
                  : 'Se completa al elegir el cilindro'
              "
            />
            <AppInput
              v-model="capacidad"
              label="Capacidad del cilindro"
              type="number"
              :min="NUMBER_MIN.measure"
              :step="NUMBER_STEP.measure"
              placeholder="Se completa al elegir el cilindro"
              :disabled="cantidadBloqueadaPorBalon"
            />
            <AppFormField label="Precio por m³" required :error="errorPrecioUnitario">
              <MoneyInput
                v-model="precioUnitario"
                placeholder="0.00"
                :state="errorPrecioUnitario ? 'error' : 'default'"
                @blur="onBlurPrecioUnitario"
              />
            </AppFormField>
            <AppSelect
              v-model="idBalonPreferido"
              label="Cilindro de la empresa (opcional)"
              placeholder="Automático (el más antiguo)"
              :options="origenOptions"
              :disabled="cargandoOrigenes || !idProducto"
            />
          </div>

          <p
            v-if="errorOrigenes"
            class="mt-3 rounded-lg bg-error-50 px-3 py-2 text-xs font-medium text-error-600 dark:bg-error-500/10 dark:text-error-400"
          >
            {{ errorOrigenes }}
          </p>
          <p
            v-else-if="cargandoOrigenes"
            class="mt-3 text-xs text-gray-500 dark:text-gray-400"
          >
            Buscando de dónde salir el gas...
          </p>
          <p
            v-else-if="sugerenciaOrigenLabel"
            class="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
          >
            El gas se descontará de:
            <span class="font-semibold">{{ sugerenciaOrigenLabel }}</span>
          </p>

          <div class="mt-5">
            <AppInput v-model="observacion" label="Observación" placeholder="Opcional" />
          </div>
        </DetailSectionCard>
      </FormCardsLayout>
    </section>

    <aside class="xl:sticky xl:top-20 xl:self-start">
      <PosResumenAside
        v-model:glosa="observacion"
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
        guardar-label="Registrar recarga"
        guardando-label="Registrando..."
        @guardar="registrarRecarga"
        @emitir="emitirComprobante"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Balon } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { useCreateRecargaClienteMutation } from '@/modules/balones/recargas/composables/useMovimientoRecargaMutations'
import { movimientosRecargaService } from '@/modules/balones/recargas/services/movimientos-recarga.service'
import type { BalonOrigenRecarga } from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'
import { formatOrigenRecargaLabel } from '@/modules/balones/recargas/utils/formatOrigenRecargaLabel'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import ProductoBarcodeScanButton from '@/modules/productos/articulos/components/ProductoBarcodeScanButton.vue'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import PosClienteField from '@/modules/ventas/comprobantes/components/PosClienteField.vue'
import PosResumenAside from '@/modules/ventas/comprobantes/components/PosResumenAside.vue'
import { useEmitirComprobanteMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import { usePosAlmacenDefault } from '@/modules/ventas/comprobantes/composables/usePosAlmacenDefault'
import {
  calcularTotalesDesdeImporte,
  usePosComprobanteForm,
} from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import {
  emitirConImpresionTicket,
  imprimirTicketSinEmision,
} from '@/modules/ventas/comprobantes/utils/imprimirTicketTrasEmision'
import { AppInput, AppSelect, AppSelectSearch, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { getApiErrorMessage, toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { parseMoneyInput, roundMoney } from '@/shared/utils/currency'

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
  mensajeValidacionComprobante,
  reiniciarTrasOperacion,
  seleccionarCliente,
  clienteDescripcion,
} = usePosComprobanteForm()

const createMutation = useCreateRecargaClienteMutation()
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

const productosFilters = ref({ pagina: 1, limite: 200, esGas: true })
const productosQuery = useProductosQuery(productosFilters)
const scanFiltersGas = { esGas: true as const, soloActivos: 1 as const }

const idBalon = ref<number | ''>('')
const idBalonOrigen = ref<number | ''>('')
const idBalonPreferido = ref<number | ''>('')
const origenes = ref<BalonOrigenRecarga[]>([])
const cargandoOrigenes = ref(false)
const errorOrigenes = ref('')
const sugerenciaOrigenLabel = ref('')
const idProducto = ref<number | ''>('')
const productoEscaneadoOption = ref<{ value: number; label: string } | null>(null)
const extraFiltersProductoGas = computed(() =>
  idProducto.value ? { idProductoGas: Number(idProducto.value) } : undefined,
)
const gasBuscar = ref('')
const cantidad = ref(1)
const capacidad = ref<number | ''>('')
const precioUnitario = ref('')
const {
  error: errorPrecioUnitario,
  valido: precioUnitarioValido,
  onBlur: onBlurPrecioUnitario,
} = useMoneyField(precioUnitario, { min: 0, allowZero: true })
const observacion = ref('')

const origenOptions = computed(() =>
  origenes.value.map((origen) => ({
    value: origen.id,
    label: formatOrigenRecargaLabel(origen),
  })),
)

const capacidadRequerida = computed(() => {
  if (capacidad.value !== '' && Number(capacidad.value) > 0) return Number(capacidad.value)
  return Number(cantidad.value) || 0
})

const capacidadBalonSeleccionado = ref<number | null>(null)
const cantidadBloqueadaPorBalon = computed(
  () => capacidadBalonSeleccionado.value != null && capacidadBalonSeleccionado.value > 0,
)

function onBalonClienteSelected(balon: Balon | null) {
  if (!balon?.capacidad || Number(balon.capacidad) <= 0) {
    capacidadBalonSeleccionado.value = null
    return
  }
  const cap = Number(balon.capacidad)
  capacidadBalonSeleccionado.value = cap
  cantidad.value = cap
  capacidad.value = cap
}

async function refrescarOrigenes() {
  if (!idProducto.value) {
    origenes.value = []
    idBalonOrigen.value = ''
    errorOrigenes.value = ''
    sugerenciaOrigenLabel.value = ''
    return
  }
  cargandoOrigenes.value = true
  errorOrigenes.value = ''
  sugerenciaOrigenLabel.value = ''
  idBalonOrigen.value = ''
  try {
    const requerida = capacidadRequerida.value
    const idAlmacenNum = idAlmacen.value ? Number(idAlmacen.value) : undefined
    const listado = await movimientosRecargaService.listarOrigenes({
      idProductoGas: Number(idProducto.value),
      idAlmacen: idAlmacenNum,
      limite: 50,
    })
    origenes.value = listado.data ?? []
    if (
      idBalonPreferido.value &&
      !origenes.value.some((o) => o.id === Number(idBalonPreferido.value))
    ) {
      idBalonPreferido.value = ''
    }
    if (!origenes.value.length) {
      errorOrigenes.value =
        'No hay balón empresa LLENO del mismo gas con gas disponible. No se puede recargar.'
      return
    }
    if (requerida <= 0) {
      errorOrigenes.value = 'Indica la capacidad del cilindro del cliente para asignar orígenes.'
      return
    }
    try {
      const asignacion = await movimientosRecargaService.asignarOrigenes({
        idProductoGas: Number(idProducto.value),
        capacidad: requerida,
        idAlmacen: idAlmacenNum,
        idBalonPreferido: idBalonPreferido.value ? Number(idBalonPreferido.value) : undefined,
      })
      idBalonOrigen.value = asignacion.idBalonOrigenPrincipal ?? ''
      sugerenciaOrigenLabel.value = asignacion.etiqueta || ''
      if (!idBalonOrigen.value) {
        errorOrigenes.value = 'No se pudo asignar balones empresa origen para esta recarga.'
      }
    } catch (error) {
      idBalonOrigen.value = ''
      sugerenciaOrigenLabel.value = ''
      errorOrigenes.value = getApiErrorMessage(
        error,
        'Stock insuficiente de gas en balones empresa para cubrir la capacidad pedida.',
      )
    }
  } catch {
    origenes.value = []
    idBalonOrigen.value = ''
    sugerenciaOrigenLabel.value = ''
    errorOrigenes.value =
      'No hay balón empresa LLENO del mismo gas con gas disponible. No se puede recargar.'
  } finally {
    cargandoOrigenes.value = false
  }
}

watch([idProducto, capacidad, cantidad, idAlmacen, idBalonPreferido], () => {
  void refrescarOrigenes()
})

const comprobanteGuardadoId = ref<number | null>(null)
const comprobanteGuardadoSerie = ref<string | null>(null)
const comprobanteGuardadoNumero = ref<string | null>(null)

const productoOptions = computed(() => {
  const base = (productosQuery.data.value?.data ?? []).map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  }))
  const extra = productoEscaneadoOption.value
  if (extra && !base.some((item) => item.value === extra.value)) {
    return [extra, ...base]
  }
  return base
})

const totales = computed(() =>
  calcularTotalesDesdeImporte(
    Number(cantidad.value || 0) * (parseMoneyInput(precioUnitario.value) ?? 0),
  ),
)

const motivoNoGuardar = computed(() => {
  if (comprobanteGuardadoId.value) return null
  const base = mensajeValidacionComprobante()
  if (base) return base
  if (!idAlmacen.value) return 'Selecciona el almacén'
  if (!idBalon.value) return 'Selecciona el balón del cliente'
  if (!idProducto.value) return 'Selecciona el gas'
  if (cargandoOrigenes.value) return 'Calculando orígenes de gas...'
  if (errorOrigenes.value) return errorOrigenes.value
  if (!idBalonOrigen.value) return 'No hay asignación de balones empresa origen'
  if (!(Number(cantidad.value) > 0)) return 'La cantidad debe ser mayor a cero'
  if (!precioUnitarioValido.value) return errorPrecioUnitario.value || 'Precio inválido'
  return null
})

const puedeGuardar = computed(() => !comprobanteGuardadoId.value && motivoNoGuardar.value === null)

function onProductoChange() {
  const producto = (productosQuery.data.value?.data ?? []).find(
    (item) => item.id === Number(idProducto.value),
  )

  if (!producto) return

  precioUnitario.value = roundMoney(Number(producto.precio ?? 0)).toFixed(2)
}

function onGasScanned(producto: Producto) {
  productoEscaneadoOption.value = {
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  }
  idProducto.value = producto.id
  gasBuscar.value = ''
  precioUnitario.value = roundMoney(Number(producto.precio ?? 0)).toFixed(2)
  toastSuccess(`${producto.codigo} — ${producto.nombre}`)
}

async function registrarRecarga() {
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

  if (!idAlmacen.value) {
    toastWarning('Selecciona el almacén para descontar el gas del stock')
    return
  }

  if (!idBalonOrigen.value) {
    toastWarning(
      errorOrigenes.value ||
        'No hay asignación de balones empresa origen. Sin stock físico no se puede recargar.',
    )
    return
  }

  onBlurPrecioUnitario()

  const result = await createMutation.mutateAsync({
    idUsuarioAuditoria: userId,
    idCliente: Number(idCliente.value),
    idBalon: Number(idBalon.value),
    idProducto: Number(idProducto.value),
    precioUnitario: roundMoney(parseMoneyInput(precioUnitario.value) ?? 0),
    cantidad: Number(cantidad.value),
    idTipoComprobante: Number(idTipoComprobante.value),
    serie: serie.value.trim(),
    capacidad: capacidad.value !== '' ? Number(capacidad.value) : undefined,
    idAlmacen: Number(idAlmacen.value),
    observacion: [observacion.value, clienteDescripcion.value].filter(Boolean).join(' - ') || undefined,
    idBalonOrigen: Number(idBalonOrigen.value),
    idCondicionPago: idCondicionPago.value ? Number(idCondicionPago.value) : undefined,
    idMedioPago: idMedioPago.value ? Number(idMedioPago.value) : undefined,
    fechaVencimiento: esVentaCredito.value ? fechaVencimiento.value || undefined : undefined,
  })

  comprobanteGuardadoId.value = result.comprobante.id
  comprobanteGuardadoSerie.value = result.comprobante.serie
  comprobanteGuardadoNumero.value = result.comprobante.numero
}

async function limpiarFormulario() {
  idBalon.value = ''
  idBalonOrigen.value = ''
  idBalonPreferido.value = ''
  origenes.value = []
  errorOrigenes.value = ''
  sugerenciaOrigenLabel.value = ''
  capacidadBalonSeleccionado.value = null
  idProducto.value = ''
  productoEscaneadoOption.value = null
  idAlmacen.value = ''
  gasBuscar.value = ''
  cantidad.value = 1
  capacidad.value = ''
  precioUnitario.value = ''
  observacion.value = ''
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

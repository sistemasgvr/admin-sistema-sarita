<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
    <section>
      <FormCardsLayout>
        <DetailSectionCard title="Comprobante y cliente" :icon="ICONS.receipt">
          <p class="mb-5 text-sm text-gray-500 dark:text-gray-400">
            Recarga de cilindro prestado al cliente o del cilindro propio que trae el cliente. Se
            genera boleta o factura.
          </p>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AppSelect
              v-model="idTipoComprobante"
              label="Comprobante"
              placeholder="Selecciona"
              :options="tipoComprobanteOptions"
              :disabled="catalogosQuery.isLoading.value"
            />
            <AppInput v-model="serie" label="Serie" placeholder="B001 / F001" />
            <AppInput v-model="numero" label="Número" placeholder="Automático" readonly />
            <AppInput v-model="fecha" label="Fecha" type="date" />
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
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
              required
            />
            <AppSelectSearch
              v-model="idAlmacen"
              v-model:search="almacenBuscar"
              label="Almacén (stock gas)"
              placeholder="Selecciona almacén"
              search-placeholder="Nombre..."
              :options="almacenOptions"
              :loading="almacenesQuery.isLoading.value"
              :disabled="almacenesQuery.isLoading.value"
              required
            />
          </div>

          <div class="mt-5 min-w-0 overflow-hidden">
            <PosBalonSelectField
              v-model="idBalon"
              mode="cliente"
              :id-cliente="idCliente"
              label="Balón del cliente"
              placeholder="Prestado o propio del cliente"
              register-label="Registrar balón propio del cliente"
              empty-text="Sin balones prestados ni propios. Registra el del cliente."
              required
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Datos de recarga" :icon="ICONS.cylinder">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <AppInput
              v-model="cantidad"
              label="Cantidad / m³"
              type="number"
              :min="NUMBER_MIN.measurePositive"
              :step="NUMBER_STEP.measure"
            />
            <AppInput
              v-model="capacidad"
              label="Capacidad cilindro"
              type="number"
              :min="NUMBER_MIN.measure"
              :step="NUMBER_STEP.measure"
              placeholder="Opcional"
            />
            <AppInput
              v-model="precioUnitario"
              label="Precio unitario"
              type="number"
              :min="NUMBER_MIN.money"
              :step="NUMBER_STEP.money"
            />
          </div>

          <div class="mt-5">
            <AppInput v-model="observacion" label="Observación" placeholder="Opcional" />
          </div>
        </DetailSectionCard>
      </FormCardsLayout>
    </section>

    <aside class="xl:sticky xl:top-20 xl:self-start">
      <PosResumenAside
        v-model:glosa="observacion"
        :totales="totales"
        :puede-guardar="puedeGuardar"
        :guardando="createMutation.isPending.value"
        :emitiendo="emitMutation.isPending.value"
        :can-emit="canEmit"
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
import { computed, ref } from 'vue'
import { useCreateRecargaClienteMutation } from '@/modules/balones/recargas/composables/useMovimientoRecargaMutations'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import PosResumenAside from '@/modules/ventas/comprobantes/components/PosResumenAside.vue'
import { useEmitirComprobanteMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import {
  calcularTotalesDesdeImporte,
  usePosComprobanteForm,
} from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import { emitirConImpresionTicket } from '@/modules/ventas/comprobantes/utils/imprimirTicketTrasEmision'
import { AppInput, AppSelect, AppSelectSearch } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import { ICONS } from '@/shared/constants/icons'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import { toastWarning } from '@/shared/composables/useToast'

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
  mensajeValidacionComprobante,
  reiniciarTrasOperacion,
} = usePosComprobanteForm()

const createMutation = useCreateRecargaClienteMutation()
const emitMutation = useEmitirComprobanteMutation()

const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)
const idAlmacen = ref<number | ''>('')
const almacenBuscar = ref('')

const productosFilters = ref({ pagina: 1, limite: 200, esGas: true })
const productosQuery = useProductosQuery(productosFilters)

const idBalon = ref<number | ''>('')
const idProducto = ref<number | ''>('')
const gasBuscar = ref('')
const cantidad = ref(1)
const capacidad = ref<number | ''>('')
const precioUnitario = ref(0)
const observacion = ref('')

const comprobanteGuardadoId = ref<number | null>(null)
const comprobanteGuardadoSerie = ref<string | null>(null)
const comprobanteGuardadoNumero = ref<string | null>(null)

const almacenOptions = computed(() =>
  (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
)

const productoOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  })),
)

const totales = computed(() =>
  calcularTotalesDesdeImporte(Number(cantidad.value || 0) * Number(precioUnitario.value || 0)),
)

const puedeGuardar = computed(() => {
  return (
    Boolean(idCliente.value) &&
    Boolean(idAlmacen.value) &&
    Boolean(idBalon.value) &&
    Boolean(idProducto.value) &&
    Boolean(idTipoComprobante.value) &&
    Boolean(serie.value.trim()) &&
    Number(cantidad.value) > 0 &&
    Number(precioUnitario.value) >= 0
  )
})

function onProductoChange() {
  const producto = (productosQuery.data.value?.data ?? []).find(
    (item) => item.id === Number(idProducto.value),
  )

  if (!producto) return

  precioUnitario.value = Number(producto.precio ?? 0)
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

  const result = await createMutation.mutateAsync({
    idUsuarioAuditoria: userId,
    idCliente: Number(idCliente.value),
    idBalon: Number(idBalon.value),
    idProducto: Number(idProducto.value),
    precioUnitario: Number(precioUnitario.value),
    cantidad: Number(cantidad.value),
    idTipoComprobante: Number(idTipoComprobante.value),
    serie: serie.value.trim(),
    capacidad: capacidad.value !== '' ? Number(capacidad.value) : undefined,
    idAlmacen: Number(idAlmacen.value),
    observacion: observacion.value || undefined,
  })

  comprobanteGuardadoId.value = result.comprobante.id
  comprobanteGuardadoSerie.value = result.comprobante.serie
  comprobanteGuardadoNumero.value = result.comprobante.numero
}

async function limpiarTrasEmitir() {
  idBalon.value = ''
  idProducto.value = ''
  idAlmacen.value = ''
  almacenBuscar.value = ''
  gasBuscar.value = ''
  cantidad.value = 1
  capacidad.value = ''
  precioUnitario.value = 0
  observacion.value = ''
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

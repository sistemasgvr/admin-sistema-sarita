<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
    <section class="space-y-4">
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
          El cliente trae su cilindro. Ustedes llenan el gas y se genera boleta o factura.
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
            required
          />
          <div class="min-w-0">
            <PosBalonSelectField
              v-model="idBalon"
              mode="cliente"
              :id-cliente="idCliente"
              label="Balón del cliente"
              placeholder="Selecciona cilindro"
              register-label="Registrar balón del cliente"
              empty-text="Sin balones del cliente."
              required
            />
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Datos de recarga</h3>

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

        <div class="mt-4">
          <AppInput v-model="observacion" label="Observación" placeholder="Opcional" />
        </div>
      </div>
    </section>

    <aside class="xl:sticky xl:top-4 xl:self-start">
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
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import PosResumenAside from '@/modules/ventas/comprobantes/components/PosResumenAside.vue'
import { useEmitirComprobanteMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import {
  calcularTotalesDesdeImporte,
  usePosComprobanteForm,
} from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import {
  emitirConImpresionTicket,
} from '@/modules/ventas/comprobantes/utils/imprimirTicketTrasEmision'
import { AppInput, AppSelect, AppSelectSearch } from '@/shared/components'
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
} = usePosComprobanteForm()

const createMutation = useCreateRecargaClienteMutation()
const emitMutation = useEmitirComprobanteMutation()

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

const productoOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  })),
)

const totales = computed(() =>
  calcularTotalesDesdeImporte(
    Number(cantidad.value || 0) * Number(precioUnitario.value || 0),
  ),
)

const puedeGuardar = computed(() => {
  return (
    Boolean(idCliente.value) &&
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
    observacion: observacion.value || undefined,
  })

  comprobanteGuardadoId.value = result.comprobante.id
  comprobanteGuardadoSerie.value = result.comprobante.serie
  comprobanteGuardadoNumero.value = result.comprobante.numero
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
  } catch {
    // mutateAsync ya muestra el toast de error
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
    <section>
      <FormCardsLayout>
        <DetailSectionCard
          title="Comprobante y servicio"
          :icon="ICONS.receipt"
          help="Servicio de mantenimiento (P.H., válvula, etc.) que ustedes realizan. El cliente suele traer su cilindro; se cobra el servicio y el trabajo queda PENDIENTE hasta finalizarlo en Balones (Mantenimientos)."
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
            <div class="min-w-0">
              <PosBalonSelectField
                v-model="idBalon"
                mode="cliente"
                :id-cliente="idCliente"
                label="Cilindro del cliente"
                placeholder="Propio o prestado al cliente"
                register-label="Registrar cilindro del cliente"
                empty-text="Sin cilindros del cliente. Registra el que trae."
                required
              />
            </div>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <AppSelectSearch
              v-model="idTipoMantenimiento"
              v-model:search="tipoMantenimientoBuscar"
              label="Tipo de mantenimiento"
              placeholder="P.H., válvula, etc."
              search-placeholder="Buscar tipo..."
              :options="tipoMantenimientoOptions"
              :loading="tiposMantenimientoQuery.isFetching.value"
              :disabled="tiposMantenimientoQuery.isFetching.value"
            />
            <AppSelectSearch
              v-model="idProducto"
              v-model:search="servicioBuscar"
              label="Servicio"
              placeholder="Selecciona servicio"
              search-placeholder="Código o nombre..."
              :options="servicioOptions"
              :loading="productosQuery.isLoading.value"
              :disabled="productosQuery.isLoading.value"
              required
              @update:model-value="onServicioChange"
            />
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="Detalle del mantenimiento"
          :icon="ICONS.construction"
          help="Queda como PENDIENTE en taller. Al Finalizar en Mantenimientos se entrega el cilindro al cliente (no se mete a stock de almacén)."
        >
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AppInput v-model="fechaIngreso" label="Fecha ingreso" type="date" />
            <AppInput v-model="costo" label="Costo / importe" type="number" min="0" step="0.01" />
          </div>

          <div class="mt-5 space-y-4">
            <AppInput v-model="descripcion" label="Descripción" placeholder="Detalle del trabajo" />
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
        :guardando="guardando"
        :emitiendo="emitMutation.isPending.value || imprimiendoTicket"
        :can-emit="canEmit"
        :can-print="canPrint"
        :es-nota-venta="esNotaVenta"
        :comprobante-guardado-id="comprobanteGuardadoId"
        :comprobante-guardado-serie="comprobanteGuardadoSerie"
        :comprobante-guardado-numero="comprobanteGuardadoNumero"
        guardar-label="Registrar mantenimiento"
        guardando-label="Registrando..."
        @guardar="registrarMantenimiento"
        @emitir="emitirComprobante"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { mantenimientosService } from '@/modules/balones/mantenimientos/services/mantenimientos.service'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import PosClienteField from '@/modules/ventas/comprobantes/components/PosClienteField.vue'
import PosResumenAside from '@/modules/ventas/comprobantes/components/PosResumenAside.vue'
import {
  useCreateComprobanteMutation,
  useEmitirComprobanteMutation,
} from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import {
  calcularTotalesDesdeImporte,
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

const productosFilters = ref({ pagina: 1, limite: 100, esServicio: true })
const productosQuery = useProductosQuery(productosFilters)

const listaTipoMantenimientoId = ref(ListaIds.TIPO_MANTENIMIENTO)
const tiposMantenimientoQuery = useListaOpcionesQuery(listaTipoMantenimientoId)

const idBalon = ref<number | ''>('')
const idTipoMantenimiento = ref<number | ''>('')
const idProducto = ref<number | ''>('')
const tipoMantenimientoBuscar = ref('')
const servicioBuscar = ref('')
const fechaIngreso = ref(new Date().toISOString().slice(0, 10))
const costo = ref(0)
const descripcion = ref('')
const observacion = ref('')
const guardando = ref(false)

const comprobanteGuardadoId = ref<number | null>(null)
const comprobanteGuardadoSerie = ref<string | null>(null)
const comprobanteGuardadoNumero = ref<string | null>(null)

const tipoMantenimientoOptions = computed(() => toSelectOptions(tiposMantenimientoQuery.data.value))

const serviciosMantenimiento = computed(() =>
  (productosQuery.data.value?.data ?? []).filter(
    (producto) =>
      producto.nombre.toLowerCase().includes('mantenimiento') ||
      producto.codigo.toUpperCase().includes('MANT') ||
      producto.codigo.toUpperCase().includes('SRV'),
  ),
)

const servicioOptions = computed(() =>
  serviciosMantenimiento.value.map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  })),
)

const totales = computed(() => calcularTotalesDesdeImporte(Number(costo.value || 0)))

const puedeGuardar = computed(() => {
  return (
    comprobanteBaseValido() &&
    Boolean(idBalon.value) &&
    Boolean(idProducto.value) &&
    Boolean(fechaIngreso.value) &&
    Number(costo.value) >= 0
  )
})

function onServicioChange() {
  const producto = serviciosMantenimiento.value.find((item) => item.id === Number(idProducto.value))
  if (!producto) return

  costo.value = Number(producto.precio ?? 0)
  if (!descripcion.value) {
    descripcion.value = producto.nombre
  }
}

async function registrarMantenimiento() {
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

  const producto = serviciosMantenimiento.value.find((item) => item.id === Number(idProducto.value))
  if (!producto) {
    toastWarning('Selecciona un servicio de mantenimiento')
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
      detalles: [
        {
          idProducto: producto.id,
          cantidad: 1,
          precioUnitario: Number(costo.value),
          descuento: 0,
          porcentajeIgv: 18,
          idAfectacionIgv: idAfectacionGravado.value,
          descripcion: descripcion.value || producto.nombre,
          idBalon: Number(idBalon.value),
        },
      ],
      idTipoOperacionSunat: idTipoOperacionVentaInterna.value,
      idMoneda: idMonedaPen.value,
      glosa: observacion.value || 'Mantenimiento de cilindro',
    })

    await mantenimientosService.crear({
      idUsuarioAuditoria: userId,
      idBalon: Number(idBalon.value),
      fechaIngreso: fechaIngreso.value,
      idTipoMantenimiento: idTipoMantenimiento.value ? Number(idTipoMantenimiento.value) : undefined,
      descripcion: descripcion.value || producto.nombre,
      costo: Number(costo.value),
      idComprobanteVenta: comprobante.id,
      observacion: observacion.value || undefined,
    })

    comprobanteGuardadoId.value = comprobante.id
    comprobanteGuardadoSerie.value = comprobante.serie
    comprobanteGuardadoNumero.value = comprobante.numero
    toastSuccess('Mantenimiento registrado y comprobante generado')
  } finally {
    guardando.value = false
  }
}

async function limpiarFormulario() {
  idBalon.value = ''
  idTipoMantenimiento.value = ''
  idProducto.value = ''
  tipoMantenimientoBuscar.value = ''
  servicioBuscar.value = ''
  fechaIngreso.value = new Date().toISOString().slice(0, 10)
  costo.value = 0
  descripcion.value = ''
  observacion.value = ''
  comprobanteGuardadoId.value = null
  comprobanteGuardadoSerie.value = null
  comprobanteGuardadoNumero.value = null
  await reiniciarTrasOperacion()
  await productosQuery.refetch()
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
          'Nota de venta guardada. Permite ventanas emergentes para imprimir el ticket.',
        )
      } else {
        toastSuccess('Ticket de nota de venta listo para imprimir')
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

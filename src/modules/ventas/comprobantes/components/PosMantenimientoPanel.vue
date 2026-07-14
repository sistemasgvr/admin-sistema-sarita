<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
    <section class="space-y-4">
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Registra el mantenimiento del cilindro (P.H., válvula, etc.) y genera el comprobante al cliente.
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
              mode="general"
              :id-cliente="idCliente"
              label="Cilindro"
              placeholder="Selecciona cilindro"
              register-label="Registrar cilindro"
              empty-text="Sin cilindros."
              required
            />
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Detalle del mantenimiento</h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AppInput v-model="fechaIngreso" label="Fecha ingreso" type="date" />
          <AppInput v-model="fechaSalida" label="Fecha salida" type="date" />
          <AppInput v-model="costo" label="Costo / importe" type="number" min="0" step="0.01" />
        </div>

        <div class="mt-4 space-y-4">
          <AppInput v-model="descripcion" label="Descripción" placeholder="Detalle del trabajo" />
          <AppInput v-model="observacion" label="Observación" placeholder="Opcional" />
        </div>
      </div>
    </section>

    <aside class="xl:sticky xl:top-4 xl:self-start">
      <PosResumenAside
        v-model:glosa="observacion"
        :totales="totales"
        :puede-guardar="puedeGuardar"
        :guardando="guardando"
        :emitiendo="emitMutation.isPending.value"
        :can-emit="canEmit"
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
} from '@/modules/ventas/comprobantes/utils/imprimirTicketTrasEmision'
import { AppInput, AppSelect, AppSelectSearch } from '@/shared/components'
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
  tipoComprobanteOptions,
  clienteOptions,
  idAfectacionGravado,
  idMonedaPen,
  idTipoOperacionVentaInterna,
  comprobanteBaseValido,
  mensajeValidacionComprobante,
  reiniciarTrasOperacion,
} = usePosComprobanteForm()

const createComprobanteMutation = useCreateComprobanteMutation()
const emitMutation = useEmitirComprobanteMutation()

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
const fechaSalida = ref('')
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
      fechaSalida: fechaSalida.value || undefined,
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

async function limpiarTrasEmitir() {
  idBalon.value = ''
  idTipoMantenimiento.value = ''
  idProducto.value = ''
  tipoMantenimientoBuscar.value = ''
  servicioBuscar.value = ''
  fechaIngreso.value = new Date().toISOString().slice(0, 10)
  fechaSalida.value = ''
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

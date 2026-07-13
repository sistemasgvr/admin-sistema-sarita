<template>

  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">

    <section class="space-y-4">

      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">

        <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">

          Registra el alquiler del cilindro, genera el comprobante y vincula el balón entregado.

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



        <div class="mt-4 space-y-4">

          <div class="min-w-0">

            <PosBalonSelectField

              v-model="idBalon"

              mode="alquiler"

              :id-cliente="idCliente"

              :id-almacen="idAlmacen"

              label="Cilindro"

              placeholder="Selecciona cilindro disponible"

              register-label="Registrar cilindro en almacén"

              empty-text="Sin cilindros disponibles."

              required

            />

          </div>



          <div class="min-w-0">

            <AppSelectSearch

              v-model="idProducto"

              v-model:search="servicioBuscar"

              label="Servicio de alquiler"

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

      </div>



      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">

        <h3 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Condiciones del alquiler</h3>



        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          <AppInput v-model="fechaInicio" label="Inicio alquiler" type="date" />

          <AppInput v-model="fechaFinPactada" label="Fin pactado" type="date" />

          <AppInput

            v-model="tarifaDiaria"

            :label="etiquetaTarifa"

            type="number"

            min="0"

            step="0.01"

            @update:model-value="onTarifaChange"

          />

          <div>

            <AppInput

              v-model="importeCobrar"

              label="Importe a cobrar"

              type="number"

              min="0"

              step="0.01"

              @update:model-value="importeEditadoManual = true"

            />

            <p class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">

              {{ textoAyudaImporte }}

            </p>

          </div>

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

        :guardando="guardando"

        :emitiendo="emitMutation.isPending.value"

        :can-emit="canEmit"

        :comprobante-guardado-id="comprobanteGuardadoId"

        :comprobante-guardado-serie="comprobanteGuardadoSerie"

        :comprobante-guardado-numero="comprobanteGuardadoNumero"

        guardar-label="Registrar alquiler"

        guardando-label="Registrando..."

        @guardar="registrarAlquiler"

        @emitir="emitirComprobante"

      />

    </aside>

  </div>

</template>



<script setup lang="ts">

import { computed, ref, watch } from 'vue'

import { alquileresDetalleService } from '@/modules/balones/alquileres/services/alquileres-detalle.service'

import { alquileresService } from '@/modules/balones/alquileres/services/alquileres.service'

import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'

import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'

import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'

import PosResumenAside from '@/modules/ventas/comprobantes/components/PosResumenAside.vue'

import {

  useCreateComprobanteMutation,

  useEmitirComprobanteMutation,

} from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'

import {

  calcularDiasAlquiler,

  calcularImporteAlquiler,

  etiquetaTarifaAlquiler,

  inferirModoCobroAlquiler,

  textoAyudaImporteAlquiler,

} from '@/modules/ventas/comprobantes/composables/usePosAlquilerCalculo'

import {
  calcularTotalesDesdeImporte,
  usePosComprobanteForm,
} from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import {
  emitirConImpresionTicket,
} from '@/modules/ventas/comprobantes/utils/imprimirTicketTrasEmision'
import { AppInput, AppSelect, AppSelectSearch } from '@/shared/components'
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

} = usePosComprobanteForm()



const createComprobanteMutation = useCreateComprobanteMutation()

const emitMutation = useEmitirComprobanteMutation()



const almacenesFilters = ref({ pagina: 1, limite: 100 })

const almacenesQuery = useAlmacenesQuery(almacenesFilters)



const productosFilters = ref({ pagina: 1, limite: 100, esServicio: true, esAlquilable: true })

const productosQuery = useProductosQuery(productosFilters)



const idBalon = ref<number | ''>('')

const idAlmacen = ref<number | ''>('')

const idProducto = ref<number | ''>('')

const almacenBuscar = ref('')

const servicioBuscar = ref('')

const fechaInicio = ref(new Date().toISOString().slice(0, 10))

const fechaFinPactada = ref('')

const tarifaDiaria = ref(0)

const importeCobrar = ref(0)

const observacion = ref('')

const guardando = ref(false)

const importeEditadoManual = ref(false)



const comprobanteGuardadoId = ref<number | null>(null)

const comprobanteGuardadoSerie = ref<string | null>(null)

const comprobanteGuardadoNumero = ref<string | null>(null)



const almacenOptions = computed(() =>

  (almacenesQuery.data.value?.data ?? []).map((almacen) => ({

    value: almacen.id,

    label: almacen.nombre,

  })),

)



const serviciosAlquiler = computed(() => productosQuery.data.value?.data ?? [])



const servicioOptions = computed(() =>

  serviciosAlquiler.value.map((producto) => ({

    value: producto.id,

    label: `${producto.codigo} — ${producto.nombre}`,

  })),

)



const productoSeleccionado = computed(() =>

  serviciosAlquiler.value.find((item) => item.id === Number(idProducto.value)),

)



const modoCobro = computed(() => inferirModoCobroAlquiler(productoSeleccionado.value))



const diasAlquiler = computed(() =>

  calcularDiasAlquiler(fechaInicio.value, fechaFinPactada.value),

)



const etiquetaTarifa = computed(() => etiquetaTarifaAlquiler(modoCobro.value))



const textoAyudaImporte = computed(() =>

  textoAyudaImporteAlquiler({

    modo: modoCobro.value,

    tarifa: Number(tarifaDiaria.value || 0),

    dias: diasAlquiler.value,

    importe: Number(importeCobrar.value || 0),

  }),

)



const totales = computed(() => calcularTotalesDesdeImporte(Number(importeCobrar.value || 0)))



const puedeGuardar = computed(() => {

  return (

    comprobanteBaseValido() &&

    Boolean(idBalon.value) &&

    Boolean(idAlmacen.value) &&

    Boolean(idProducto.value) &&

    Boolean(fechaInicio.value) &&

    Number(importeCobrar.value) >= 0 &&

    (modoCobro.value === 'mensual' || diasAlquiler.value > 0)

  )

})



function recalcularImporte() {

  if (importeEditadoManual.value) return



  const producto = productoSeleccionado.value

  if (!producto) return



  importeCobrar.value = calcularImporteAlquiler({

    modo: modoCobro.value,

    tarifa: Number(tarifaDiaria.value || 0),

    dias: diasAlquiler.value,

    precioServicio: Number(producto.precio ?? 0),

  })

}



function onServicioChange() {

  const producto = productoSeleccionado.value

  if (!producto) return



  importeEditadoManual.value = false

  tarifaDiaria.value = Number(producto.precio ?? 0)

  recalcularImporte()

}



function onTarifaChange() {

  importeEditadoManual.value = false

  recalcularImporte()

}



watch([fechaInicio, fechaFinPactada], () => {

  if (modoCobro.value === 'diario') {

    importeEditadoManual.value = false

    recalcularImporte()

  }

})



function generarNumeroAlquiler() {

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  return `ALQ-${stamp}-${String(Date.now()).slice(-4)}`

}



async function registrarAlquiler() {

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



  const producto = productoSeleccionado.value

  if (!producto) {

    toastWarning('Selecciona un servicio de alquiler')

    return

  }



  if (modoCobro.value === 'diario' && diasAlquiler.value <= 0) {

    toastWarning('La fecha de fin debe ser igual o posterior al inicio')

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

          precioUnitario: Number(importeCobrar.value),

          descuento: 0,

          porcentajeIgv: 18,

          idAfectacionIgv: idAfectacionGravado.value,

          descripcion: producto.nombre,

          idBalon: Number(idBalon.value),

        },

      ],

      idTipoOperacionSunat: idTipoOperacionVentaInterna.value,

      idMoneda: idMonedaPen.value,

      glosa: observacion.value || 'Alquiler de cilindro',

    })



    const alquiler = await alquileresService.crear({

      idUsuarioAuditoria: userId,

      numeroAlquiler: generarNumeroAlquiler(),

      idCliente: Number(idCliente.value),

      idAlmacen: Number(idAlmacen.value),

      fechaInicio: fechaInicio.value,

      fechaFinPactada: fechaFinPactada.value || undefined,

      tarifaDiaria: Number(tarifaDiaria.value || 0),

      totalCobrado: Number(importeCobrar.value),

      idComprobanteVenta: comprobante.id,

      observacion: observacion.value || undefined,

    })



    await alquileresDetalleService.crear({

      idUsuarioAuditoria: userId,

      idAlquiler: alquiler.id,

      idBalon: Number(idBalon.value),

    })



    comprobanteGuardadoId.value = comprobante.id

    comprobanteGuardadoSerie.value = comprobante.serie

    comprobanteGuardadoNumero.value = comprobante.numero

    toastSuccess('Alquiler registrado y comprobante generado')

  } finally {

    guardando.value = false

  }

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



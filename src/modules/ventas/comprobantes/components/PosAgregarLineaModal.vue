<template>
  <AppModal
    v-model="open"
    :title="titulo"
    :subtitle="producto?.codigo || undefined"
    size="md"
  >
    <div v-if="producto" class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ ayuda }}
      </p>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CantidadUnidadInput
          v-model="cantidad"
          name="pos-agregar-cantidad"
          :nombre-unidad="producto.nombre_unidad_medida ?? 'UNID'"
          :label="esGas ? 'Cantidad / m³' : 'Cantidad'"
        />
        <AppInput
          v-model="precioUnitario"
          label="Precio unitario"
          type="number"
          :min="NUMBER_MIN.money"
          :step="NUMBER_STEP.money"
          required
        />
      </div>

      <template v-if="esGas">
        <PosBalonSelectField
          v-model="idBalon"
          mode="cliente"
          :id-cliente="idCliente"
          :extra-filters="extraFiltersProductoGas"
          label="Cilindro del cliente"
          placeholder="Opcional: código o serie"
          register-label="Registrar cilindro del cliente"
          empty-text="Sin cilindros. Regístralo si aplica."
        />
        <AppInput
          v-model="capacidad"
          label="Capacidad cilindro"
          type="number"
          :min="0"
          :step="NUMBER_STEP.money"
          placeholder="Opcional"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          El gas se descuenta del almacén. El cilindro sirve para saber cuál recargaste.
        </p>
      </template>

      <template v-else-if="esAlquilable">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Alquiler de regulador o accesorio. El cilindro, si se entrega, se presta (el cliente lo
          devuelve).
        </p>
        <PosBalonSelectField
          v-model="idBalon"
          mode="alquiler"
          :id-almacen="idAlmacen"
          label="Cilindro a prestar (opcional)"
          placeholder="Solo si también entregas un cilindro"
          empty-text="Sin cilindros disponibles en almacén."
        />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppInput v-model="fechaInicio" label="Inicio alquiler" type="date" required />
          <AppInput v-model="fechaFin" label="Fin pactado" type="date" required />
        </div>
      </template>

      <AppInput
        v-model="observacion"
        label="Nota del ítem"
        placeholder="Opcional"
      />

      <p class="text-right text-sm font-medium tabular-nums text-gray-700 dark:text-gray-300">
        Importe: {{ formatMoney(importe) }}
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        :disabled="!puedeConfirmar"
        @click="confirmar"
      >
        <AppIcon :name="ICONS.plus" :size="16" />
        {{ modoEdicion ? 'Actualizar ítem' : 'Agregar al carrito' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import CantidadUnidadInput from '@/modules/ventas/comprobantes/components/CantidadUnidadInput.vue'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import { addDaysIso } from '@/modules/ventas/comprobantes/composables/usePosKitMedicinal'
import type { PosLineItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { productoAfectaStock, validarStockParaAgregar } from '@/modules/ventas/comprobantes/utils/stockPos'
import { validarCantidadSegunUnidad } from '@/modules/ventas/comprobantes/utils/unidadMedidaCantidad'
import { AppInput, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { hoyIsoLima } from '@/shared/utils/date'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'

export interface PosLineaConfirmada {
  cantidad: number
  precioUnitario: number
  idBalon?: number
  capacidad?: number
  fechaInicioAlquiler?: string
  fechaFinAlquiler?: string
  observacionLinea?: string
}

const props = withDefaults(
  defineProps<{
    producto?: Producto | null
    linea?: PosLineItem | null
    idCliente?: number | ''
    idAlmacen?: number | ''
  }>(),
  {
    producto: null,
    linea: null,
    idCliente: '',
    idAlmacen: '',
  },
)

const emit = defineEmits<{
  confirm: [payload: PosLineaConfirmada]
}>()

const open = defineModel<boolean>({ default: false })

const cantidad = ref(1)
const precioUnitario = ref<number | string>(0)
const idBalon = ref<number | ''>('')
const capacidad = ref<number | string>('')
const fechaInicio = ref('')
const fechaFin = ref('')
const observacion = ref('')

const esGas = computed(() => Boolean(props.producto?.es_gas))
const extraFiltersProductoGas = computed(() =>
  props.producto?.id ? { idProductoGas: props.producto.id } : undefined,
)
const esAlquilable = computed(() => Boolean(props.producto?.es_alquilable))
const modoEdicion = computed(() => Boolean(props.linea))

const titulo = computed(() => {
  if (!props.producto) return 'Agregar ítem'
  if (modoEdicion.value) return `Editar: ${props.producto.nombre}`
  return props.producto.nombre
})

const ayuda = computed(() => {
  if (esGas.value) {
    return 'Indica cuánto gas cobras y, si aplica, el cilindro del cliente.'
  }
  if (esAlquilable.value) {
    return 'Alquiler del accesorio. Si entregas un cilindro, el cliente lo devuelve después.'
  }
  if (props.producto?.es_servicio) {
    return 'Servicio. Ajusta cantidad y precio.'
  }
  return 'Ajusta cantidad y precio antes de agregar.'
})

const importe = computed(
  () => Number(cantidad.value || 0) * Number(precioUnitario.value || 0),
)

const puedeConfirmar = computed(() => {
  if (!props.producto) return false
  if (Number(cantidad.value) <= 0) return false
  if (Number(precioUnitario.value) < 0) return false
  if (esAlquilable.value && (!fechaInicio.value || !fechaFin.value)) return false
  return true
})

watch(
  () => [open.value, props.producto, props.linea] as const,
  ([isOpen, producto, linea]) => {
    if (!isOpen || !producto) return

    if (linea) {
      cantidad.value = Math.max(0, Number(linea.cantidad || 1))
      precioUnitario.value = Number(linea.precioUnitario || 0)
      idBalon.value = linea.idBalon ?? ''
      capacidad.value = linea.capacidad ?? ''
      fechaInicio.value = linea.fechaInicioAlquiler || hoyIsoLima()
      fechaFin.value =
        linea.fechaFinAlquiler || addDaysIso(fechaInicio.value, 14)
      observacion.value = linea.observacionLinea || ''
      return
    }

    cantidad.value = 1
    precioUnitario.value = Number(producto.precio ?? 0)
    idBalon.value = ''
    capacidad.value = ''
    fechaInicio.value = hoyIsoLima()
    fechaFin.value = addDaysIso(fechaInicio.value, 14)
    observacion.value = ''
  },
)

watch(fechaInicio, (inicio) => {
  if (!inicio) return
  if (!fechaFin.value || fechaFin.value < inicio) {
    fechaFin.value = addDaysIso(inicio, 14)
  }
})

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
    Number(value || 0),
  )
}

function confirmar() {
  if (!props.producto || !puedeConfirmar.value) return

  const cant = Number(cantidad.value)
  const errorCantidad = validarCantidadSegunUnidad(
    cant,
    props.producto.nombre_unidad_medida ?? 'UNID',
    props.producto.nombre,
  )
  if (errorCantidad) {
    toastWarning(errorCantidad)
    return
  }

  if (productoAfectaStock(props.producto)) {
    const errorStock = validarStockParaAgregar(props.producto, cant, {
      requiereAlmacenSeleccionado: true,
    })
    if (errorStock) {
      toastWarning(errorStock)
      return
    }
  }

  const payload: PosLineaConfirmada = {
    cantidad: cant,
    precioUnitario: Number(precioUnitario.value || 0),
    observacionLinea: observacion.value.trim() || undefined,
  }

  if (esGas.value) {
    if (idBalon.value) payload.idBalon = Number(idBalon.value)
    if (capacidad.value !== '' && capacidad.value != null) {
      payload.capacidad = Number(capacidad.value)
    }
  }

  if (esAlquilable.value) {
    if (idBalon.value) payload.idBalon = Number(idBalon.value)
    payload.fechaInicioAlquiler = fechaInicio.value
    payload.fechaFinAlquiler = fechaFin.value
  }

  emit('confirm', payload)
  open.value = false
}
</script>

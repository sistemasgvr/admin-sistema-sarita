<template>
  <AppModal
    v-model="open"
    title="Cobrar garantía"
    subtitle="Depósito reembolsable industrial (queda como saldo hasta devolver el cilindro)."
    size="md"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AppSelectSearch
          v-model="idCliente"
          v-model:search="clienteBuscar"
          label="Cliente"
          placeholder="Selecciona cliente"
          search-placeholder="Nombre o documento..."
          required
          remote
          :options="clienteOptions"
          :loading="clientesQuery.isFetching.value"
          :disabled="Boolean(props.idCliente)"
        />
        <AppSelect
          v-model="idPrestamo"
          label="Préstamo (opcional)"
          placeholder="Sin préstamo"
          :options="prestamoOptions"
          :disabled="!idCliente || prestamosQuery.isFetching.value"
        />
        <AppSelectSearch
          v-model="idProducto"
          v-model:search="productoBuscar"
          label="Producto / tipo envase"
          placeholder="Selecciona producto (no servicios)"
          search-placeholder="Código o nombre..."
          class="sm:col-span-2"
          required
          remote
          :options="productoOptions"
          :loading="productosQuery.isFetching.value"
          hint="Solo productos. Los servicios no aplican a garantía industrial."
        />
        <AppSelect
          v-model="idTipoComprobante"
          label="Comprobante"
          placeholder="Selecciona"
          required
          :options="tipoComprobanteOptions"
        />
        <AppInput
          v-model="monto"
          label="Monto garantía"
          type="number"
          min="0"
          step="0.01"
          required
          hint="Prefill desde precio_garantia del producto/catálogo; puedes sobrescribir."
        />
      </div>

      <p
        v-if="origenMonto"
        class="text-xs text-gray-500 dark:text-gray-400"
      >
        Monto sugerido: {{ origenMonto }}
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="guardando"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="guardando || !puedeCobrar"
        @click="confirmar"
      >
        {{ guardando ? 'Registrando...' : 'Cobrar garantía' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCreateGarantiaMutation } from '@/modules/balones/garantias/composables/useGarantiaMutations'
import { usePrestamosQuery } from '@/modules/balones/prestamos/composables/usePrestamosQuery'
import type { PrestamoListFilters } from '@/modules/balones/prestamos/interfaces/prestamo.interface'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type { ProductoListFilters } from '@/modules/productos/articulos/interfaces/producto.interface'
import { catalogoPreciosService } from '@/modules/productos/catalogo-precios/services/catalogo-precios.service'
import { useCreateComprobanteMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import { usePosComprobanteForm } from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppSelectSearch } from '@/shared/components'
import { toastWarning } from '@/shared/composables/useToast'

const props = defineProps<{
  idCliente?: number | null
  idPrestamo?: number | null
  idProducto?: number | null
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [] }>()

const authStore = useAuthStore()
const createGarantiaMutation = useCreateGarantiaMutation()
const createComprobanteMutation = useCreateComprobanteMutation()
const {
  idTipoComprobante,
  serie,
  fecha,
  tipoComprobanteOptions,
  idAfectacionGravado,
  idMonedaPen,
  idTipoOperacionVentaInterna,
} = usePosComprobanteForm()

const idCliente = ref<number | ''>('')
const idPrestamo = ref<number | ''>('')
const idProducto = ref<number | ''>('')
const monto = ref(0)
const origenMonto = ref('')
const guardando = ref(false)
const clienteBuscar = ref('')
const productoBuscar = ref('')

const clientesFilters = ref({
  pagina: 1,
  limite: 50,
  soloActivos: 1 as number,
  buscar: undefined as string | undefined,
})
const clientesQuery = useClientesQuery(clientesFilters)

const prestamosFilters = ref<PrestamoListFilters>({
  pagina: 1,
  limite: 50,
  idCliente: undefined,
})
const prestamosQuery = usePrestamosQuery(prestamosFilters)

const productosFilters = ref<ProductoListFilters>({
  pagina: 1,
  limite: 80,
  soloActivos: 1,
  esServicio: false,
  buscar: undefined,
})
const productosQuery = useProductosQuery(productosFilters)

const clienteOptions = computed(() =>
  (clientesQuery.data.value?.data ?? []).map((c) => ({
    value: c.id,
    label: getClienteOptionLabel(c),
  })),
)

const prestamoOptions = computed(() => [
  { value: '', label: 'Sin préstamo' },
  ...(prestamosQuery.data.value?.data ?? []).map((p) => ({
    value: p.id,
    label: [p.numero_prestamo, p.titulo, p.nombre_cliente].filter(Boolean).join(' — ') || `#${p.id}`,
  })),
])

const productoOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.codigo ? `${p.codigo} — ` : ''}${p.nombre}${
      p.precio_garantia != null && Number(p.precio_garantia) > 0
        ? ` (garantía S/ ${Number(p.precio_garantia).toFixed(2)})`
        : ''
    }`,
  })),
)

const puedeCobrar = computed(
  () =>
    Boolean(idCliente.value) &&
    Boolean(idProducto.value) &&
    Boolean(idTipoComprobante.value) &&
    Number(monto.value) > 0,
)

watch(clienteBuscar, (term) => {
  clientesFilters.value = {
    ...clientesFilters.value,
    buscar: term.trim() || undefined,
  }
})

watch(productoBuscar, (term) => {
  productosFilters.value = {
    ...productosFilters.value,
    buscar: term.trim() || undefined,
  }
})

watch(idCliente, (value) => {
  prestamosFilters.value = {
    ...prestamosFilters.value,
    idCliente: value ? Number(value) : undefined,
  }
  if (!value) {
    idPrestamo.value = ''
  }
})

watch(idProducto, async (value) => {
  if (!value) {
    origenMonto.value = ''
    return
  }
  const producto = (productosQuery.data.value?.data ?? []).find((p) => p.id === value)
  let sugerido = Number(producto?.precio_garantia ?? 0)
  let origen = sugerido > 0 ? `producto (${producto?.nombre})` : ''

  try {
    const catalogo = await catalogoPreciosService.listar({
      idProducto: Number(value),
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
    // sin catálogo: se usa precio del producto
  }

  if (sugerido > 0) {
    monto.value = sugerido
    origenMonto.value = `S/ ${sugerido.toFixed(2)} desde ${origen}`
  } else {
    origenMonto.value = 'Sin precio_garantia en producto/catálogo — ingresa el monto manualmente'
  }
})

watch(
  () => [open.value, props.idCliente, props.idPrestamo, props.idProducto] as const,
  ([isOpen]) => {
    if (!isOpen) return
    idCliente.value = props.idCliente ?? ''
    idPrestamo.value = props.idPrestamo ?? ''
    idProducto.value = props.idProducto ?? ''
    monto.value = 0
    origenMonto.value = ''
    if (props.idCliente) {
      prestamosFilters.value = {
        ...prestamosFilters.value,
        idCliente: Number(props.idCliente),
      }
    }
  },
)

async function confirmar() {
  const userId = authStore.user?.id
  if (!userId || !puedeCobrar.value) {
    toastWarning('Completa cliente, producto, tipo de comprobante y monto')
    return
  }

  const producto = (productosQuery.data.value?.data ?? []).find(
    (p) => p.id === idProducto.value,
  )
  if (!producto) {
    toastWarning('Selecciona un producto válido')
    return
  }

  guardando.value = true
  try {
    const comprobante = await createComprobanteMutation.mutateAsync({
      idUsuarioAuditoria: userId,
      idTipoComprobante: Number(idTipoComprobante.value),
      serie: serie.value.trim(),
      fecha: fecha.value,
      idCliente: Number(idCliente.value),
      detalles: [
        {
          idProducto: producto.id,
          cantidad: 1,
          precioUnitario: Number(monto.value),
          descuento: 0,
          porcentajeIgv: 18,
          idAfectacionIgv: idAfectacionGravado.value,
          descripcion: `Garantía reembolsable — ${producto.nombre}`,
        },
      ],
      idTipoOperacionSunat: idTipoOperacionVentaInterna.value,
      idMoneda: idMonedaPen.value,
      glosa: 'Cobro de garantía industrial',
    })

    await createGarantiaMutation.mutateAsync({
      idUsuarioAuditoria: userId,
      idCliente: Number(idCliente.value),
      monto: Number(monto.value),
      idComprobante: comprobante.id,
      idPrestamo: idPrestamo.value ? Number(idPrestamo.value) : undefined,
      idProducto: producto.id,
      cantidadVenta: 1,
      idUnidadMedida: producto.id_unidad_medida ?? undefined,
      fechaRegistro: fecha.value,
      observacion: 'Cobro desde flujo industrial',
    })

    open.value = false
    emit('saved')
  } catch {
    // toast en mutations
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div>
    <PageBreadcrumb page-title="Recargar balón" :items="breadcrumbItems" />

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <section class="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          El cliente trae su cilindro. Ustedes llenan el gas y se genera boleta o factura.
        </p>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppSelect
            v-model="idCliente"
            label="Cliente"
            placeholder="Selecciona cliente"
            :options="clienteOptions"
            :disabled="clientesQuery.isLoading.value"
          />
          <AppSelect
            v-model="idBalon"
            label="Balón del cliente"
            placeholder="Selecciona cilindro"
            :options="balonOptions"
            :disabled="balonesQuery.isLoading.value"
          />
        </div>

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

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AppSelect
            v-model="idProducto"
            label="Gas"
            placeholder="Selecciona gas"
            :options="productoOptions"
            :disabled="productosQuery.isLoading.value"
            @update:model-value="onProductoChange"
          />
          <AppInput
            v-model="cantidad"
            label="Cantidad / m³"
            type="number"
            min="0.0001"
            step="0.0001"
          />
          <AppInput
            v-model="capacidad"
            label="Capacidad cilindro"
            type="number"
            min="0"
            step="0.0001"
            placeholder="Opcional"
          />
          <AppInput
            v-model="precioUnitario"
            label="Precio unitario"
            type="number"
            min="0"
            step="0.01"
          />
        </div>

        <AppInput
          v-model="observacion"
          label="Observación"
          placeholder="Opcional"
        />
      </section>

      <aside class="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Resumen</h3>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Valor venta</span>
            <span class="tabular-nums">{{ formatMoney(totales.valorVenta) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">IGV (18%)</span>
            <span class="tabular-nums">{{ formatMoney(totales.igv) }}</span>
          </div>
          <div class="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold dark:border-gray-800">
            <span>Total</span>
            <span class="tabular-nums">{{ formatMoney(totales.total) }}</span>
          </div>
        </div>

        <div v-if="comprobanteGuardado" class="rounded-lg bg-success-500/10 p-3 text-sm text-success-700 dark:text-success-400">
          Comprobante {{ comprobanteGuardado.serie }}-{{ comprobanteGuardado.numero }} registrado.
        </div>

        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="!puedeGuardar || createMutation.isPending.value"
            @click="registrarRecarga"
          >
            {{ createMutation.isPending.value ? 'Registrando...' : 'Registrar recarga' }}
          </button>

          <button
            v-if="comprobanteGuardadoId && canEmit"
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-success-500 px-4 py-2.5 text-sm font-medium text-success-600 hover:bg-success-500/10 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="emitMutation.isPending.value"
            @click="emitirComprobante"
          >
            {{ emitMutation.isPending.value ? 'Emitiendo...' : 'Emitir SUNAT' }}
          </button>

          <RouterLink
            :to="{ name: 'admin-balones-recargas' }"
            class="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          >
            Volver al listado
          </RouterLink>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { balonesBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useCreateRecargaClienteMutation } from '@/modules/balones/recargas/composables/useMovimientoRecargaMutations'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import { useEmitirComprobanteMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import { useComprobanteCatalogosPosQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppSelect } from '@/shared/components'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { toastWarning } from '@/shared/composables/useToast'

const breadcrumbItems = [
  ...balonesBreadcrumbItems('Recargas'),
  { label: 'Recargar balón' },
]

const authStore = useAuthStore()
const catalogosQuery = useComprobanteCatalogosPosQuery()
const createMutation = useCreateRecargaClienteMutation()
const emitMutation = useEmitirComprobanteMutation()

const clientesFilters = ref({ pagina: 1, limite: 300, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const balonesFilters = ref({ pagina: 1, limite: 300 })
const balonesQuery = useBalonesQuery(balonesFilters)

const productosFilters = ref({ pagina: 1, limite: 200, esGas: true })
const productosQuery = useProductosQuery(productosFilters)

const idCliente = ref<number | ''>('')
const idBalon = ref<number | ''>('')
const idProducto = ref<number | ''>('')
const idTipoComprobante = ref<number | ''>('')
const serie = ref('B001')
const numero = ref('')
const fecha = ref(new Date().toISOString().slice(0, 10))
const cantidad = ref(1)
const capacidad = ref<number | ''>('')
const precioUnitario = ref(0)
const observacion = ref('')

const comprobanteGuardadoId = ref<number | null>(null)
const comprobanteGuardado = ref<{ serie: string; numero: string } | null>(null)

const canEmit = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_EMITIR))

const tipoComprobanteOptions = computed(() =>
  (catalogosQuery.data.value?.tiposComprobante ?? [])
    .filter((item) => ['01', '03'].includes(item.descripcion ?? ''))
    .map((item) => ({
      value: item.id,
      label: `${item.nombre} (${item.descripcion})`,
    })),
)

const clienteOptions = computed(() =>
  (clientesQuery.data.value?.data ?? []).map((cliente) => ({
    value: cliente.id,
    label: `${cliente.razon_social ?? cliente.numero_documento} — ${cliente.numero_documento}`,
  })),
)

const balonOptions = computed(() =>
  (balonesQuery.data.value?.data ?? []).map((balon) => ({
    value: balon.id,
    label: balon.codigo_balon,
  })),
)

const productoOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  })),
)

const totales = computed(() => {
  const valorVenta = Number(cantidad.value || 0) * Number(precioUnitario.value || 0)
  const igv = valorVenta * 0.18

  return {
    valorVenta,
    igv,
    total: valorVenta + igv,
  }
})

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

watch(idTipoComprobante, async (value) => {
  if (!value || !serie.value.trim()) {
    numero.value = ''
    return
  }

  try {
    const result = await comprobantesService.obtenerSiguienteNumero(Number(value), serie.value)
    numero.value = result.numero
  } catch {
    numero.value = ''
  }
})

watch(serie, async (value) => {
  if (!idTipoComprobante.value || !value.trim()) return

  try {
    const result = await comprobantesService.obtenerSiguienteNumero(
      Number(idTipoComprobante.value),
      value,
    )
    numero.value = result.numero
  } catch {
    numero.value = ''
  }
})

watch(
  tipoComprobanteOptions,
  (options) => {
    if (!idTipoComprobante.value && options.length > 0) {
      const boleta = options.find((item) => item.label.includes('BOLETA'))
      idTipoComprobante.value = boleta?.value ?? options[0].value
    }
  },
  { immediate: true },
)

function onProductoChange() {
  const producto = (productosQuery.data.value?.data ?? []).find(
    (item) => item.id === Number(idProducto.value),
  )

  if (!producto) return

  precioUnitario.value = Number(producto.precio ?? 0)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
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
  comprobanteGuardado.value = {
    serie: result.comprobante.serie,
    numero: result.comprobante.numero,
  }
}

async function emitirComprobante() {
  const userId = authStore.user?.id
  if (!userId || !comprobanteGuardadoId.value) return

  await emitMutation.mutateAsync({
    id: comprobanteGuardadoId.value,
    idUsuarioAuditoria: userId,
  })
}
</script>

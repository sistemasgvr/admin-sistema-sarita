<template>
  <div>
    <PageBreadcrumb page-title="Punto de venta (accesorios)" :items="breadcrumbItems" />

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <section class="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AppSelect
            v-model="idTipoComprobante"
            label="Tipo"
            placeholder="Selecciona"
            :options="tipoComprobanteOptions"
            :disabled="catalogosQuery.isLoading.value"
          />
          <AppInput v-model="serie" label="Serie" placeholder="B001 / F001" />
          <AppInput v-model="numero" label="Número" placeholder="Automático" readonly />
          <AppInput v-model="fecha" label="Fecha" type="date" />
        </div>

        <AppSelect
          v-model="idCliente"
          label="Cliente"
          placeholder="Selecciona cliente"
          :options="clienteOptions"
          :disabled="clientesQuery.isLoading.value"
        />

        <p class="text-sm text-gray-500 dark:text-gray-400">
          Solo accesorios y productos que no son gas. Para recargar el balón del cliente use
          <RouterLink
            :to="{ name: 'admin-balones-recarga-cliente' }"
            class="font-medium text-brand-500 hover:underline"
          >
            Balones → Recargar balón
          </RouterLink>.
        </p>

        <div class="rounded-xl border border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Detalle</h3>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
              @click="agregarLineaVacia"
            >
              <AppIcon :name="ICONS.plus" :size="16" />
              Línea
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th class="px-3 py-2 text-left">Producto</th>
                  <th class="px-3 py-2 text-right">Cant.</th>
                  <th class="px-3 py-2 text-right">P. unit.</th>
                  <th class="px-3 py-2 text-right">Importe</th>
                  <th class="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="linea in lineas"
                  :key="linea.key"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td class="px-3 py-2">
                    <AppSelect
                      v-model="linea.idProducto"
                      placeholder="Producto"
                      :options="productoOptions"
                      @update:model-value="onProductoChange(linea)"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <AppInput
                      v-model="linea.cantidad"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <AppInput
                      v-model="linea.precioUnitario"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td class="px-3 py-2 text-right tabular-nums">
                    {{ formatMoney(calcularImporteLinea(linea)) }}
                  </td>
                  <td class="px-3 py-2 text-right">
                    <button
                      type="button"
                      class="rounded-lg p-1.5 text-error-500 hover:bg-error-500/10"
                      @click="quitarLinea(linea.key)"
                    >
                      <AppIcon :name="ICONS.trash" :size="16" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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

        <AppInput v-model="glosa" label="Glosa" placeholder="Opcional" />

        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="!puedeGuardar || createMutation.isPending.value"
            @click="guardarComprobante"
          >
            {{ createMutation.isPending.value ? 'Guardando...' : 'Guardar comprobante' }}
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
            :to="{ name: 'admin-ventas-comprobantes' }"
            class="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          >
            Ver comprobantes
          </RouterLink>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import {
  useCreateComprobanteMutation,
  useEmitirComprobanteMutation,
} from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import { useComprobanteCatalogosPosQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import type { PosLineItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import { AppInput, AppSelect } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { toastWarning } from '@/shared/composables/useToast'

const breadcrumbItems = [{ label: 'Ventas', path: '/admin/ventas/pos' }, { label: 'Accesorios' }]

const authStore = useAuthStore()
const catalogosQuery = useComprobanteCatalogosPosQuery()
const createMutation = useCreateComprobanteMutation()
const emitMutation = useEmitirComprobanteMutation()

const clientesFilters = ref({ pagina: 1, limite: 300, soloActivos: 1 as number })
const clientesQuery = useClientesQuery(clientesFilters)

const productosFilters = ref({ pagina: 1, limite: 300, esGas: false })
const productosQuery = useProductosQuery(productosFilters)

const idTipoComprobante = ref<number | ''>('')
const serie = ref('B001')
const numero = ref('')
const fecha = ref(new Date().toISOString().slice(0, 10))
const idCliente = ref<number | ''>('')
const glosa = ref('')
const comprobanteGuardadoId = ref<number | null>(null)

const lineas = ref<PosLineItem[]>([crearLineaVacia()])

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

const productoOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((producto) => ({
    value: producto.id,
    label: `${producto.codigo} — ${producto.nombre}`,
  })),
)

const idAfectacionGravado = computed(() => {
  const opcion = (catalogosQuery.data.value?.afectacionesIgv ?? []).find(
    (item) => item.descripcion === '10',
  )
  return opcion?.id
})

const idMonedaPen = computed(() => {
  const opcion = (catalogosQuery.data.value?.monedas ?? []).find((item) => item.nombre === 'PEN')
  return opcion?.id
})

const idTipoOperacionVentaInterna = computed(() => {
  const opcion = (catalogosQuery.data.value?.tiposOperacionSunat ?? []).find(
    (item) => item.descripcion === '0101',
  )
  return opcion?.id
})

const totales = computed(() => {
  let valorVenta = 0
  let igv = 0

  for (const linea of lineas.value) {
    const importe = calcularImporteLinea(linea)
    valorVenta += importe
    igv += importe * 0.18
  }

  return {
    valorVenta,
    igv,
    total: valorVenta + igv,
  }
})

const puedeGuardar = computed(() => {
  return (
    Boolean(idTipoComprobante.value) &&
    Boolean(idCliente.value) &&
    Boolean(serie.value.trim()) &&
    lineas.value.some((linea) => linea.idProducto && Number(linea.cantidad) > 0)
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

function crearLineaVacia(): PosLineItem {
  return {
    key: crypto.randomUUID(),
    idProducto: 0,
    codigo: '',
    nombre: '',
    cantidad: 1,
    precioUnitario: 0,
    idAfectacionIgv: undefined,
  }
}

function agregarLineaVacia() {
  lineas.value.push(crearLineaVacia())
}

function quitarLinea(key: string) {
  if (lineas.value.length === 1) {
    lineas.value = [crearLineaVacia()]
    return
  }

  lineas.value = lineas.value.filter((linea) => linea.key !== key)
}

function onProductoChange(linea: PosLineItem) {
  const producto = (productosQuery.data.value?.data ?? []).find(
    (item) => item.id === Number(linea.idProducto),
  )

  if (!producto) return

  linea.codigo = producto.codigo
  linea.nombre = producto.nombre
  linea.precioUnitario = Number(producto.precio ?? 0)
  linea.idAfectacionIgv = idAfectacionGravado.value
}

function calcularImporteLinea(linea: PosLineItem) {
  return Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

async function guardarComprobante() {
  const userId = authStore.user?.id
  if (!userId) {
    toastWarning('Sesión inválida')
    return
  }

  const detalles = lineas.value
    .filter((linea) => linea.idProducto && Number(linea.cantidad) > 0)
    .map((linea) => ({
      idProducto: Number(linea.idProducto),
      cantidad: Number(linea.cantidad),
      precioUnitario: Number(linea.precioUnitario),
      descuento: 0,
      porcentajeIgv: 18,
      idAfectacionIgv: linea.idAfectacionIgv ?? idAfectacionGravado.value,
      descripcion: linea.nombre,
    }))

  const comprobante = await createMutation.mutateAsync({
    idUsuarioAuditoria: userId,
    idTipoComprobante: Number(idTipoComprobante.value),
    serie: serie.value.trim(),
    numero: numero.value || undefined,
    fecha: fecha.value,
    idCliente: Number(idCliente.value),
    detalles,
    idTipoOperacionSunat: idTipoOperacionVentaInterna.value,
    idMoneda: idMonedaPen.value,
    glosa: glosa.value || undefined,
  })

  comprobanteGuardadoId.value = comprobante.id
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

<template>
  <AppModal
    v-model="open"
    title="Editar comprobante"
    :subtitle="comprobanteLabel"
    size="xl"
  >
    <div
      v-if="comprobanteQuery.isLoading.value"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando comprobante...
    </div>

    <div v-else-if="comprobante" class="space-y-4">
      <DetailSectionCard title="Datos" :icon="ICONS.receipt" :full-width="true">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Comprobante</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ comprobante.serie }}-{{ comprobante.numero }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Cliente</p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ comprobante.nombre_cliente ?? '—' }}
            </p>
          </div>
          <AppInput
            v-model="fecha"
            label="Fecha"
            type="date"
            :disabled="updateMutation.isPending.value"
            required
          />
          <AppInput
            v-model="glosa"
            label="Glosa"
            placeholder="Opcional"
            :disabled="updateMutation.isPending.value"
          />
        </div>
        <div class="mt-3">
          <AppTextarea
            v-model="observaciones"
            label="Observaciones"
            placeholder="Opcional"
            :rows="2"
            :disabled="updateMutation.isPending.value"
          />
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Detalle" :icon="ICONS.clipboardList" :full-width="true">
        <div class="mb-3">
          <AppSelectSearch
            v-model="idProductoAgregar"
            v-model:search="productoBuscar"
            label="Agregar producto"
            placeholder="Buscar y agregar"
            search-placeholder="Código, ubicación o nombre..."
            :options="productoOptions"
            :loading="productosQuery.isFetching.value"
            :disabled="updateMutation.isPending.value"
          />
        </div>

        <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 dark:bg-white/5">
              <tr>
                <th class="px-3 py-2 text-left">Producto</th>
                <th class="px-3 py-2 text-right">Cant.</th>
                <th class="px-3 py-2 text-right">P. unit.</th>
                <th class="px-3 py-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(linea, index) in lineas"
                :key="linea.key"
                class="border-t border-gray-100 dark:border-gray-800"
              >
                <td class="px-3 py-2">
                  {{ linea.descripcion }}
                </td>
                <td class="px-3 py-2 text-right">
                  <input
                    v-model.number="linea.cantidad"
                    type="number"
                    min="0.001"
                    step="0.001"
                    class="w-24 rounded-lg border border-gray-300 bg-transparent px-2 py-1 text-right tabular-nums dark:border-gray-700"
                    :disabled="updateMutation.isPending.value"
                  />
                </td>
                <td class="px-3 py-2 text-right">
                  <input
                    v-model.number="linea.precioUnitario"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-28 rounded-lg border border-gray-300 bg-transparent px-2 py-1 text-right tabular-nums dark:border-gray-700"
                    :disabled="updateMutation.isPending.value"
                  />
                </td>
                <td class="px-3 py-2 text-right tabular-nums">
                  {{ formatMoney(linea.cantidad * linea.precioUnitario) }}
                  <button
                    v-if="lineas.length > 1"
                    type="button"
                    class="ml-2 text-error-500 hover:underline"
                    :disabled="updateMutation.isPending.value"
                    @click="removeLinea(index)"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">
          Total: {{ formatMoney(totalEstimado) }}
        </p>
      </DetailSectionCard>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        :disabled="updateMutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="updateMutation.isPending.value || !canSave"
        @click="confirm"
      >
        {{ updateMutation.isPending.value ? 'Guardando...' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComprobanteQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import { useUpdateComprobanteMutation } from '@/modules/ventas/comprobantes/composables/useComprobanteMutations'
import type { ComprobanteListItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { AppInput, AppModal, AppSelectSearch, AppTextarea } from '@/shared/components'
import { validarStockParaAgregar } from '@/modules/ventas/comprobantes/utils/stockPos'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'

interface LineaEdit {
  key: string
  idProducto: number
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuento: number
  porcentajeIgv: number
  idAfectacionIgv?: number
}

const props = defineProps<{
  modelValue: boolean
  comprobante: ComprobanteListItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const updateMutation = useUpdateComprobanteMutation()

const comprobanteId = computed(() => (props.modelValue ? props.comprobante?.id ?? null : null))
const comprobanteQuery = useComprobanteQuery(comprobanteId)

const fecha = ref('')
const glosa = ref('')
const observaciones = ref('')
const lineas = ref<LineaEdit[]>([])

const idProductoAgregar = ref<number | ''>('')
const productoBuscar = ref('')
const productosFilters = ref({
  pagina: 1,
  limite: 40,
  soloActivos: 1 as number | null,
  buscar: undefined as string | undefined,
})
const productosQuery = useProductosQuery(productosFilters)

let productoBuscarTimeout: ReturnType<typeof setTimeout> | undefined
watch(productoBuscar, (value) => {
  if (productoBuscarTimeout) clearTimeout(productoBuscarTimeout)
  productoBuscarTimeout = setTimeout(() => {
    productosFilters.value = {
      ...productosFilters.value,
      buscar: value.trim() || undefined,
    }
  }, 300)
})

const productoOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((producto) => ({
    value: producto.id,
    label: [producto.codigo, producto.nombre].filter(Boolean).join(' — '),
  })),
)

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const comprobante = computed(() => comprobanteQuery.data.value ?? null)

const comprobanteLabel = computed(() => {
  if (!props.comprobante) return undefined
  return `${props.comprobante.serie}-${props.comprobante.numero}`
})

const totalEstimado = computed(() =>
  lineas.value.reduce((acc, linea) => acc + Number(linea.cantidad) * Number(linea.precioUnitario), 0),
)

const canSave = computed(
  () =>
    Boolean(fecha.value) &&
    lineas.value.length > 0 &&
    lineas.value.every((l) => l.cantidad > 0 && l.precioUnitario >= 0),
)

watch(
  () => comprobanteQuery.data.value,
  (data) => {
    if (!data) return
    fecha.value = String(data.fecha ?? '').slice(0, 10)
    glosa.value = data.glosa ?? ''
    observaciones.value = data.observaciones ?? ''
    lineas.value = (data.detalles ?? []).map((detalle, index) => ({
      key: `${detalle.id ?? detalle.id_producto}-${index}`,
      idProducto: detalle.id_producto,
      descripcion:
        detalle.descripcion || detalle.nombre_producto || `Producto ${detalle.id_producto}`,
      cantidad: Number(detalle.cantidad),
      precioUnitario: Number(detalle.precio_unitario),
      descuento: Number(detalle.descuento ?? 0),
      porcentajeIgv: Number(detalle.porcentaje_igv ?? 18),
      idAfectacionIgv: detalle.id_afectacion_igv ?? undefined,
    }))
    idProductoAgregar.value = ''
    productoBuscar.value = ''
  },
  { immediate: true },
)

watch(idProductoAgregar, (id) => {
  if (id === '' || id == null) return
  const producto = (productosQuery.data.value?.data ?? []).find((item) => item.id === id)
  if (producto) {
    agregarProducto(producto)
  }
  idProductoAgregar.value = ''
})

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function removeLinea(index: number) {
  lineas.value.splice(index, 1)
}

function agregarProducto(producto: Producto) {
  const existente = lineas.value.find((linea) => linea.idProducto === producto.id)
  const cantidadDeseada = existente
    ? Math.max(0.001, Number(existente.cantidad || 0) + 1)
    : 1

  const errorStock = validarStockParaAgregar(producto, cantidadDeseada)
  if (errorStock) {
    toastWarning(errorStock)
    return
  }

  if (existente) {
    existente.cantidad = cantidadDeseada
    toastSuccess(`${producto.nombre}: cantidad ${existente.cantidad}`)
    return
  }

  const afectacionDefault = lineas.value.find((l) => l.idAfectacionIgv)?.idAfectacionIgv
  lineas.value.push({
    key: crypto.randomUUID(),
    idProducto: producto.id,
    descripcion: producto.nombre,
    cantidad: 1,
    precioUnitario: Number(producto.precio ?? 0),
    descuento: 0,
    porcentajeIgv: 18,
    idAfectacionIgv: afectacionDefault,
  })
  toastSuccess(`${producto.nombre} agregado`)
}

async function confirm() {
  const row = props.comprobante
  const userId = authStore.user?.id
  if (!row || !userId || !canSave.value) return

  if (lineas.value.some((l) => !l.idProducto || l.cantidad <= 0)) {
    toastWarning('Revisa cantidades y productos del detalle')
    return
  }

  try {
    await updateMutation.mutateAsync({
      id: row.id,
      payload: {
        idUsuarioAuditoria: userId,
        fecha: fecha.value,
        glosa: glosa.value.trim() || undefined,
        observaciones: observaciones.value.trim() || undefined,
        detalles: lineas.value.map((linea) => ({
          idProducto: linea.idProducto,
          cantidad: Number(linea.cantidad),
          precioUnitario: Number(linea.precioUnitario),
          descuento: linea.descuento || undefined,
          porcentajeIgv: linea.porcentajeIgv,
          idAfectacionIgv: linea.idAfectacionIgv,
          descripcion: linea.descripcion,
        })),
      },
    })
    open.value = false
  } catch {
    // toast en la mutación
  }
}
</script>

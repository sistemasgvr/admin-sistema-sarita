<template>
  <AppModal v-model="open" :title="modalTitle" size="lg">
    <div v-if="isEdit && detailQuery.isLoading.value" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando...
    </div>

    <div v-else class="space-y-4">
      <DetailSectionCard title="Datos" :icon="ICONS.receipt" :full-width="true">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AppSelectSearch
            v-model="idProveedor"
            v-model:search="proveedorBuscar"
            label="Proveedor"
            placeholder="Buscar y seleccionar"
            search-placeholder="Nombre o documento..."
            :options="proveedorOptions"
            :loading="proveedoresQuery.isFetching.value"
            :disabled="saving"
          />
          <AppInput
            v-model="fecha"
            label="Fecha"
            type="date"
            :disabled="saving"
            required
          />
          <AppInput v-model="serie" label="Serie" placeholder="F001" :disabled="saving" />
          <AppInput v-model="numero" label="Número" placeholder="00001234" :disabled="saving" />
          <AppInput v-model="glosa" label="Glosa" placeholder="Opcional" :disabled="saving" />
        </div>

        <hr class="my-3 border-gray-200 dark:border-gray-700">

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AppInput v-model="subTotal" label="Sub total" type="number" step="0.01" :disabled="saving" />
          <AppInput v-model="igv" label="IGV" type="number" step="0.01" :disabled="saving" />
          <AppInput v-model="totalImporte" label="Total importe" type="number" step="0.01" :disabled="saving" required />
        </div>
        <div class="mt-3 flex items-center gap-6">
          <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input v-model="afectaInventario" type="checkbox" class="rounded border-gray-300" :disabled="saving" />
            Afecta inventario
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input v-model="declararSunat" type="checkbox" class="rounded border-gray-300" :disabled="saving" />
            Declarar SUNAT
          </label>
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Detalle" :icon="ICONS.clipboardList" :full-width="true">
        <div class="mb-3 flex flex-wrap items-end gap-3">
          <AppInput
            v-model="detalleDescripcion"
            label="Descripción"
            placeholder="Producto / concepto"
            class="min-w-[200px] flex-1"
            :disabled="saving"
          />
          <AppInput
            v-model="detalleCantidad"
            label="Cant."
            type="number"
            min="0.001"
            step="0.001"
            class="w-24"
            :disabled="saving"
          />
          <AppInput
            v-model="detalleImporte"
            label="Importe"
            type="number"
            min="0"
            step="0.01"
            class="w-32"
            :disabled="saving"
          />
          <button
            type="button"
            class="mb-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
            :disabled="saving || !detalleDescripcion.trim() || !detalleCantidad || !detalleImporte"
            @click="agregarDetalle"
          >
            <AppIcon :name="ICONS.plus" :size="20" />
          </button>
        </div>

        <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 dark:bg-white/5">
              <tr>
                <th class="px-3 py-2 text-left">Descripción</th>
                <th class="px-3 py-2 text-right">Cant.</th>
                <th class="px-3 py-2 text-right">Importe</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(det, index) in detalles" :key="index" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-3 py-2">{{ det.descripcion }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ det.cantidad }}</td>
                <td class="px-3 py-2 text-right tabular-nums">{{ formatMoney(det.importe) }}</td>
                <td class="px-3 py-2 text-right">
                  <button type="button" class="text-xs text-error-500 hover:underline" :disabled="saving" @click="detalles.splice(index, 1)">
                    Quitar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-right text-sm font-semibold text-gray-800 dark:text-white/90">
          Total detalle: {{ formatMoney(totalDetalle) }}
        </p>
      </DetailSectionCard>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        :disabled="saving"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="saving || !canSave"
        @click="confirm"
      >
        {{ saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Registrar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCompraQuery } from '@/modules/compras/composables/useComprasQuery'
import {
  useCreateCompraMutation,
  useUpdateCompraMutation,
} from '@/modules/compras/composables/useCompraMutations'
import type { CompraListItem, CreateCompraDetallePayload } from '@/modules/compras/interfaces/compra.interface'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { AppInput, AppModal, AppSelectSearch } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  modelValue: boolean
  compra?: CompraListItem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateCompraMutation()
const updateMutation = useUpdateCompraMutation()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const isEdit = computed(() => !!props.compra)

const compraId = computed(() => (props.modelValue && isEdit.value ? props.compra!.id : null))
const detailQuery = useCompraQuery(compraId)

const saving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const fecha = ref(new Date().toISOString().slice(0, 10))
const serie = ref('')
const numero = ref('')
const glosa = ref('')
const subTotal = ref<number | ''>('')
const igv = ref<number | ''>('')
const totalImporte = ref<number | ''>('')
const afectaInventario = ref(false)
const declararSunat = ref(false)
const detalles = ref<CreateCompraDetallePayload[]>([])

// Proveedores
const idProveedor = ref<number | ''>('')
const proveedorBuscar = ref('')
const proveedoresFilters = ref({ pagina: 1, limite: 50, soloActivos: 1 as number, buscar: undefined as string | undefined })
const proveedoresQuery = useClientesQuery(proveedoresFilters)
let proveedorBuscarTimeout: ReturnType<typeof setTimeout> | undefined
watch(proveedorBuscar, (v) => {
  if (proveedorBuscarTimeout) clearTimeout(proveedorBuscarTimeout)
  proveedorBuscarTimeout = setTimeout(() => {
    proveedoresFilters.value = { ...proveedoresFilters.value, buscar: v.trim() || undefined }
  }, 350)
})
const proveedorOptions = computed(() =>
  (proveedoresQuery.data.value?.data ?? []).map((c) => ({ value: c.id, label: getClienteOptionLabel(c) })),
)

// Detalle temporal
const detalleDescripcion = ref('')
const detalleCantidad = ref<number | ''>('')
const detalleImporte = ref<number | ''>('')

function agregarDetalle() {
  if (!detalleDescripcion.value.trim() || !detalleCantidad.value || !detalleImporte.value) return
  detalles.value.push({
    descripcion: detalleDescripcion.value.trim(),
    cantidad: Number(detalleCantidad.value),
    importe: Number(detalleImporte.value),
  })
  detalleDescripcion.value = ''
  detalleCantidad.value = ''
  detalleImporte.value = ''
}

const totalDetalle = computed(() =>
  detalles.value.reduce((acc, d) => acc + Number(d.importe), 0),
)

const canSave = computed(
  () =>
    Boolean(fecha.value) &&
    detalles.value.length > 0 &&
    totalImporte.value !== '' && Number(totalImporte.value) > 0,
)

const modalTitle = computed(() => (isEdit.value ? 'Editar comprobante de compra' : 'Nuevo comprobante de compra'))

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return
    fecha.value = new Date().toISOString().slice(0, 10)
    serie.value = ''
    numero.value = ''
    glosa.value = ''
    subTotal.value = ''
    igv.value = ''
    totalImporte.value = ''
    afectaInventario.value = false
    declararSunat.value = false
    idProveedor.value = ''
    detalles.value = []
  },
)

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data) return
    fecha.value = String(data.fecha ?? '').slice(0, 10)
    serie.value = data.serie ?? ''
    numero.value = data.numero ?? ''
    glosa.value = data.glosa ?? ''
    subTotal.value = data.sub_total ?? ''
    igv.value = data.igv ?? ''
    totalImporte.value = data.total_importe
    afectaInventario.value = data.afecta_inventario
    declararSunat.value = data.declarar_sunat
    idProveedor.value = data.id_proveedor ?? ''
    detalles.value = (data.detalles ?? []).map((d) => ({
      idClasificacionGasto: d.id_clasificacion_gasto ?? undefined,
      idProducto: d.id_producto ?? undefined,
      descripcion: d.descripcion,
      idUnidadMedida: d.id_unidad_medida ?? undefined,
      cantidad: Number(d.cantidad),
      precioUnitario: d.precio_unitario ?? undefined,
      importe: Number(d.importe),
      idMedioPago: d.id_medio_pago ?? undefined,
      fechaPago: d.fecha_pago ?? undefined,
      numeroOperacion: d.numero_operacion ?? undefined,
      afectaStock: d.afecta_stock,
      observacion: d.observacion ?? undefined,
    }))
  },
)

async function confirm() {
  const userId = authStore.user?.id
  if (!userId || !canSave.value) return

  const payload = {
    idUsuarioAuditoria: userId,
    fecha: fecha.value,
    serie: serie.value.trim() || undefined,
    numero: numero.value.trim() || undefined,
    idProveedor: Number(idProveedor.value) || undefined,
    subTotal: subTotal.value !== '' ? Number(subTotal.value) : undefined,
    igv: igv.value !== '' ? Number(igv.value) : undefined,
    totalImporte: Number(totalImporte.value),
    afectaInventario: afectaInventario.value,
    declararSunat: declararSunat.value,
    glosa: glosa.value.trim() || undefined,
    detalles: detalles.value,
  }

  try {
    if (isEdit.value && props.compra) {
      await updateMutation.mutateAsync({ id: props.compra.id, payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    open.value = false
    emit('saved')
  } catch {
    // toast en mutación
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}
</script>

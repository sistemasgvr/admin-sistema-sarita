<template>
  <AppModal
    v-model="open"
    title="Nueva nota de crédito"
    subtitle="Busca la boleta o factura a corregir"
    size="xl"
  >
    <div class="space-y-4">
      <DetailSectionCard title="Documento origen" :icon="ICONS.search" :full-width="true">
        <AppInput
          v-model="buscar"
          label="Buscar venta"
          placeholder="Serie-número o cliente..."
          :disabled="loading"
        />
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Solo se muestran boletas y facturas aceptadas por SUNAT.
        </p>
      </DetailSectionCard>

      <DetailSectionCard title="Resultados" :icon="ICONS.receipt" :full-width="true">
        <div
          v-if="loading"
          class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Buscando comprobantes...
        </div>
        <div
          v-else-if="!resultados.length"
          class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          {{
            buscar.trim()
              ? 'No se encontraron boletas/facturas aceptadas con ese criterio.'
              : 'Escribe para buscar o espera el listado reciente de ventas aceptadas.'
          }}
        </div>
        <div
          v-else
          class="max-h-80 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <table class="min-w-full text-sm">
            <thead class="sticky top-0 bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-3 py-2 text-left">Comprobante</th>
                <th class="px-3 py-2 text-left">Cliente</th>
                <th class="px-3 py-2 text-left">Fecha</th>
                <th class="px-3 py-2 text-right">Total</th>
                <th class="px-3 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in resultados"
                :key="row.id"
                class="border-t border-gray-100 dark:border-gray-800"
              >
                <td class="px-3 py-2">
                  <p class="font-medium text-gray-800 dark:text-white/90">
                    {{ row.serie }}-{{ row.numero }}
                  </p>
                  <div class="mt-1">
                    <ListaOpcionBadge
                      :value="row.nombre_tipo_comprobante ?? row.codigo_tipo_comprobante"
                    />
                  </div>
                </td>
                <td class="px-3 py-2">{{ row.nombre_cliente ?? '—' }}</td>
                <td class="px-3 py-2">{{ formatFecha(row.fecha) }}</td>
                <td class="px-3 py-2 text-right tabular-nums">
                  {{ formatMoney(Number(row.total_importe ?? 0)) }}
                </td>
                <td class="px-3 py-2 text-right">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                    @click="seleccionar(row)"
                  >
                    Usar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </DetailSectionCard>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        @click="open = false"
      >
        Cancelar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useComprobanteCatalogosPosQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import type { ComprobanteListItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { AppInput, AppModal, ListaOpcionBadge } from '@/shared/components'
import { toastApiError } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  selected: [comprobante: ComprobanteListItem]
}>()

const catalogosQuery = useComprobanteCatalogosPosQuery()
const buscar = ref('')
const loading = ref(false)
const resultados = ref<ComprobanteListItem[]>([])

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const idEstadoAceptado = computed(() => {
  const estados = catalogosQuery.data.value?.estadosSunat ?? []
  return estados.find((e) => e.nombre.toUpperCase() === 'ACEPTADO')?.id ?? null
})

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return
    buscar.value = ''
    await buscarVentas()
  },
)

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    void buscarVentas()
  }, 350)
})

watch(idEstadoAceptado, (id) => {
  if (props.modelValue && id != null) {
    void buscarVentas()
  }
})

function esBoletaOFactura(row: ComprobanteListItem) {
  const codigo = String(row.codigo_tipo_comprobante ?? '')
  const nombre = String(row.nombre_tipo_comprobante ?? '').toUpperCase()
  if (codigo === '01' || codigo === '03') return true
  return (
    (nombre.includes('FACTURA') || nombre.includes('BOLETA')) &&
    !nombre.includes('NOTA')
  )
}

async function buscarVentas() {
  loading.value = true
  try {
    const response = await comprobantesService.listar({
      buscar: buscar.value.trim() || undefined,
      idEstadoSunat: idEstadoAceptado.value ?? undefined,
      pagina: 1,
      limite: 30,
    })

    resultados.value = (response.data ?? []).filter(
      (row) => esBoletaOFactura(row) && row.nombre_estado_sunat === 'ACEPTADO',
    )
  } catch (error) {
    resultados.value = []
    toastApiError(error, 'No se pudieron buscar las ventas')
  } finally {
    loading.value = false
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function formatFecha(value: string) {
  const base = String(value ?? '').slice(0, 10)
  const [y, m, d] = base.split('-')
  if (!y || !m || !d) return value
  return `${d}/${m}/${y}`
}

function seleccionar(row: ComprobanteListItem) {
  emit('selected', row)
  open.value = false
}
</script>

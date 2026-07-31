<template>
  <AppModal
    v-model="open"
    size="xl"
    title="Detalle de clientes con deuda"
    :subtitle="subtitle"
    content-class="!px-0 !py-0"
  >
    <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">
      <div class="w-full sm:max-w-sm">
        <AppInput v-model="buscar" type="search" placeholder="Buscar cliente o documento..." />
      </div>
    </div>

    <div v-if="!filtrados.length" class="px-5 py-14 text-center text-sm text-gray-500 dark:text-gray-400">
      No hay clientes que coincidan.
    </div>

    <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <li
        v-for="cliente in filtrados"
        :key="cliente.idCliente"
        :ref="(el) => registrarFila(cliente.idCliente, el)"
      >
        <!-- Encabezado del cliente -->
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.03] sm:px-5"
          :class="{ 'bg-brand-50/60 dark:bg-brand-500/10': isClienteAbierto(cliente.idCliente) }"
          @click="toggleCliente(cliente.idCliente)"
        >
          <AppIcon
            :name="ICONS.chevronRight"
            :size="16"
            class="shrink-0 text-gray-400 transition-transform"
            :class="{ 'rotate-90': isClienteAbierto(cliente.idCliente) }"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-gray-800 dark:text-white/90">
              {{ displayName(cliente) }}
            </p>
            <p class="text-theme-xs text-gray-400 dark:text-gray-500">
              {{ cliente.numeroDocumento || '—' }} · {{ cliente.comprobantes.length }} comprobante(s)
            </p>
          </div>
          <span class="shrink-0 text-sm font-semibold text-rose-600 dark:text-rose-400">
            {{ formatCurrency(cliente.montoTotalDeuda) }}
          </span>
        </button>

        <!-- Comprobantes del cliente -->
        <div v-if="isClienteAbierto(cliente.idCliente)" class="bg-gray-50/60 px-4 pb-3 dark:bg-white/[0.02] sm:px-5">
          <div
            v-for="comp in cliente.comprobantes"
            :key="comp.idCuenta"
            class="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <button
              type="button"
              class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              @click="toggleComprobante(comp.idCuenta)"
            >
              <AppIcon
                :name="ICONS.chevronRight"
                :size="14"
                class="shrink-0 text-gray-400 transition-transform"
                :class="{ 'rotate-90': isComprobanteAbierto(comp.idCuenta) }"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                  {{ [comp.serie, comp.numero].filter(Boolean).join('-') || 'Comprobante' }}
                </p>
                <p class="text-theme-xs text-gray-400 dark:text-gray-500">
                  Vence: {{ formatListDate(comp.fechaVencimiento) }}
                </p>
              </div>
              <span class="shrink-0 text-sm font-semibold text-gray-700 dark:text-gray-200">
                {{ formatCurrency(comp.montoSaldo) }}
              </span>
            </button>

            <!-- Productos del comprobante -->
            <div
              v-if="isComprobanteAbierto(comp.idCuenta)"
              class="border-t border-gray-100 px-3 py-2 dark:border-gray-800"
            >
              <div v-if="!comp.productos.length" class="py-1 text-theme-xs text-gray-400 dark:text-gray-500">
                Sin detalle de productos.
              </div>
              <table v-else class="w-full text-sm">
                <thead>
                  <tr class="text-theme-xs text-gray-400 dark:text-gray-500">
                    <th class="py-1 text-left font-medium">Producto</th>
                    <th class="py-1 text-right font-medium">Cant.</th>
                    <th class="py-1 text-right font-medium">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="prod in comp.productos"
                    :key="prod.idProducto"
                    class="border-t border-gray-50 dark:border-gray-800/60"
                  >
                    <td class="py-1.5 pr-2 text-gray-700 dark:text-gray-300">{{ prod.nombre }}</td>
                    <td class="py-1.5 text-right text-gray-600 dark:text-gray-400">{{ prod.cantidad }}</td>
                    <td class="py-1.5 text-right font-medium text-gray-700 dark:text-gray-300">
                      {{ formatCurrency(prod.importe) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, type ComponentPublicInstance } from 'vue'
import { AppInput, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { ClienteConDeuda } from '@/modules/dashboard/interfaces/dashboard.interface'
import { ICONS } from '@/shared/constants/icons'
import { formatCurrency } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'

const props = defineProps<{
  clientes: ClienteConDeuda[]
  focusId?: number | null
}>()

const open = defineModel<boolean>({ required: true })

const buscar = ref('')
const clientesAbiertos = ref<Set<number>>(new Set())
const comprobantesAbiertos = ref<Set<number>>(new Set())
const filasRef = new Map<number, HTMLElement>()

const displayName = (cliente: ClienteConDeuda): string =>
  cliente.razonSocial?.trim() || cliente.nombres?.trim() || `Cliente #${cliente.idCliente}`

const totalDeuda = computed(() =>
  props.clientes.reduce((sum, c) => sum + Number(c.montoTotalDeuda ?? 0), 0),
)

const subtitle = computed(
  () => `${props.clientes.length} cliente(s) · ${formatCurrency(totalDeuda.value)} en total`,
)

const filtrados = computed(() => {
  const q = buscar.value.trim().toLowerCase()
  if (!q) return props.clientes
  return props.clientes.filter((c) => {
    const nombre = displayName(c).toLowerCase()
    const doc = (c.numeroDocumento ?? '').toLowerCase()
    return nombre.includes(q) || doc.includes(q)
  })
})

const isClienteAbierto = (id: number) => clientesAbiertos.value.has(id)
const isComprobanteAbierto = (id: number) => comprobantesAbiertos.value.has(id)

const toggleCliente = (id: number) => {
  const next = new Set(clientesAbiertos.value)
  next.has(id) ? next.delete(id) : next.add(id)
  clientesAbiertos.value = next
}

const toggleComprobante = (id: number) => {
  const next = new Set(comprobantesAbiertos.value)
  next.has(id) ? next.delete(id) : next.add(id)
  comprobantesAbiertos.value = next
}

const registrarFila = (id: number, el: Element | ComponentPublicInstance | null) => {
  if (el instanceof HTMLElement) filasRef.set(id, el)
  else filasRef.delete(id)
}

watch(open, (isOpen) => {
  if (!isOpen) return
  buscar.value = ''
  comprobantesAbiertos.value = new Set()
  clientesAbiertos.value = props.focusId ? new Set([props.focusId]) : new Set()

  if (props.focusId) {
    nextTick(() => {
      filasRef.get(props.focusId as number)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
})
</script>

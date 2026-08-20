<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="mb-4 flex items-center gap-2">
      <AppIcon :name="ICONS.handCoins" :size="18" class="text-gray-500 dark:text-gray-400" />
      <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ titulo }}</h3>
    </div>

    <div v-if="loading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando…
    </div>

    <div
      v-else-if="!clientesLimitados.length"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Sin clientes con deuda pendiente.
    </div>

    <ul v-else class="space-y-4">
      <li v-for="cliente in clientesLimitados" :key="cliente.idCliente">
        <AppInspectPopover :title="nombreCliente(cliente)">
          <RouterLink
            :to="{ name: 'admin-finanzas', query: { idCliente: cliente.idCliente } }"
            class="group block rounded-lg -mx-1.5 px-1.5 py-0.5 transition hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <div class="mb-1.5 flex items-center justify-between gap-3">
              <p class="truncate text-theme-sm font-medium text-gray-700 group-hover:underline dark:text-gray-200">
                {{ nombreCliente(cliente) }}
              </p>
              <p class="shrink-0 text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                {{ formatCurrency(cliente.montoTotalDeuda) }}
              </p>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                class="h-full rounded-full bg-brand-500 dark:bg-brand-400"
                :style="{ width: `${porcentaje(cliente.montoTotalDeuda)}%` }"
              />
            </div>
          </RouterLink>

          <template #detail>
            <div class="mb-3 flex items-center justify-between gap-3">
              <dt class="text-xs text-gray-500 dark:text-gray-400">Documento</dt>
              <dd class="text-xs font-medium text-gray-700 dark:text-gray-300">
                {{ cliente.numeroDocumento || '—' }}
              </dd>
            </div>
            <div class="mb-3 flex items-center justify-between gap-3">
              <dt class="text-xs text-gray-500 dark:text-gray-400">Documentos pendientes</dt>
              <dd class="text-xs font-medium text-gray-700 dark:text-gray-300">
                {{ cliente.comprobantes.length }}
              </dd>
            </div>

            <div v-if="cliente.comprobantes.length" class="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
              <div
                v-for="comprobante in cliente.comprobantes.slice(0, 5)"
                :key="comprobante.idCuenta"
                class="flex items-center justify-between gap-3"
              >
                <div class="min-w-0">
                  <p class="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                    {{ comprobante.serie && comprobante.numero
                      ? `${comprobante.serie}-${comprobante.numero}`
                      : `Cuenta #${comprobante.idCuenta}` }}
                  </p>
                  <p
                    class="text-[11px]"
                    :class="comprobante.estadoPago === 'VENCIDO' ? 'text-error-500' : 'text-gray-400 dark:text-gray-500'"
                  >
                    {{ comprobante.estadoPago === 'VENCIDO'
                      ? `Vencido hace ${comprobante.diasRetraso} día(s)`
                      : `Vence ${formatListDate(comprobante.fechaVencimiento)}` }}
                  </p>
                </div>
                <span class="shrink-0 text-xs font-semibold text-gray-800 dark:text-white/90">
                  {{ formatCurrency(comprobante.montoSaldo) }}
                </span>
              </div>
              <p v-if="cliente.comprobantes.length > 5" class="pt-1 text-[11px] text-gray-400 dark:text-gray-500">
                + {{ cliente.comprobantes.length - 5 }} documento(s) más
              </p>
            </div>

            <p class="mt-3 flex items-center gap-1 border-t border-gray-100 pt-3 text-[11px] text-brand-600 dark:border-gray-800 dark:text-brand-400">
              <AppIcon :name="ICONS.externalLink" :size="11" />
              Clic para ver su cuenta por cobrar
            </p>
          </template>
        </AppInspectPopover>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppInspectPopover } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import type { DashboardClienteConDeuda } from '@/modules/dashboard/interfaces/dashboard.interface'
import { formatCurrency } from '@/shared/utils/currency'
import { formatListDate } from '@/shared/utils/date'

const props = withDefaults(
  defineProps<{
    clientes: DashboardClienteConDeuda[]
    loading?: boolean
    limite?: number
    titulo?: string
  }>(),
  {
    loading: false,
    limite: 5,
    titulo: 'Top clientes con mayor deuda',
  },
)

const clientesLimitados = computed(() => props.clientes.slice(0, props.limite))

const nombreCliente = (cliente: DashboardClienteConDeuda) =>
  cliente.razonSocial || cliente.nombres || 'Cliente sin nombre'

const montoMaximo = computed(() =>
  clientesLimitados.value.reduce((max, c) => Math.max(max, c.montoTotalDeuda), 0),
)

const porcentaje = (monto: number) => {
  if (montoMaximo.value <= 0) return 0
  return Math.max(4, Math.round((monto / montoMaximo.value) * 100))
}
</script>

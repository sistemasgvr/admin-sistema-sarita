<template>
  <AppModal
    v-model="open"
    title="Detalle de cuenta bancaria"
    :subtitle="cuenta ? getTitular(cuenta) : undefined"
    size="xl"
  >
    <div v-if="cuenta" class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge :color="cuenta.estado === 1 ? 'success' : 'error'">
          {{ cuenta.estado === 1 ? 'Activo' : 'Inactivo' }}
        </AppBadge>
        <AppBadge v-if="cuenta.es_principal" color="warning">
          Principal
        </AppBadge>
      </div>

      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          Datos de la cuenta
        </h5>
        <dl class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div v-for="item in sections" :key="item.label" :class="item.fullWidth ? 'sm:col-span-2' : ''">
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">{{ item.label }}</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              <a
                v-if="item.isLink && item.linkHref"
                :href="item.linkHref"
                target="_blank"
                class="text-brand-500 hover:text-brand-600"
              >
                {{ item.value ?? '—' }}
              </a>
              <span v-else>{{ item.value ?? '—' }}</span>
            </dd>
          </div>
        </dl>
      </section>

      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Auditoría</h5>
        <dl class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Creado por</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ cuenta.nombre_usuario_creacion ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Fecha de creación</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ formatDateTime(cuenta.fecha_creacion) }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Modificado por</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ cuenta.nombre_usuario_modificacion ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Fecha de modificación</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ formatDateTime(cuenta.fecha_modificacion) }}
            </dd>
          </div>
        </dl>
      </section>
    </div>

    <div v-else class="py-10 text-center text-sm text-gray-500">Cargando...</div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="open = false"
      >
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useCuentaBancariaDetailQuery } from '@/modules/cuentas-bancarias/composables/useCuentaBancariaDetailQuery'
import type { CuentaBancaria } from '@/modules/cuentas-bancarias/interfaces/cuenta-bancaria.interface'
import { AppBadge, AppModal } from '@/shared/components'
import { formatDateTime } from '@/shared/utils/date'

interface DetailItem {
  label: string
  value: string | null | undefined
  fullWidth?: boolean
  isLink?: boolean
  linkHref?: string
}

interface CuentaBancariaDetailModalProps {
  cuenta?: CuentaBancaria | null
}

const props = defineProps<CuentaBancariaDetailModalProps>()

const open = defineModel<boolean>({ default: false })

const idReferencia = computed(() => props.cuenta?.id)
const detailQuery = useCuentaBancariaDetailQuery(idReferencia, open)
const cuenta = computed<CuentaBancaria | null>(
  () => detailQuery.data.value ?? props.cuenta ?? null,
)

const getNombreCliente = (c: CuentaBancaria) => {
  if (c.cliente_razon_social) return c.cliente_razon_social
  const nombreCompleto = [c.cliente_nombres, c.cliente_apellido_paterno, c.cliente_apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()
  return nombreCompleto || c.cliente_numero_documento || '—'
}

const getTitular = (c: CuentaBancaria) => c.titular || '—'

const sections = computed<DetailItem[]>(() => {
  const c = cuenta.value
  if (!c) return []

  return [
    { label: 'Titular', value: c.titular, fullWidth: true },
    { label: 'Banco', value: c.nombre_banco ?? '—' },
    { label: 'Tipo de cuenta', value: c.nombre_tipo_cuenta ?? '—' },
    { label: 'Número de cuenta', value: c.numero_cuenta ?? '—' },
    { label: 'CCI', value: c.numero_cuenta_interbancaria ?? '—' },
    { label: 'Teléfono (Yape/Plin)', value: c.telefono_billetera ?? '—' },
    { label: 'Cliente', value: getNombreCliente(c), fullWidth: true },
    { label: 'Es principal', value: c.es_principal ? 'Sí' : 'No' },
  ]
})

watch(
  () => props.cuenta,
  () => {
    if (open.value && props.cuenta) {
      detailQuery
    }
  },
)
</script>

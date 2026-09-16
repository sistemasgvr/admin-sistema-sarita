<template>
  <div class="space-y-6">
    <PageBreadcrumb page-title="Percepciones" :items="breadcrumb" />

    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Percepciones</h1>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
        @click="router.push({ name: 'admin-percepciones-nueva' })"
      >
        <AppIcon :name="ICONS.plus" :size="14" />
        Nueva percepción
      </button>
    </div>

    <!-- Filtros -->
    <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppInput v-model="filtros.fechaDesde" type="date" label="Fecha desde" />
        <AppInput v-model="filtros.fechaHasta" type="date" label="Fecha hasta" />
        <div class="flex items-end">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            @click="cargar"
          >
            <AppIcon :name="ICONS.search" :size="14" />
            Buscar
          </button>
        </div>
      </div>
    </div>

    <!-- Lista -->
    <div class="rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Serie</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Número</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Fecha</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Régimen</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Base</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Percibido</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Cobrado</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">SUNAT</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-if="cargando">
              <td colspan="9" class="px-4 py-8 text-center text-sm text-gray-500">Cargando...</td>
            </tr>
            <tr v-else-if="registros.length === 0">
              <td colspan="9" class="px-4 py-8 text-center text-sm text-gray-500">No hay percepciones registradas</td>
            </tr>
            <tr
              v-for="item in registros"
              :key="item.id"
              class="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-white/[0.04]"
              @click="router.push({ name: 'admin-percepciones-detalle', params: { id: item.id } })"
            >
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ item.serie }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ item.numero }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ formatFecha(item.fecha_emision) }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ item.regimen }}</td>
              <td class="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{{ formatMoney(item.base_imponible) }}</td>
              <td class="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{{ formatMoney(item.monto_percibido) }}</td>
              <td class="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{{ formatMoney(item.monto_cobrado) }}</td>
              <td class="px-4 py-3 text-center">
                <AppBadge
                  v-if="item.nombre_estado_sunat"
                  size="sm"
                  :color="item.nombre_estado_sunat === 'ACEPTADO' ? 'success' : item.nombre_estado_sunat === 'RECHAZADO' ? 'error' : 'warning'"
                >
                  {{ item.nombre_estado_sunat }}
                </AppBadge>
                <span v-else class="text-xs text-gray-400">Sin emitir</span>
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  class="text-brand-500 hover:text-brand-700 text-xs font-medium"
                  @click.stop="router.push({ name: 'admin-percepciones-detalle', params: { id: item.id } })"
                >
                  Ver
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="total > tamano" class="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
        <span class="text-xs text-gray-500">Mostrando {{ registros.length }} de {{ total }}</span>
        <div class="flex gap-1">
          <button
            :disabled="pagina <= 1"
            class="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            @click="pagina--; cargar()"
          >
            Anterior
          </button>
          <button
            :disabled="registros.length < tamano"
            class="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            @click="pagina++; cargar()"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { percepcionesService } from '../services/percepciones.service'
import type { PercepcionListItem } from '../interfaces/percepcion.interface'
import { useEmpresaSeleccionada } from '@/modules/configuracion/empresas/composables/useEmpresaSeleccionada'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { AppBadge, AppInput } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const router = useRouter()
const empresaSeleccionada = useEmpresaSeleccionada()

const breadcrumb = [
  { label: 'Inicio', to: '/' },
  { label: 'Ventas', to: '/ventas' },
  { label: 'Percepciones' },
]

const registros = ref<PercepcionListItem[]>([])
const cargando = ref(false)
const total = ref(0)
const pagina = ref(1)
const tamano = ref(20)

const filtros = ref({
  fechaDesde: '',
  fechaHasta: '',
})

async function cargar() {
  cargando.value = true
  try {
    const resp = await percepcionesService.listar({
      idEmpresa: empresaSeleccionada.value ?? undefined,
      fechaDesde: filtros.value.fechaDesde || undefined,
      fechaHasta: filtros.value.fechaHasta || undefined,
      pagina: pagina.value,
      tamano: tamano.value,
    })
    registros.value = resp.data ?? []
    total.value = resp.meta?.total ?? 0
  } catch {
    registros.value = []
    total.value = 0
  } finally {
    cargando.value = false
  }
}

/** Fechas civiles (YYYY-MM-DD): se muestran tal cual, sin pasar por UTC. */
function formatFecha(fecha: string) {
  if (!fecha) return '—'
  const [y, m, d] = fecha.slice(0, 10).split('-')
  return y && m && d ? `${d}/${m}/${y}` : fecha
}

function formatMoney(valor: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor ?? 0)
}

onMounted(cargar)
</script>

<template>
  <div class="space-y-6">
    <PageBreadcrumb page-title="Retención" :items="breadcrumb" />

    <div v-if="cargando" class="text-center py-8 text-gray-500">Cargando...</div>

    <template v-else-if="retencion">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Retención {{ retencion.serie }}-{{ retencion.numero }}
          </h1>
          <p class="text-sm text-gray-500">Emitida el {{ formatFecha(retencion.fecha_emision) }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <!--
            La percepción/retención responde en el mismo envío (sin ticket): el
            estado sale del CDR. Aceptada = ya no se reemite y se ofrecen los
            documentos oficiales; cualquier otro estado permite (re)emitir.
          -->
          <button
            v-if="retencion.nombre_estado_sunat === 'ACEPTADO'"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-70"
            :disabled="descargandoPdfXml"
            @click="onVerPdfOficial"
          >
            <AppIcon :name="ICONS.download" :size="14" class="text-brand-500" />
            {{ descargandoPdfXml ? 'Obteniendo...' : 'Ver PDF oficial' }}
          </button>
          <button
            v-if="retencion.nombre_estado_sunat === 'ACEPTADO'"
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-70"
            :disabled="descargandoPdfXml"
            @click="onDescargarXmlOficial"
          >
            <AppIcon :name="ICONS.download" :size="14" />
            XML firmado
          </button>
          <button
            v-else
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-70"
            :disabled="emitiendo"
            @click="onEmitir"
          >
            <AppIcon :name="ICONS.check" :size="14" />
            {{ emitiendo ? 'Emitiendo...' : retencion.nombre_estado_sunat === 'RECHAZADO' ? 'Reintentar emisión' : 'Emitir a SUNAT' }}
          </button>
        </div>
      </div>

      <!-- Datos de la retención -->
      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Datos de la retención</h2>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span class="text-xs text-gray-500">Serie</span>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ retencion.serie }}</p>
          </div>
          <div>
            <span class="text-xs text-gray-500">Número</span>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ retencion.numero }}</p>
          </div>
          <div>
            <span class="text-xs text-gray-500">Régimen</span>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ retencion.regimen }}</p>
          </div>
          <div>
            <span class="text-xs text-gray-500">Tasa</span>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ retencion.tasa }}%</p>
          </div>
          <div>
            <span class="text-xs text-gray-500">Base imponible</span>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatMoney(retencion.base_imponible) }}</p>
          </div>
          <div>
            <span class="text-xs text-gray-500">Monto retenido</span>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatMoney(retencion.monto_retenido) }}</p>
          </div>
          <div>
            <span class="text-xs text-gray-500">Monto pagado</span>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatMoney(retencion.monto_pagado) }}</p>
          </div>
          <div>
            <span class="text-xs text-gray-500">Estado SUNAT</span>
            <AppBadge v-if="retencion.nombre_estado_sunat" size="sm" :color="retencion.nombre_estado_sunat === 'ACEPTADO' ? 'success' : retencion.nombre_estado_sunat === 'RECHAZADO' ? 'error' : 'warning'">
              {{ retencion.nombre_estado_sunat }}
            </AppBadge>
            <span v-else class="text-xs text-gray-400">Sin emitir</span>
          </div>
        </div>
        <div v-if="retencion.observacion" class="mt-3">
          <span class="text-xs text-gray-500">Observaciones</span>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ retencion.observacion }}</p>
        </div>
      </div>

      <!-- Detalle -->
      <div v-if="retencion.detalles?.length" class="rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <div class="border-b border-gray-100 bg-gray-50/75 px-6 py-3 dark:border-gray-800">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Documentos asociados</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">Tipo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">Número</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">Fecha</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500">Total</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500">Retenido</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="d in retencion.detalles" :key="d.id">
                <td class="px-4 py-3 text-sm text-gray-700">{{ d.tipo_doc }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ d.num_doc }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ formatFecha(d.fecha_emision) }}</td>
                <td class="px-4 py-3 text-sm text-right text-gray-700">{{ formatMoney(d.imp_total) }}</td>
                <td class="px-4 py-3 text-sm text-right text-gray-700">{{ formatMoney(d.imp_retenido) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { retencionesService } from '../services/retenciones.service'
import type { Retencion } from '../interfaces/retencion.interface'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { AppBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { toastSuccess, toastApiError } from '@/shared/composables/useToast'

const route = useRoute()

const retencion = ref<Retencion | null>(null)
const cargando = ref(true)
const emitiendo = ref(false)
const descargandoPdfXml = ref(false)

const breadcrumb = [
  { label: 'Inicio', to: '/' },
  { label: 'Compras', to: '/compras' },
  { label: 'Retenciones', to: '/compras/retenciones' },
  { label: 'Detalle' },
]

async function cargar() {
  cargando.value = true
  try {
    const resp = await retencionesService.obtenerPorId(Number(route.params.id))
    retencion.value = resp.registro
  } catch {
    retencion.value = null
  } finally {
    cargando.value = false
  }
}

async function onEmitir() {
  if (!retencion.value) return
  emitiendo.value = true
  try {
    await retencionesService.emitir(retencion.value.id)
    toastSuccess('Retención emitida a SUNAT')
    await cargar()
  } catch (error) {
    toastApiError(error)
  } finally {
    emitiendo.value = false
  }
}

async function onVerPdfOficial() {
  if (!retencion.value) return
  descargandoPdfXml.value = true
  try {
    const blob = await retencionesService.obtenerPdfOficial(retencion.value.id)
    window.open(URL.createObjectURL(blob), '_blank')
  } catch (error) {
    toastApiError(error, 'No se pudo obtener el PDF oficial')
  } finally {
    descargandoPdfXml.value = false
  }
}

async function onDescargarXmlOficial() {
  if (!retencion.value) return
  descargandoPdfXml.value = true
  try {
    const blob = await retencionesService.obtenerXmlOficial(retencion.value.id)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `RETENCION-${retencion.value.serie}-${retencion.value.numero}.xml`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (error) {
    toastApiError(error, 'No se pudo obtener el XML')
  } finally {
    descargandoPdfXml.value = false
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

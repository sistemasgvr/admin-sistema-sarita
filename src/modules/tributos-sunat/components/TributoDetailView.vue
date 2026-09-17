<template>
  <div>
    <PageBreadcrumb :page-title="config.singular" :items="breadcrumbItems" />

    <div v-if="query.isLoading.value" class="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.02]">
      Cargando...
    </div>

    <div v-else-if="registro" class="space-y-5">
      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ config.singular }} {{ registro.serie }}-{{ registro.numero }}
              </h1>
              <TributoEstadoBadge :estado="registro.nombre_estado_sunat" />
            </div>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Emitida el {{ formatFecha(registro.fecha_emision) }} · Régimen {{ registro.regimen }} · Tasa {{ Number(registro.tasa) }}%
            </p>
          </div>

          <!--
            Percepción y retención responden en el mismo envío (sin ticket): el
            estado sale del CDR. Aceptada = documentos oficiales; cualquier otro
            estado permite (re)emitir.
          -->
          <div class="flex flex-wrap gap-2">
            <template v-if="aceptada">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-70 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                :disabled="descargando"
                @click="onVerPdf"
              >
                <AppIcon :name="ICONS.download" :size="14" />
                {{ descargando ? 'Obteniendo...' : 'Ver PDF oficial' }}
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                :disabled="descargando"
                @click="onDescargarXml"
              >
                <AppIcon :name="ICONS.download" :size="14" />
                XML firmado
              </button>
            </template>
            <button
              v-else-if="canEmitir"
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-70"
              :disabled="emitirMutation.isPending.value"
              @click="emitirConfirmOpen = true"
            >
              <AppIcon :name="ICONS.upload" :size="14" />
              {{ registro.nombre_estado_sunat === 'RECHAZADO' ? 'Reintentar emisión' : 'Emitir a SUNAT' }}
            </button>
          </div>
        </div>

        <dl class="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt class="text-xs text-gray-500">{{ config.contraparte }}</dt>
            <dd class="font-medium text-gray-800 dark:text-white/90">{{ registro[config.campos.nombreContraparte] ?? '—' }}</dd>
            <dd class="text-xs text-gray-500">{{ registro[config.campos.documentoContraparte] ?? '' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">Base imponible</dt>
            <dd class="font-medium tabular-nums text-gray-800 dark:text-white/90">{{ formatMoney(registro.base_imponible) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">{{ config.singular }}</dt>
            <dd class="font-medium tabular-nums text-gray-800 dark:text-white/90">{{ formatMoney(registro[config.campos.montoTributo]) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-gray-500">{{ config.tipo === 'percepcion' ? 'Total cobrado' : 'Neto pagado' }}</dt>
            <dd class="font-medium tabular-nums text-gray-800 dark:text-white/90">{{ formatMoney(registro[config.campos.montoNeto]) }}</dd>
          </div>
          <div v-if="registro.observacion" class="sm:col-span-2 lg:col-span-4">
            <dt class="text-xs text-gray-500">Observaciones</dt>
            <dd class="text-gray-700 dark:text-gray-300">{{ registro.observacion }}</dd>
          </div>
        </dl>
      </div>

      <AppTable :columns="detalleColumns" :rows="registro.detalles" row-key="id" :show-actions="false" :empty-text="`Sin ${config.origenPlural} asociados.`">
        <template #cell-num_doc="{ row }">
          <p class="font-medium text-gray-800 dark:text-white/90">{{ row.num_doc }}</p>
          <p class="text-xs text-gray-500">Tipo {{ row.tipo_doc }} · {{ formatFecha(row.fecha_emision) }}</p>
        </template>
        <template #cell-fecha_operacion="{ row }">{{ formatFecha(row[config.campos.detalleFecha]) }}</template>
        <template #cell-imp_total="{ value }"><span class="tabular-nums">{{ formatMoney(Number(value)) }}</span></template>
        <template #cell-tributo="{ row }"><span class="tabular-nums">{{ formatMoney(row[config.campos.detalleTributo]) }}</span></template>
        <template #cell-neto="{ row }"><span class="tabular-nums">{{ formatMoney(row[config.campos.detalleNeto]) }}</span></template>
      </AppTable>
    </div>

    <AppConfirmDialog
      v-model="emitirConfirmOpen"
      :title="`Emitir ${config.singular.toLowerCase()} a SUNAT`"
      variant="info"
      confirm-label="Emitir"
      loading-label="Emitiendo..."
      :loading="emitirMutation.isPending.value"
      @confirm="onEmitir"
    >
      <span class="block">
        Se enviará <strong>{{ registro?.serie }}-{{ registro?.numero }}</strong> por
        {{ formatMoney(registro?.[config.campos.montoTributo]) }} de {{ config.singular.toLowerCase() }} sobre
        {{ registro?.detalles.length ?? 0 }} {{ config.origenPlural }}.
      </span>
      <span class="mt-2 block text-xs text-gray-500">
        La aceptación depende del CDR de SUNAT; en el entorno de pruebas del PSE no tiene valor fiscal.
      </span>
    </AppConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppConfirmDialog, AppTable } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { toastApiError } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import type { TableColumn } from '@/shared/interfaces/table.interface'
import { TRIBUTOS_CONFIG } from '../config/tributos.config'
import { useTributoQuery } from '../composables/useTributosQuery'
import { useEmitirTributoMutation } from '../composables/useTributoMutations'
import { createTributoService } from '../services/tributos.service'
import type { TipoTributo, TributoDetalle } from '../interfaces/tributo.interface'
import { formatFecha, formatMoney } from '../utils/formato'
import TributoEstadoBadge from './TributoEstadoBadge.vue'

const props = defineProps<{ tipo: TipoTributo }>()
const config = computed(() => TRIBUTOS_CONFIG[props.tipo])

const route = useRoute()
const authStore = useAuthStore()
const service = createTributoService(props.tipo)

const id = computed(() => {
  const raw = route.params.id
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(n) && n > 0 ? n : null
})
const query = useTributoQuery(props.tipo, id)
const registro = computed(() => query.data.value ?? null)

const aceptada = computed(() => registro.value?.nombre_estado_sunat === 'ACEPTADO')
const canEmitir = computed(() => authStore.hasPermission(config.value.permisos.emitir))

const breadcrumbItems = computed(() => [
  config.value.breadcrumbPadre,
  { label: config.value.plural, to: config.value.paths.lista },
  { label: registro.value ? `${registro.value.serie}-${registro.value.numero}` : 'Detalle' },
])

const detalleColumns = computed<TableColumn<TributoDetalle>[]>(() => [
  { key: 'num_doc', label: config.value.origenSingular, mobile: 'primary' },
  { key: 'fecha_operacion', label: `Fecha de ${config.value.operacion}` },
  { key: 'imp_total', label: 'Total', align: 'right' },
  { key: 'tributo', label: config.value.singular, align: 'right' },
  { key: 'neto', label: config.value.tipo === 'percepcion' ? 'A cobrar' : 'A pagar', align: 'right' },
])

// ---- Emisión ----
const emitirMutation = useEmitirTributoMutation(props.tipo)
const emitirConfirmOpen = ref(false)
async function onEmitir() {
  if (!id.value) return
  try {
    await emitirMutation.mutateAsync(id.value)
    emitirConfirmOpen.value = false
  } catch {
    // toast en la mutation; el diálogo queda abierto para reintentar
  }
}

// ---- Documentos oficiales (solo aceptadas) ----
const descargando = ref(false)
async function onVerPdf() {
  if (!id.value) return
  descargando.value = true
  try {
    const blob = await service.obtenerPdfOficial(id.value)
    window.open(URL.createObjectURL(blob), '_blank')
  } catch (error) {
    toastApiError(error, 'No se pudo obtener el PDF oficial')
  } finally {
    descargando.value = false
  }
}
async function onDescargarXml() {
  if (!id.value || !registro.value) return
  descargando.value = true
  try {
    const blob = await service.obtenerXmlOficial(id.value)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${config.value.singular.toUpperCase()}-${registro.value.serie}-${registro.value.numero}.xml`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (error) {
    toastApiError(error, 'No se pudo obtener el XML')
  } finally {
    descargando.value = false
  }
}
</script>

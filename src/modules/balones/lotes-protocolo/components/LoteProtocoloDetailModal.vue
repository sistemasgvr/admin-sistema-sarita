<template>
  <AppModal
    v-model="open"
    :title="`Lote ${lote?.numero_lote ?? ''}`"
    :subtitle="subtitulo"
    size="xl"
  >
    <div v-if="isLoading" class="py-10 text-center text-sm text-gray-500">
      Cargando ficha...
    </div>

    <div v-else-if="!lote" class="py-10 text-center text-sm text-gray-500">
      No se pudo cargar la ficha.
    </div>

    <div v-else class="space-y-5">
      <div
        v-if="lote.vencido"
        class="rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
      >
        Lote vencido en {{ fechaAMesAnio(lote.fecha_vencimiento) }}.
      </div>

      <DetailSectionCard title="Cabecera" :icon="ICONS.fileText" :items="itemsCabecera" />

      <DetailSectionCard title="Cilindro muestreado" :icon="ICONS.cylinder" :items="itemsMuestreo" />

      <section>
        <h4 class="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">
          Datos de análisis
        </h4>
        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
              <tr>
                <th class="px-3 py-2 font-medium">Prueba</th>
                <th class="px-3 py-2 font-medium">Especificación</th>
                <th class="px-3 py-2 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="prueba in lote.pruebas ?? []" :key="prueba.id ?? prueba.prueba">
                <td class="px-3 py-2 font-medium text-gray-800 dark:text-white/90">
                  {{ prueba.prueba }}
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  {{ prueba.especificacion || '—' }}
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  {{ prueba.resultado || '—' }}
                </td>
              </tr>
              <tr v-if="(lote.pruebas ?? []).length === 0">
                <td colspan="3" class="px-3 py-4 text-center text-gray-400">
                  Sin datos de análisis registrados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-sm font-medium text-gray-800 dark:text-white/90">
            Envases aprobados
          </h4>
          <div class="flex items-center gap-2">
            <AppBadge size="sm" variant="light" color="neutral">
              {{ envases.length }} en la ficha
            </AppBadge>
            <AppBadge size="sm" variant="light" color="primary">
              {{ envasesVinculados }} en el sistema
            </AppBadge>
            <button
              v-if="canAplicar && envasesVinculados > 0"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              :disabled="aplicarMutation.isPending.value"
              @click="aplicarAEnvases"
            >
              <AppIcon :name="ICONS.clipboardCheck" :size="14" />
              {{
                aplicarMutation.isPending.value
                  ? 'Aplicando...'
                  : 'Marcar como ficha vigente'
              }}
            </button>
          </div>
        </div>

        <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
          Las series sin cilindro son envases que la planta incluyó en el lote pero que no
          están registrados aquí.
        </p>

        <div class="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <ul class="divide-y divide-gray-200 dark:divide-gray-700">
            <li
              v-for="envase in envases"
              :key="envase.id ?? envase.serie_envase"
              class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <span class="font-mono text-gray-800 dark:text-white/90">
                {{ envase.serie_envase }}
              </span>
              <span class="flex items-center gap-2">
                <template v-if="envase.id_balon">
                  <span class="text-gray-600 dark:text-gray-400">
                    {{ envase.codigo_balon }}
                  </span>
                  <AppBadge
                    v-if="envase.es_lote_vigente"
                    size="sm"
                    variant="light"
                    color="success"
                  >
                    Ficha vigente
                  </AppBadge>
                </template>
                <span v-else class="text-xs text-gray-400">No registrado</span>
              </span>
            </li>
            <li v-if="envases.length === 0" class="px-3 py-4 text-center text-sm text-gray-400">
              Sin envases en la relación.
            </li>
          </ul>
        </div>
      </section>

      <div v-if="lote.ruta_archivo_pdf" class="flex justify-start">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          :disabled="abriendoPdf"
          @click="abrirPdf"
        >
          <AppIcon :name="ICONS.fileText" :size="16" />
          {{ abriendoPdf ? 'Abriendo...' : 'Ver PDF de la ficha' }}
        </button>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { fechaAMesAnio } from '@/modules/balones/lotes-protocolo/constants/icpFicha'
import { useAplicarLoteProtocoloMutation } from '@/modules/balones/lotes-protocolo/composables/useLoteProtocoloMutations'
import { useLoteProtocoloQuery } from '@/modules/balones/lotes-protocolo/composables/useLotesProtocoloQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppModal } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import type { DetailSectionItem } from '@/shared/components/detail/detail.types'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { toastApiError } from '@/shared/composables/useToast'
import { storageService } from '@/shared/services/storage.service'

const props = defineProps<{ loteId: number | null }>()

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const loteQuery = useLoteProtocoloQuery(toRef(props, 'loteId'))
const aplicarMutation = useAplicarLoteProtocoloMutation()

const abriendoPdf = ref(false)

const lote = computed(() => loteQuery.data.value ?? null)
const isLoading = computed(() => loteQuery.isFetching.value)
const envases = computed(() => lote.value?.envases ?? [])
const envasesVinculados = computed(
  () => envases.value.filter((envase) => envase.id_balon != null).length,
)

const canAplicar = computed(() =>
  authStore.hasPermission(PermisoBanderas.LOTES_PROTOCOLO_EDITAR),
)

const subtitulo = computed(() => {
  if (!lote.value) return undefined
  const partes = [
    lote.value.numero_protocolo ? `Protocolo ${lote.value.numero_protocolo}` : null,
    lote.value.nombre_proveedor,
    lote.value.codigo_documento
      ? `${lote.value.codigo_documento} v${lote.value.version_documento ?? ''}`.trim()
      : null,
  ].filter(Boolean)
  return partes.join(' · ') || undefined
})

const texto = (valor: unknown) => {
  if (valor === null || valor === undefined || valor === '') return '—'
  return String(valor)
}

const itemsCabecera = computed<DetailSectionItem[]>(() => {
  const l = lote.value
  if (!l) return []
  return [
    { label: 'N° de lote', value: texto(l.numero_lote) },
    { label: 'N° protocolo', value: texto(l.numero_protocolo) },
    { label: 'Proveedor / planta', value: texto(l.nombre_proveedor) },
    { label: 'Producto', value: texto(l.descripcion_producto), fullWidth: true },
    { label: 'Forma farmacéutica', value: texto(l.forma_farmaceutica) },
    { label: 'Presentación', value: texto(l.presentacion) },
    { label: 'Norma técnica', value: texto(l.norma_tecnica) },
    { label: 'Método de fabricación', value: texto(l.metodo_fabricacion) },
    { label: 'Tamaño del lote', value: l.tamano_lote_m3 ? `${l.tamano_lote_m3} m³` : '—' },
    { label: 'Cantidad de envases', value: texto(l.cantidad_envases) },
    { label: 'Fecha de análisis', value: texto(l.fecha_analisis) },
    { label: 'Fecha de emisión', value: texto(l.fecha_emision) },
    { label: 'Fecha de fabricación', value: texto(l.fecha_fabricacion) },
    { label: 'Vencimiento', value: fechaAMesAnio(l.fecha_vencimiento) || '—' },
    { label: 'Analista', value: texto(l.analista) },
    { label: 'Conclusión', value: texto(l.conclusion), fullWidth: true },
  ]
})

const itemsMuestreo = computed<DetailSectionItem[]>(() => {
  const l = lote.value
  if (!l) return []
  return [
    { label: 'Serie', value: texto(l.cilindro_muestreado_serie) },
    {
      label: 'Temperatura',
      value: l.temperatura_muestreo_c != null ? `${l.temperatura_muestreo_c} °C` : '—',
    },
    {
      label: 'Presión',
      value: l.presion_muestreo_psi != null ? `${l.presion_muestreo_psi} PSI` : '—',
    },
    {
      label: 'Valoración O₂',
      value: l.valoracion_o2_pct != null ? `${l.valoracion_o2_pct}%` : '—',
    },
  ]
})

const aplicarAEnvases = async () => {
  const currentUserId = authStore.user?.id
  if (!lote.value || !currentUserId) return

  try {
    await aplicarMutation.mutateAsync({
      id: lote.value.id,
      // Sin idBalones el backend aplica a los envases ya emparejados por serie.
      payload: { idUsuarioAuditoria: currentUserId },
    })
  } catch {
    // toast en mutation
  }
}

const abrirPdf = async () => {
  const ruta = lote.value?.ruta_archivo_pdf
  if (!ruta) return

  abriendoPdf.value = true
  try {
    const { signedUrl } = await storageService.firmarUrl(ruta)
    window.open(signedUrl, '_blank', 'noopener')
  } catch (error) {
    toastApiError(error, 'No se pudo abrir el PDF de la ficha')
  } finally {
    abriendoPdf.value = false
  }
}
</script>

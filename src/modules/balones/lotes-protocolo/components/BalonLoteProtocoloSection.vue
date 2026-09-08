<template>
  <!--
    Solo los cilindros con ficha (hoy, oxígeno medicinal) tienen algo que mostrar
    acá. En el resto la card sería una fila vacía en cada detalle de cilindro.
  -->
  <DetailSectionCard
    v-if="tieneFicha"
    title="Lote y protocolo"
    :icon="ICONS.clipboardCheck"
    full-width
  >
    <div v-if="isLoading" class="py-4 text-sm text-gray-500">Cargando historial...</div>

    <div v-else class="space-y-4">
      <!-- Ficha vigente -->
      <div
        v-if="vigente"
        class="rounded-lg border px-3 py-3"
        :class="
          vigente.vencido
            ? 'border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10'
            : 'border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10'
        "
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Ficha vigente
            </p>
            <p class="font-medium text-gray-800 dark:text-white/90">
              Lote {{ vigente.numero_lote }}
              <span v-if="vigente.numero_protocolo" class="text-gray-500">
                · Protocolo {{ vigente.numero_protocolo }}
              </span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <AppBadge
              v-if="vigente.valoracion_o2_pct != null"
              size="sm"
              variant="light"
              color="primary"
            >
              O₂ {{ vigente.valoracion_o2_pct }}%
            </AppBadge>
            <AppBadge
              size="sm"
              variant="light"
              :color="vigente.vencido ? 'error' : 'success'"
            >
              {{
                vigente.fecha_vencimiento
                  ? `${vigente.vencido ? 'Venció' : 'Vence'} ${fechaAMesAnio(vigente.fecha_vencimiento)}`
                  : 'Sin vencimiento'
              }}
            </AppBadge>
            <button
              type="button"
              title="Ver detalle del protocolo"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
              @click="verFicha(vigente.id)"
            >
              <AppIcon :name="ICONS.eye" :size="15" />
            </button>
          </div>
        </div>
      </div>


      <!-- Historial por recarga -->
      <div v-if="historial.length > 0">
        <h5 class="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">
          Historial de recargas con ficha
        </h5>
        <ol class="space-y-2">
          <li
            v-for="item in historial"
            :key="`${item.origen}-${item.id_documento}`"
            class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
          >
            <div class="flex flex-col">
              <span class="font-medium text-gray-800 dark:text-white/90">
                Lote {{ item.numero_lote }}
                <span v-if="item.numero_protocolo" class="text-gray-500">
                  · Protocolo {{ item.numero_protocolo }}
                </span>
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ item.fecha ?? 'Sin fecha' }} ·
                {{ etiquetaOrigen(item.origen) }}
                <template v-if="item.numero_documento"> {{ item.numero_documento }}</template>
                <template v-if="item.nombre_proveedor">
                  · {{ item.nombre_proveedor }}
                </template>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <AppBadge v-if="item.es_vigente" size="sm" variant="light" color="success">
                Vigente
              </AppBadge>
              <AppBadge v-if="item.vencido" size="sm" variant="light" color="error">
                Vencido
              </AppBadge>
              <button
                type="button"
                title="Ver ficha"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="verFicha(item.id_lote_protocolo)"
              >
                <AppIcon :name="ICONS.eye" :size="15" />
              </button>
            </div>
          </li>
        </ol>
      </div>

      <p v-else class="text-sm text-gray-500 dark:text-gray-400">
        La ficha está asignada, pero todavía no hay recargas registradas con ella.
      </p>
    </div>

    <LoteProtocoloDetailModal v-model="detailModalOpen" :lote-id="loteToViewId" />
  </DetailSectionCard>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import LoteProtocoloDetailModal from '@/modules/balones/lotes-protocolo/components/LoteProtocoloDetailModal.vue'
import { fechaAMesAnio } from '@/modules/balones/lotes-protocolo/constants/icpFicha'
import { useLoteProtocoloHistorialQuery } from '@/modules/balones/lotes-protocolo/composables/useLotesProtocoloQuery'
import type { LoteProtocoloVigente } from '@/modules/balones/lotes-protocolo/interfaces/lote-protocolo.interface'
import { AppBadge } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{ idBalon: number | null }>()

const historialQuery = useLoteProtocoloHistorialQuery(toRef(props, 'idBalon'))

const detailModalOpen = ref(false)
const loteToViewId = ref<number | null>(null)

const isLoading = computed(() => historialQuery.isFetching.value)
const historial = computed(() => historialQuery.data.value?.data ?? [])

// La ficha vigente no es una fila del historial: un cilindro puede tenerla
// asignada desde el ingreso por compra, sin ninguna recarga todavía.
const vigente = computed(
  () =>
    (historialQuery.data.value?.meta?.resumen?.vigente as LoteProtocoloVigente | null) ??
    null,
)

const tieneFicha = computed(
  () => vigente.value != null || historial.value.length > 0 || isLoading.value,
)

const etiquetaOrigen = (origen: string) =>
  origen === 'PLANTA_EXTERNA' ? 'Recarga en planta' : 'Movimiento de recarga'

const verFicha = (id: number) => {
  loteToViewId.value = id
  detailModalOpen.value = true
}
</script>

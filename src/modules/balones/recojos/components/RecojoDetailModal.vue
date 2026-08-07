<template>
  <AppModal
    v-model="open"
    title="Detalle de recojo"
    :subtitle="recojo?.nombre_cliente || undefined"
    size="lg"
  >
    <div v-if="query.isFetching.value" class="py-8 text-center text-sm text-gray-500">
      Cargando...
    </div>
    <div v-else-if="recojo" class="space-y-4">
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
        <div>
          <dt class="text-gray-500 dark:text-gray-400">Cliente</dt>
          <dd class="font-medium text-gray-800 dark:text-white/90">
            {{ recojo.nombre_cliente || '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500 dark:text-gray-400">Estado</dt>
          <dd><ListaOpcionBadge :value="recojo.nombre_estado" /></dd>
        </div>
        <div>
          <dt class="text-gray-500 dark:text-gray-400">Programado</dt>
          <dd class="text-gray-800 dark:text-white/90">
            {{ recojo.fecha_programada?.slice(0, 10) || '—' }}
            <span v-if="recojo.hora_estimada" class="text-gray-500">
              · {{ String(recojo.hora_estimada).slice(0, 5) }}
            </span>
          </dd>
        </div>
        <div>
          <dt class="text-gray-500 dark:text-gray-400">Visita real</dt>
          <dd class="text-gray-800 dark:text-white/90">
            {{ recojo.fecha_visita?.slice(0, 10) || '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500 dark:text-gray-400">Préstamo</dt>
          <dd class="text-gray-800 dark:text-white/90">
            {{ recojo.numero_prestamo || (recojo.id_prestamo ? `#${recojo.id_prestamo}` : '—') }}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500 dark:text-gray-400">Motivo fallo</dt>
          <dd class="text-gray-800 dark:text-white/90">
            {{ recojo.nombre_motivo_fallo || '—' }}
          </dd>
        </div>
      </dl>

      <p v-if="recojo.observacion" class="text-sm text-gray-600 dark:text-gray-400">
        {{ recojo.observacion }}
      </p>

      <div>
        <p class="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">Cilindros</p>
        <ul class="space-y-2">
          <li
            v-for="d in recojo.detalles ?? []"
            :key="d.id"
            class="rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-medium text-gray-800 dark:text-white/90">
                {{ d.codigo_balon || (d.id_balon ? `#${d.id_balon}` : `Detalle #${d.id}`) }}
              </span>
              <ListaOpcionBadge v-if="d.nombre_resultado" :value="d.nombre_resultado" />
              <span v-else class="text-xs text-gray-500">Pendiente de resultado</span>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ d.numero_prestamo || '—' }}
              <template v-if="d.nombre_estado_contenido">
                · Contenido {{ d.nombre_estado_contenido }}
              </template>
              <template v-if="d.nueva_fecha_retorno">
                · Nueva fecha {{ d.nueva_fecha_retorno.slice(0, 10) }}
              </template>
            </p>
            <p v-if="d.observacion" class="mt-1 text-xs text-gray-500">{{ d.observacion }}</p>
          </li>
        </ul>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        @click="open = false"
      >
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRecojoQuery } from '@/modules/balones/recojos/composables/useRecojosQuery'
import { AppModal, ListaOpcionBadge } from '@/shared/components'

const props = defineProps<{
  recojoId?: number | null
}>()

const open = defineModel<boolean>({ default: false })
const idRef = computed(() => (open.value ? props.recojoId : null))
const query = useRecojoQuery(idRef)
const recojo = computed(() => query.data.value ?? null)
</script>

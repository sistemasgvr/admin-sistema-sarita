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
      <div
        v-if="puedeIniciarRuta"
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/70 px-3 py-2.5 dark:border-brand-500/30 dark:bg-brand-500/10"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Ubicación del cliente</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ recojo.direccion || 'Coordenadas disponibles' }}
          </p>
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          @click="iniciarRuta"
        >
          <AppIcon :name="ICONS.mapPin" :size="15" />
          Iniciar ruta
        </button>
      </div>

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
        <div v-if="recojo.id_prestamo">
          <dt class="text-gray-500 dark:text-gray-400">Préstamo</dt>
          <dd class="text-gray-800 dark:text-white/90">
            {{ recojo.numero_prestamo || `#${recojo.id_prestamo}` }}
          </dd>
        </div>
        <div v-if="recojo.id_alquiler">
          <dt class="text-gray-500 dark:text-gray-400">Alquiler</dt>
          <dd class="text-gray-800 dark:text-white/90">
            {{ recojo.numero_alquiler || `#${recojo.id_alquiler}` }}
          </dd>
        </div>
        <div v-if="recojo.nombre_motivo_fallo">
          <dt class="text-gray-500 dark:text-gray-400">Motivo fallo</dt>
          <dd class="text-gray-800 dark:text-white/90">
            {{ recojo.nombre_motivo_fallo }}
          </dd>
        </div>
      </dl>

      <p v-if="recojo.observacion" class="text-sm text-gray-600 dark:text-gray-400">
        {{ recojo.observacion }}
      </p>

      <div>
        <div v-if="recojo.tiene_regulador || recojo.es_solo_regulador" class="mb-4 space-y-2">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Regulador / accesorio</p>
          <div class="rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-medium text-gray-800 dark:text-white/90">
                {{
                  [recojo.codigo_producto_alquiler, recojo.nombre_producto_alquiler]
                    .filter(Boolean)
                    .join(' — ') || 'Regulador / accesorio'
                }}
              </p>
              <ListaOpcionBadge
                v-if="recojo.nombre_resultado_regulador"
                :value="recojo.nombre_resultado_regulador"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ recojo.numero_alquiler || (recojo.id_alquiler ? `#${recojo.id_alquiler}` : 'Alquiler') }}
              <template v-if="recojo.nombre_condicion_regulador">
                · {{ recojo.nombre_condicion_regulador === 'PARA_REPARAR' ? 'Para reparar' : 'Bueno' }}
              </template>
              <template v-if="recojo.observacion_regulador">
                · {{ recojo.observacion_regulador }}
              </template>
            </p>
          </div>
        </div>

        <p class="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">Cilindros</p>
        <p
          v-if="(recojo.detalles ?? []).length === 0"
          class="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          Sin cilindros en este recojo.
        </p>
        <ul v-else class="space-y-2">
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
              {{ d.numero_origen || d.numero_prestamo || d.numero_alquiler || '—' }}
              <template v-if="d.nombre_estado_contenido">
                · Contenido {{ d.nombre_estado_contenido }}
              </template>
              <template v-if="d.cantidad_restante != null && d.cantidad_restante !== ''">
                · Restante {{ d.cantidad_restante }}{{ d.nombre_unidad_medida ? ` ${d.nombre_unidad_medida}` : '' }}
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
import { useUpdateRecojoMutation } from '@/modules/balones/recojos/composables/useRecojoMutations'
import { useRecojoQuery } from '@/modules/balones/recojos/composables/useRecojosQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppModal, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import {
  abrirRutaGoogleMaps,
  clienteTieneCoordenadas,
} from '@/shared/utils/googleMapsRuta'

const props = defineProps<{
  recojoId?: number | null
}>()

const open = defineModel<boolean>({ default: false })
const authStore = useAuthStore()
const updateMutation = useUpdateRecojoMutation()
const idRef = computed(() => (open.value ? props.recojoId : null))
const query = useRecojoQuery(idRef)
const recojo = computed(() => query.data.value ?? null)
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.RECOJOS_BALON_EDITAR))

const puedeIniciarRuta = computed(() =>
  clienteTieneCoordenadas(recojo.value?.latitud, recojo.value?.longitud),
)

async function iniciarRuta() {
  const lat = Number(recojo.value?.latitud)
  const lng = Number(recojo.value?.longitud)
  if (!clienteTieneCoordenadas(lat, lng)) return
  abrirRutaGoogleMaps(lat, lng)
  const userId = authStore.user?.id
  if (
    canEdit.value &&
    userId &&
    recojo.value &&
    (recojo.value.nombre_estado ?? '').toUpperCase() === 'PROGRAMADO'
  ) {
    await updateMutation.mutateAsync({
      id: recojo.value.id,
      payload: { idUsuarioAuditoria: userId, estadoNombre: 'EN_RUTA' },
    })
  }
}
</script>

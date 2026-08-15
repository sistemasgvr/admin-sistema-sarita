<template>
  <div>
    <div v-if="loading" class="space-y-2">
      <div class="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
      <div
        v-for="n in 4"
        :key="`sk-${n}`"
        class="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"
      />
    </div>

    <div
      v-else-if="!ranked.length"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-gray-500 dark:border-gray-800 dark:text-gray-400"
    >
      <AppIcon :name="ICONS.trophy" :size="28" class="mb-2 text-gray-400" />
      <p class="text-sm">No hay colaboradores para mostrar.</p>
    </div>

    <div
      v-else
      class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div
        class="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800"
      >
        <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Ranking</p>
        <div class="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>
            <span class="font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ totalActividades }}</span>
            actividades
          </span>
          <span>
            <span class="font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ ranked.length }}</span>
            colaboradores
          </span>
          <span v-if="lider" class="truncate">
            Líder
            <span class="font-semibold text-gray-800 dark:text-white/90">{{ lider.nombre }}</span>
          </span>
        </div>
      </div>

      <ol class="divide-y divide-gray-100 dark:divide-gray-800">
        <li v-for="item in ranked" :key="item.key">
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.04]"
            :class="filaClass(item)"
            @click="abrirDetalle(item)"
          >
            <span
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              :class="puestoBadgeClass(item.puesto)"
            >
              <AppIcon v-if="item.puesto === 1" :name="ICONS.trophy" :size="14" />
              <template v-else>{{ item.puesto }}</template>
            </span>

            <span
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              :class="avatarClass(item)"
            >
              {{ iniciales(item.nombre) }}
            </span>

            <div class="min-w-0 flex-1">
              <div class="mb-1 flex items-center gap-2">
                <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ item.nombre }}
                </p>
                <AppBadge
                  v-if="esYo(item)"
                  color="success"
                  size="sm"
                >
                  Tú
                </AppBadge>
                <AppBadge :color="item.tipo === 'Chofer' ? 'warning' : 'primary'" size="sm">
                  {{ item.tipo }}
                </AppBadge>
              </div>
              <div class="flex items-center gap-3">
                <div class="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    :class="item.puesto === 1 ? 'bg-brand-500' : 'bg-brand-400/80 dark:bg-brand-400'"
                    :style="{ width: `${porcentaje(item.cantidad)}%` }"
                  />
                </div>
                <span class="w-10 shrink-0 text-right text-[11px] tabular-nums text-gray-400">
                  {{ porcentaje(item.cantidad) }}%
                </span>
              </div>
            </div>

            <div class="shrink-0 text-right">
              <p class="text-lg font-bold tabular-nums leading-none text-gray-900 dark:text-white">
                {{ item.cantidad }}
              </p>
              <p class="mt-0.5 text-[11px] text-gray-400">
                {{ formatListDate(item.ultimaFecha ?? undefined) }}
              </p>
            </div>
            <AppIcon :name="ICONS.chevronRight" :size="16" class="shrink-0 text-gray-300 dark:text-gray-600" />
          </button>
        </li>
      </ol>
    </div>

    <AppModal
      v-model="detalleOpen"
      :title="colaboradorActivo?.nombre ?? 'Actividades'"
      :subtitle="subtituloDetalle"
      size="lg"
    >
      <div v-if="!actividadesDetalle.length" class="py-8 text-center text-sm text-gray-500">
        No hay actividades.
      </div>
      <div v-else class="space-y-2">
        <button
          v-for="actividad in actividadesDetalle"
          :key="actividad.id"
          type="button"
          class="flex w-full items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-left transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/30"
          @click="emit('ver-actividad', actividad)"
        >
          <span
            class="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
          >
            <AppIcon :name="ICONS.clipboardCheck" :size="16" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-gray-800 dark:text-white/90">
              {{ actividad.titulo }}
            </p>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ actividad.razon_social_cliente ?? 'Sin cliente' }}
              · {{ formatListDate(actividad.fecha_programada) }}
              · {{ formatHoraRango(actividad.hora_inicio_estimada, actividad.hora_fin_estimada) }}
            </p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <ListaOpcionBadge
                v-if="actividad.nombre_tipo_actividad"
                :value="actividad.nombre_tipo_actividad"
              />
              <ListaOpcionBadge
                v-if="actividad.nombre_estado_actividad"
                :value="actividad.nombre_estado_actividad"
              />
            </div>
          </div>
          <AppIcon :name="ICONS.chevronRight" :size="16" class="mt-1 shrink-0 text-gray-400" />
        </button>
      </div>
      <template #footer>
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
          @click="detalleOpen = false"
        >
          Cerrar
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { Actividad } from '@/modules/operativa/actividades/interfaces/actividad.interface'
import type { ActividadColaboradorRanking } from '@/modules/operativa/actividades/utils/agruparActividadesPorColaborador'
import {
  AppBadge,
  AppModal,
  ListaOpcionBadge,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { formatListDate } from '@/shared/utils/date'

const props = defineProps<{
  rows: ActividadColaboradorRanking[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'ver-actividad': [actividad: Actividad]
}>()

const authStore = useAuthStore()
const detalleOpen = ref(false)
const colaboradorActivo = ref<ActividadColaboradorRanking | null>(null)

const ranked = computed(() =>
  props.rows.map((row, index) => ({ ...row, puesto: index + 1 })),
)

const maxCantidad = computed(() =>
  Math.max(0, ...props.rows.map((row) => row.cantidad)),
)

const totalActividades = computed(() =>
  props.rows.reduce((sum, row) => sum + row.cantidad, 0),
)

const lider = computed(() => ranked.value[0] ?? null)

const actividadesDetalle = computed(() => colaboradorActivo.value?.actividades ?? [])

const subtituloDetalle = computed(() => {
  const n = actividadesDetalle.value.length
  if (!n) return colaboradorActivo.value?.tipo
  return `${colaboradorActivo.value?.tipo ?? ''} · ${n} ${n === 1 ? 'actividad' : 'actividades'}`
})

function esYo(item: ActividadColaboradorRanking) {
  const id = authStore.user?.id
  return Boolean(id && item.idUsuario === id)
}

function filaClass(item: ActividadColaboradorRanking & { puesto: number }) {
  if (item.puesto === 1) {
    return 'bg-brand-50/70 dark:bg-brand-500/10'
  }
  if (esYo(item)) {
    return 'bg-success-50/60 dark:bg-success-500/10'
  }
  return ''
}

function abrirDetalle(item: ActividadColaboradorRanking) {
  colaboradorActivo.value = item
  detalleOpen.value = true
}

function formatHoraRango(inicio?: string | null, fin?: string | null) {
  const desde = inicio?.slice(0, 5)
  const hasta = fin?.slice(0, 5)
  if (desde && hasta) return `${desde} - ${hasta}`
  return desde || hasta || '—'
}

function porcentaje(cantidad: number) {
  if (!maxCantidad.value) return 0
  return Math.max(6, Math.round((cantidad / maxCantidad.value) * 100))
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (!partes.length) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase()
}

function puestoBadgeClass(puesto: number) {
  if (puesto === 1) return 'bg-brand-500 text-white'
  if (puesto === 2) return 'bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-900'
  if (puesto === 3) return 'bg-amber-600 text-white'
  return 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
}

function avatarClass(item: ActividadColaboradorRanking & { puesto: number }) {
  if (item.puesto === 1) return 'bg-brand-500 text-white'
  return 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200'
}
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      class="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      @click="toggleDropdown"
    >
      <span
        v-if="tieneNoLeidas"
        class="absolute right-0 top-0.5 z-1 flex h-2 w-2 rounded-full bg-sarita-500"
      >
        <span
          class="absolute inline-flex w-full h-full rounded-full bg-sarita-500 opacity-75 -z-1 animate-ping"
        ></span>
      </span>
      <AppIcon :name="ICONS.bell" :size="20" />
    </button>

    <div
      v-if="dropdownOpen"
      class="absolute -right-[240px] mt-[17px] flex w-[320px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 sm:w-[340px] lg:right-0"
    >
      <div
        class="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100 dark:border-gray-800"
      >
        <div class="min-w-0">
          <h5 class="text-lg font-semibold text-gray-800 dark:text-white/90">Notificaciones</h5>
          <p v-if="tieneNoLeidas" class="text-xs text-gray-500 dark:text-gray-400">
            {{ totalNoLeidas }} sin leer
          </p>
        </div>
        <div class="flex items-center gap-1">
          <button
            v-if="tieneNoLeidas && canMarcarLeida"
            type="button"
            class="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10"
            :disabled="marcarTodasMutation.isPending.value"
            @click="marcarTodas"
          >
            Marcar todas
          </button>
          <button
            type="button"
            class="text-gray-500 dark:text-gray-400"
            @click="closeDropdown"
          >
            <AppIcon :name="ICONS.x" :size="24" />
          </button>
        </div>
      </div>

      <div v-if="!canListar" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No tienes permiso para ver notificaciones
      </div>

      <div
        v-else-if="listQuery.isLoading.value"
        class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        Cargando...
      </div>

      <div
        v-else-if="items.length === 0"
        class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        No hay notificaciones
      </div>

      <ul v-else class="custom-scrollbar max-h-80 space-y-1 overflow-y-auto">
        <li v-for="item in items" :key="item.id">
          <button
            type="button"
            class="flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
            :class="item.leida ? 'opacity-70' : 'bg-brand-50/40 dark:bg-brand-500/5'"
            @click="onSelect(item)"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ item.titulo }}
              </p>
              <span
                v-if="!item.leida"
                class="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500"
              />
            </div>
            <p
              v-if="item.mensaje"
              class="line-clamp-2 text-xs text-gray-500 dark:text-gray-400"
            >
              {{ item.mensaje }}
            </p>
            <p class="text-[11px] text-gray-400 dark:text-gray-500">
              {{ formatFecha(item.fecha_creacion) }}
            </p>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  useMarcarNotificacionLeidaMutation,
  useMarcarTodasNotificacionesLeidasMutation,
} from '@/modules/notificaciones/composables/useNotificacionMutations'
import {
  useNotificacionesContadorQuery,
  useNotificacionesQuery,
} from '@/modules/notificaciones/composables/useNotificacionesQuery'
import { useNotificacionesSocket } from '@/modules/notificaciones/composables/useNotificacionesSocket'
import type { Notificacion } from '@/modules/notificaciones/interfaces/notificacion.interface'
import { resolveNotificacionTarget } from '@/modules/notificaciones/utils/notificacion-navigation'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'

const authStore = useAuthStore()
const router = useRouter()

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const filters = ref({ pagina: 1, limite: 15 })
const listQuery = useNotificacionesQuery(filters)
const contadorQuery = useNotificacionesContadorQuery()
const marcarLeidaMutation = useMarcarNotificacionLeidaMutation()
const marcarTodasMutation = useMarcarTodasNotificacionesLeidasMutation()

useNotificacionesSocket()

const canListar = computed(() =>
  authStore.hasPermission(PermisoBanderas.NOTIFICACIONES_LISTAR),
)
const canMarcarLeida = computed(() =>
  authStore.hasPermission(PermisoBanderas.NOTIFICACIONES_MARCAR_LEIDA),
)

const items = computed(() => listQuery.data.value?.data ?? [])
const totalNoLeidas = computed(() => contadorQuery.data.value?.total ?? 0)
const tieneNoLeidas = computed(() => totalNoLeidas.value > 0)

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    void listQuery.refetch()
    void contadorQuery.refetch()
  }
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

async function marcarTodas() {
  if (!canMarcarLeida.value) return
  await marcarTodasMutation.mutateAsync()
}

async function onSelect(item: Notificacion) {
  if (!item.leida && canMarcarLeida.value) {
    try {
      await marcarLeidaMutation.mutateAsync(item.id)
    } catch {
      // toast en mutation
    }
  }

  closeDropdown()
  const target = resolveNotificacionTarget(item)
  if (target) {
    void router.push(target)
  }
}

function formatFecha(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <AppModal
    v-model="open"
    :title="activo?.descripcion || 'Detalle del activo'"
    :subtitle="activo?.numero_serie || 'Información del activo fijo de la empresa.'"
    size="xl"
    @close="handleClose"
  >
    <div v-if="detailQuery.isFetching.value && !activo" class="flex items-center justify-center gap-2 py-10 text-sm text-gray-500 dark:text-gray-400">
      <AppIcon :name="ICONS.loader" :size="16" class="animate-spin" />
      Cargando...
    </div>

    <div v-else-if="activo" class="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-0">
      
      <div class="flex flex-col lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-6 dark:lg:border-gray-700">
        <div
          class="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200  dark:border-gray-700 dark:bg-gray-900/40"
        >
          <img
            v-if="activo.url_imagen_principal"
            :src="activo.url_imagen_principal"
            alt="Imagen del activo"
            class="h-full w-full object-contain p-4 transition-transform duration-500 hover:scale-105"
          />
          <AppIcon v-else :name="ICONS.image" :size="40" class="text-gray-400" />

          <span
            class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
            {{ activo.estado === 1 ? 'Activo' : 'Inactivo' }}
          </span>

          <button
            v-if="activo.url_imagen_principal"
            type="button"
            class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white/80 text-gray-600 backdrop-blur transition-colors hover:bg-white dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300"
            aria-label="Abrir imagen"
            @click="abrirImagen"
          >
            <AppIcon :name="ICONS.expand" :size="16" />
          </button>
        </div>

        <div class="mt-4 space-y-3">
          <div class="rounded-xl border border-gray-200  p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <p class="mb-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <AppIcon :name="ICONS.banknote" :size="13" class="shrink-0" />
              Valor actual (Importe)
            </p>
            <p class="text-xl font-bold text-gray-800 dark:text-white/90">
              {{ activo.importe != null ? `S/ ${Number(activo.importe).toFixed(2)}` : '—' }}
            </p>
          </div>

          <!-- Responsable + Sucursal -->
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl border border-gray-200  p-3 dark:border-gray-800 dark:bg-white/[0.02]">
              <p class="mb-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <AppIcon :name="ICONS.userCheck" :size="12" class="shrink-0" />
                Responsable
              </p>
              <p class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                >
                  {{ inicialResponsable }}
                </span>
                <span class="truncate">{{ activo.nombre_trabajador_responsable || '—' }}</span>
              </p>
            </div>
            <div class="rounded-xl border border-gray-200 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
              <p class="mb-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <AppIcon :name="ICONS.building2" :size="12" class="shrink-0" />
                Sucursal
              </p>
              <p
                class="truncate text-sm font-semibold text-gray-800 dark:text-white/90"
                :title="activo.nombre_sucursal || ''"
              >
                {{ activo.nombre_sucursal || '—' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4 lg:col-span-3 lg:pl-6">
        <!-- CARD: Descripción -->
        <section class="rounded-xl border border-gray-200  p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <header class="mb-3 flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              <AppIcon :name="ICONS.fileText" :size="16" />
            </span>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Descripción del activo</h4>
          </header>
          <p class="text-sm leading-relaxed text-gray-800 dark:text-white/90">
            {{ activo.descripcion || '—' }}
          </p>
        </section>

        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <header class="mb-3 flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              <AppIcon :name="ICONS.wrench" :size="16" />
            </span>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Especificaciones técnicas</h4>
          </header>

          <div class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">Categoría de activo</p>
              <span
                v-if="activo.nombre_tipo"
                class="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200"
              >
                {{ formatListaOpcionLabel(activo.nombre_tipo) }}
              </span>
              <span v-else class="text-sm font-medium text-gray-400 dark:text-gray-600">—</span>
            </div>

            <div>
              <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">Marca</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ activo.marca || '—' }}</p>
            </div>

            <div class="sm:col-span-2">
              <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">Modelo</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ activo.modelo || '—' }}</p>
            </div>

            <div>
              <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">N° de serie / Etiqueta</p>
              <p class="font-mono text-sm font-medium text-gray-800 dark:text-white/90">{{ activo.numero_serie || '—' }}</p>
            </div>

            <div>
              <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">Fecha de compra</p>
              <p class="flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-white/90">
                <AppIcon :name="ICONS.calendar" :size="14" class="shrink-0 text-gray-400" />
                {{ activo.fecha_compra || '—' }}
              </p>
            </div>
          </div>
        </section>

        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <header class="mb-3 flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              <AppIcon :name="ICONS.history" :size="16" />
            </span>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Detalles de registro</h4>
          </header>

          <div class="grid grid-cols-2 gap-x-3 text-xs">
            <div>
              <p class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <AppIcon :name="ICONS.check" :size="12" class="shrink-0 text-emerald-600 dark:text-emerald-400" />
                Creado
              </p>
              <p class="mt-0.5 font-medium text-gray-800 dark:text-white/90">{{ formatearFecha(activo.fecha_creacion) }}</p>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400">Última modificación</p>
              <p class="mt-0.5 font-medium text-gray-800 dark:text-white/90">{{ formatearFecha(activo.fecha_modificacion) }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div v-else class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      No se encontró información del activo.
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="handleClose"
      >
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { useActivoDetailQuery } from '@/modules/activos/composables/useActivosQuery'
import type { Activo } from '@/modules/activos/interfaces/activo.interface'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const props = defineProps<{ activo?: Activo | null }>()
const open = defineModel<boolean>({ default: false })

const idActivo = computed(() => props.activo?.id)
const detailQuery = useActivoDetailQuery(idActivo, open)

const activo = computed(() => detailQuery.data.value ?? props.activo)

const inicialResponsable = computed(() =>
  (activo.value?.nombre_trabajador_responsable || '').charAt(0).toUpperCase(),
)

const handleClose = () => {
  open.value = false
}

const abrirImagen = () => {
  if (activo.value?.url_imagen_principal) {
    window.open(activo.value.url_imagen_principal, '_blank')
  }
}

const formatearFecha = (valor?: string) => {
  if (!valor) return '—'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
<template>
  <AppModal
    v-model="open"
    :title="activo?.descripcion || 'Detalle del activo'"
    :subtitle="activo?.numero_serie || 'Información del activo fijo de la empresa.'"
    size="xl"
    @close="handleClose"
  >
    <div v-if="activo" class="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-0">
      <div
        class="flex flex-col lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-6 dark:lg:border-gray-700"
      >
        <div
          class="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40"
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
            <AppIcon :name="ICONS.image" :size="18" />
          </button>
        </div>

        <div class="mt-4 space-y-3">
          <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <p class="mb-1 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Valor actual (Importe)
            </p>
            <p class="text-xl font-bold text-gray-800 dark:text-white/90">
              {{ activo.importe != null ? `S/ ${Number(activo.importe).toFixed(2)}` : '—' }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">Responsable</p>
              <p class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                >
                  {{ inicialResponsable }}
                </span>
                <span class="truncate">{{ activo.nombre_trabajador_responsable || '—' }}</span>
              </p>
            </div>
            <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">Sucursal</p>
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

      <!-- Lado de datos -->
      <div class="space-y-4 lg:col-span-3 lg:pl-6">
        <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-white/[0.02]">
          <h4 class="mb-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Descripción del activo
          </h4>
          <p class="text-base leading-relaxed text-gray-800 dark:text-white/90">
            {{ activo.descripcion || '—' }}
          </p>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-white/[0.02]">
          <h4
            class="mb-4 border-b border-gray-200 pb-2 text-xs uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            Especificaciones técnicas
          </h4>

          <div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                Categoría de activo
              </label>
              <div class="py-1 text-sm font-medium text-gray-800 dark:text-white/90">
                <span class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200">
                  {{ formatListaOpcionLabel(activo.nombre_tipo) || '—' }}
                </span>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Marca</label>
              <div class="py-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {{ activo.marca || '—' }}
              </div>
            </div>

            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Modelo</label>
              <div class="py-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {{ activo.modelo || '—' }}
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                N° de serie / Etiqueta
              </label>
              <div class="py-1 font-mono text-sm font-medium text-gray-800 dark:text-white/90">
                {{ activo.numero_serie || '—' }}
              </div>
            </div>

            <div> 
              <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                Fecha de compra
              </label>
              <div class="flex items-center gap-2 py-1 text-sm font-medium text-gray-800 dark:text-white/90">
                <AppIcon :name="ICONS.calendar" :size="16" class="text-gray-400" />
                {{ activo.fecha_compra || '—' }}
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-white/[0.02]">
          <h4 class="mb-3 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Detalles de registro
          </h4>
          <div
            class="flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/5"
          >
            <AppIcon :name="ICONS.check" :size="20" class="mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                Creado el {{ formatearFecha(activo.fecha_creacion) }}
              </p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Última modificación: {{ formatearFecha(activo.fecha_modificacion) }}
              </p>
            </div>
          </div>
        </div>
      </div>
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
import type { Activo } from '@/modules/activos/interfaces/activo.interface'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const props = defineProps<{ activo?: Activo | null }>()
const open = defineModel<boolean>({ default: false })

const inicialResponsable = computed(() =>
  (props.activo?.nombre_trabajador_responsable || '').charAt(0).toUpperCase(),
)

const handleClose = () => {
  open.value = false
}

const abrirImagen = () => {
  if (props.activo?.url_imagen_principal) {
    window.open(props.activo.url_imagen_principal, '_blank')
  }
}

const formatearFecha = (valor?: string) => {
  if (!valor) return '—'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

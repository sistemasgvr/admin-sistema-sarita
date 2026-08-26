<template>
  <AppModal
    v-model="open"
    title="Detalle del trabajador"
    :subtitle="trabajador?.nombre_tipo_documento && trabajador?.numero_documento
      ? `${trabajador.nombre_tipo_documento} ${trabajador.numero_documento}`
      : undefined"
    size="lg"
  >
    <div v-if="detailQuery.isFetching.value && !trabajador" class="flex items-center justify-center gap-2 py-10 text-sm text-gray-500 dark:text-gray-400">
      <AppIcon :name="ICONS.loader" :size="16" class="animate-spin" />
      Cargando...
    </div>

    <div v-else-if="trabajador" class="space-y-4 text-sm">
      <div class="flex items-start justify-between gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <div class="flex items-center gap-3">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            {{ iniciales }}
          </span>
          <div>
            <p class="text-base font-semibold text-gray-800 dark:text-white/90">
              {{ nombreCompleto || 'Sin nombre' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ trabajador.nombre_tipo_documento }} {{ trabajador.numero_documento }}
              <span v-if="trabajador.edad != null"> · {{ trabajador.edad }} años</span>
              <span v-if="trabajador.nombre_cargo"> · {{ trabajador.nombre_cargo }}</span>
            </p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1">
          <AppBadge :color="trabajador.estado === 1 ? 'success' : 'error'">
            {{ trabajador.estado === 1 ? 'Activo' : 'Cesado' }}
          </AppBadge>
          <AppBadge v-if="trabajador.es_chofer" color="warning">Chofer</AppBadge>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-5">
        <section class="rounded-xl border border-gray-200  p-4 dark:border-gray-800 dark:bg-white/[0.02] lg:col-span-3">
          <header class="mb-3 flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              <AppIcon :name="ICONS.userCircle" :size="16" />
            </span>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Datos personales</h4>
          </header>

          <div class="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Nombres</p>
              <p class="font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombres }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Apellidos</p>
              <p class="font-medium text-gray-800 dark:text-white/90">
                {{ [trabajador.apellido_paterno, trabajador.apellido_materno].filter(Boolean).join(' ') || '—' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Documento</p>
              <p class="font-medium text-gray-800 dark:text-white/90">
                {{ trabajador.nombre_tipo_documento }} {{ trabajador.numero_documento }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Edad</p>
              <p class="font-medium text-gray-800 dark:text-white/90">{{ trabajador.edad ?? '—' }} años</p>
            </div>
            <div v-if="trabajador.correo" class="col-span-2">
              <p class="text-xs text-gray-500 dark:text-gray-400">Correo</p>
              <p class="flex items-center gap-1.5 font-medium text-gray-800 dark:text-white/90">
                <AppIcon :name="ICONS.mail" :size="14" class="shrink-0 text-gray-400" />
                {{ trabajador.correo }}
              </p>
            </div>
          </div>
        </section>

        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02] lg:col-span-2">
          <header class="mb-3 flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              <AppIcon :name="ICONS.clipboardList" :size="16" />
            </span>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Datos laborales</h4>
          </header>

          <dl class="divide-y divide-gray-200 dark:divide-gray-800">
            <div class="flex items-center justify-between gap-2 py-1.5 first:pt-0 last:pb-0">
              <dt class="text-xs text-gray-500 dark:text-gray-400">Área</dt>
              <dd class="text-right font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombre_area || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-2 py-1.5 first:pt-0 last:pb-0">
              <dt class="text-xs text-gray-500 dark:text-gray-400">Cargo</dt>
              <dd class="text-right font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombre_cargo || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-2 py-1.5 first:pt-0 last:pb-0">
              <dt class="text-xs text-gray-500 dark:text-gray-400">Inicio</dt>
              <dd class="text-right font-medium text-gray-800 dark:text-white/90">{{ trabajador.fecha_inicio || '—' }}</dd>
            </div>
            <div class="flex items-center justify-between gap-2 py-1.5 first:pt-0 last:pb-0">
              <dt class="text-xs text-gray-500 dark:text-gray-400">Cese</dt>
              <dd class="text-right font-medium text-gray-800 dark:text-white/90">{{ trabajador.fecha_cese || '—' }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="ICONS.mapPin" :size="16" />
          </span>
          <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Dirección</h4>
        </header>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="sm:col-span-2">
            <p class="font-medium text-gray-800 dark:text-white/90">{{ trabajador.direccion || '—' }}</p>
            <p v-if="trabajador.referencia" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Ref: {{ trabajador.referencia }}
            </p>
          </div>
          <div class="space-y-1 border-t border-gray-200 pt-3 dark:border-gray-800 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
            <p v-if="ubicacion" class="text-xs text-gray-500 dark:text-gray-400">{{ ubicacion }}</p>
            <p
              v-if="trabajador.latitud != null && trabajador.longitud != null"
              class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
            >
              <AppIcon :name="ICONS.locateFixed" :size="12" class="shrink-0" />
              {{ trabajador.latitud }}, {{ trabajador.longitud }}
            </p>
            <p v-if="!ubicacion && trabajador.latitud == null" class="text-xs text-gray-400 dark:text-gray-600">
              Sin ubicación registrada
            </p>
          </div>
        </div>
      </section>

      <div class="grid gap-4 sm:grid-cols-2">
        <section
          v-if="trabajador.nombre_usuario_vinculo || trabajador.nombre_chofer"
          class="rounded-xl border border-gray-200  p-4 dark:border-gray-800 dark:bg-white/[0.02]"
        >
          <header class="mb-3 flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              <AppIcon :name="ICONS.keyRound" :size="16" />
            </span>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Acceso al sistema</h4>
          </header>

          <div class="grid gap-3 sm:grid-cols-1">
            <div
              v-if="trabajador.nombre_usuario_vinculo"
              class="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900/40"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">
                <AppIcon :name="ICONS.userCheck" :size="14" />
              </span>
              <div class="min-w-0">
                <p class="text-xs text-gray-500 dark:text-gray-400">Usuario de acceso</p>
                <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombre_usuario_vinculo }}</p>
              </div>
            </div>
            <div
              v-if="trabajador.nombre_chofer"
              class="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900/40"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">
                <AppIcon :name="ICONS.car" :size="14" />
              </span>
              <div class="min-w-0">
                <p class="text-xs text-gray-500 dark:text-gray-400">Chofer</p>
                <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombre_chofer }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- CARD: Auditoría -->
        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <header class="mb-3 flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              <AppIcon :name="ICONS.history" :size="16" />
            </span>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Auditoría</h4>
          </header>

          <div class="grid grid-cols-2 gap-x-3 text-xs">
            <div>
              <p class="text-gray-500 dark:text-gray-400">Creado por</p>
              <p class="mt-0.5 truncate font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombre_usuario_creacion || '—' }}</p>
              <p class="text-gray-400 dark:text-gray-500">{{ trabajador.fecha_creacion || '—' }}</p>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400">Última modificación</p>
              <p class="mt-0.5 truncate font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombre_usuario_modificacion || '—' }}</p>
              <p class="text-gray-400 dark:text-gray-500">{{ trabajador.fecha_modificacion || '—' }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div v-else class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      No se encontró información del trabajador.
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="open = false"
      >
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppBadge, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { useTrabajadorDetailQuery } from '@/modules/trabajadores/composables/useTrabajadoresQuery'
import type { Trabajador } from '@/modules/trabajadores/interfaces/trabajador.interface'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ trabajador: Trabajador | null }>()

const idTrabajador = computed(() => props.trabajador?.id)
const detailQuery = useTrabajadorDetailQuery(idTrabajador, open)
const trabajador = computed(() => detailQuery.data.value ?? props.trabajador)

const nombreCompleto = computed(() =>
  [trabajador.value?.nombres, trabajador.value?.apellido_paterno, trabajador.value?.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim(),
)

const iniciales = computed(() => {
  const nombres = trabajador.value?.nombres?.trim()?.[0] ?? ''
  const apellido = trabajador.value?.apellido_paterno?.trim()?.[0] ?? ''
  const resultado = `${nombres}${apellido}`.toUpperCase()
  return resultado || '—'
})

const ubicacion = computed(() => {
  const t = trabajador.value
  if (!t) return ''
  return [t.nombre_departamento, t.nombre_provincia, t.nombre_distrito]
    .filter(Boolean)
    .join(', ')
})
</script>
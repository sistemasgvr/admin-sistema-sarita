<template>
  <AppModal
    v-model="open"
    title="Detalle del trabajador"
    :subtitle="nombreCompleto || 'Sin nombre'"
    size="lg"
  >
    <div v-if="trabajador" class="space-y-4 text-sm">
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <p class="text-gray-500 dark:text-gray-400">Nombres</p>
          <p class="font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombres }}</p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-gray-400">Apellidos</p>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ [trabajador.apellido_paterno, trabajador.apellido_materno].filter(Boolean).join(' ') || '—' }}
          </p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-gray-400">Documento</p>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ trabajador.nombre_tipo_documento }} {{ trabajador.numero_documento }}
          </p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-gray-400">Edad</p>
          <p class="font-medium text-gray-800 dark:text-white/90">
            {{ trabajador.edad ?? '—' }} años
          </p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-gray-400">Área</p>
          <p class="font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombre_area || '—' }}</p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-gray-400">Cargo</p>
          <p class="font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombre_cargo || '—' }}</p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-gray-400">Fecha de inicio</p>
          <p class="font-medium text-gray-800 dark:text-white/90">{{ trabajador.fecha_inicio || '—' }}</p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-gray-400">Fecha de cese</p>
          <p class="font-medium text-gray-800 dark:text-white/90">{{ trabajador.fecha_cese || '—' }}</p>
        </div>
      </div>

      <div>
        <p class="text-gray-500 dark:text-gray-400">Dirección</p>
        <p class="font-medium text-gray-800 dark:text-white/90">{{ trabajador.direccion || '—' }}</p>
        <p v-if="trabajador.referencia" class="text-xs text-gray-500 dark:text-gray-400">
          Ref: {{ trabajador.referencia }}
        </p>
        <p v-if="ubicacion" class="text-xs text-gray-500 dark:text-gray-400">{{ ubicacion }}</p>
        <p v-if="trabajador.latitud != null && trabajador.longitud != null" class="text-xs text-gray-500 dark:text-gray-400">
          GPS: {{ trabajador.latitud }}, {{ trabajador.longitud }}
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div v-if="trabajador.nombre_usuario_vinculo">
          <p class="text-gray-500 dark:text-gray-400">Usuario de acceso</p>
          <p class="font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombre_usuario_vinculo }}</p>
        </div>
        <div v-if="trabajador.nombre_chofer">
          <p class="text-gray-500 dark:text-gray-400">Chofer</p>
          <p class="font-medium text-gray-800 dark:text-white/90">{{ trabajador.nombre_chofer }}</p>
        </div>
      </div>

      <div>
        <AppBadge :color="trabajador.estado === 1 ? 'success' : 'error'">
          {{ trabajador.estado === 1 ? 'Activo' : 'Cesado' }}
        </AppBadge>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppBadge, AppModal } from '@/shared/components'
import type { Trabajador } from '@/modules/trabajadores/interfaces/trabajador.interface'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ trabajador: Trabajador | null }>()

const nombreCompleto = computed(() =>
  [props.trabajador?.nombres, props.trabajador?.apellido_paterno, props.trabajador?.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim(),
)

const ubicacion = computed(() => {
  const t = props.trabajador
  if (!t) return ''
  return [t.nombre_departamento, t.nombre_provincia, t.nombre_distrito]
    .filter(Boolean)
    .join(', ')
})
</script>

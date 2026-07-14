<template>
  <AppModal
    v-model="open"
    title="Detalle del vehículo"
    :subtitle="vehiculo ? vehiculo.placa : undefined"
    size="lg"
  >
    <div v-if="vehiculo" class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge :color="vehiculo.estado === 1 ? 'success' : 'error'">
          {{ vehiculo.estado === 1 ? 'Activo' : 'Inactivo' }}
        </AppBadge>
        <AppBadge v-if="vehiculo.nombre_tipo_vehiculo" color="neutral">
          {{ vehiculo.nombre_tipo_vehiculo }}
        </AppBadge>
      </div>

      <section
        v-for="section in sections"
        :key="section.title"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          {{ section.title }}
        </h5>

        <dl class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div
            v-for="item in section.items"
            :key="item.label"
            :class="item.fullWidth ? 'sm:col-span-2' : ''"
          >
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">{{ item.label }}</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ item.value ?? '—' }}
            </dd>
          </div>
        </dl>
      </section>
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
import type { Vehiculo } from '@/modules/vehiculos/interfaces/vehiculo.interface'
import { useVehiculoDetailQuery } from '@/modules/vehiculos/composables/useVehiculoDetailQuery'
import { AppBadge, AppModal } from '@/shared/components'
import { formatDateTime } from '@/shared/utils/date'

interface VehiculoDetailModalProps {
  vehiculo?: Vehiculo | null
}

const props = defineProps<VehiculoDetailModalProps>()

const open = defineModel<boolean>({ default: false })

const idReferencia = computed(() => props.vehiculo?.id)
const vehiculoDetailQuery = useVehiculoDetailQuery(idReferencia, open)
const vehiculo = computed<Vehiculo | null>(
  () => vehiculoDetailQuery.data.value ?? props.vehiculo ?? null,
)

const getClienteNombreEmbebido = (v: Vehiculo): string | null => {
  if (v.cliente_razon_social) return v.cliente_razon_social

  const nombreCompleto = [v.cliente_nombres, v.cliente_apellido_paterno, v.cliente_apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || v.cliente_numero_documento || null
}

interface DetailItem {
  label: string
  value: string | null
  fullWidth?: boolean
}

interface DetailSection {
  title: string
  items: DetailItem[]
}

const sections = computed<DetailSection[]>(() => {
  const v = vehiculo.value
  if (!v) return []

  return [
    {
      title: 'Datos generales',
      items: [
        { label: 'Placa', value: v.placa },
        { label: 'Placa secundaria', value: v.placa2 ?? null },
        { label: 'Cliente / Proveedor dueño', value: getClienteNombreEmbebido(v) ?? 'Sin cliente asignado' },
      ],
    },
    {
      title: 'Características',
      items: [
        { label: 'Marca', value: v.marca ?? null },
        { label: 'Marca secundaria', value: v.marca2 ?? null },
        { label: 'Modelo', value: v.modelo ?? null },
        { label: 'Año', value: v.anio ? String(v.anio) : null },
        { label: 'Color', value: v.color ?? null },
      ],
    },
    {
      title: 'Documentación',
      items: [
        { label: 'Certificado de inscripción', value: v.certificado_inscripcion ?? null },
        { label: 'Certificado secundario', value: v.certificado2 ?? null },
      ],
    },
    {
      title: 'Auditoría',
      items: [
        { label: 'Creado por', value: v.nombre_usuario_creacion ?? null },
        { label: 'Fecha de creación', value: formatDateTime(v.fecha_creacion) },
        { label: 'Modificado por', value: v.nombre_usuario_modificacion ?? null },
        { label: 'Última modificación', value: formatDateTime(v.fecha_modificacion) },
      ],
    },
  ]
})
</script>

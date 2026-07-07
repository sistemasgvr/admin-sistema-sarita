<template>
  <AppModal
    v-model="open"
    title="Detalle del cilindro"
    :subtitle="balon?.codigo_balon"
    size="lg"
  >
    <div v-if="isLoading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando detalle...
    </div>

    <div v-else-if="balon" class="space-y-6">
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge v-if="balon.nombre_estado_balon" color="primary">
          {{ balon.nombre_estado_balon }}
        </AppBadge>
        <AppBadge v-if="balon.nombre_tipo_balon" color="neutral">
          {{ balon.nombre_tipo_balon }}
        </AppBadge>
        <AppBadge v-if="balon.nombre_propietario" color="neutral">
          {{ balon.nombre_propietario }}
        </AppBadge>
      </div>

      <section v-for="section in sections" :key="section.title" class="space-y-3">
        <div class="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0 dark:border-gray-800">
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
        </div>
      </section>

      <section
        v-if="balon.observacion"
        class="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800"
      >
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Observación</h5>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ balon.observacion }}</p>
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
import { computed, toRef } from 'vue'
import { useBalonQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { AppBadge, AppModal } from '@/shared/components'
import { formatDateTime } from '@/shared/utils/date'

interface DetailSectionItem {
  label: string
  value?: string | null
  fullWidth?: boolean
}

interface DetailSection {
  title: string
  items: DetailSectionItem[]
}

const props = defineProps<{
  balonId?: number | null
}>()

const open = defineModel<boolean>({ default: false })

const balonIdRef = toRef(() => props.balonId)
const balonQuery = useBalonQuery(balonIdRef)

const isLoading = computed(() => balonQuery.isFetching.value)
const balon = computed(() => balonQuery.data.value ?? null)

const formatDate = (value?: string | null) => (value ? value.slice(0, 10) : undefined)

const sections = computed<DetailSection[]>(() => {
  const data = balon.value
  if (!data) return []

  return [
    {
      title: 'Identificación',
      items: [
        { label: 'Código', value: data.codigo_balon },
        { label: 'Libro', value: data.libro_cilindro },
        { label: 'Página', value: data.pagina_libro?.toString() },
        { label: 'Fecha registro', value: formatDate(data.fecha_registro) },
        { label: 'N° recepción', value: data.numero_recepcion },
      ],
    },
    {
      title: 'Clasificación y ubicación',
      items: [
        { label: 'Tipo de balón', value: data.nombre_tipo_balon },
        { label: 'Gas', value: data.nombre_producto_gas },
        { label: 'Referencia', value: data.nombre_referencia },
        { label: 'Almacén', value: data.nombre_almacen },
        { label: 'Cliente ubicación', value: data.nombre_cliente_ubicacion },
        { label: 'Cliente propietario', value: data.nombre_cliente_propietario },
      ],
    },
    {
      title: 'Prueba hidrostática',
      items: [
        { label: 'Última P.H.', value: formatDate(data.fecha_ultima_prueba_hidrostatica) },
        {
          label: 'Vigencia',
          value: data.vigencia_prueba_hidrostatica_anios
            ? `${data.vigencia_prueba_hidrostatica_anios} años`
            : undefined,
        },
        { label: 'Próxima P.H.', value: formatDate(data.fecha_proxima_prueba_hidrostatica) },
        { label: 'Presión actual', value: data.presion_actual?.toString() },
        { label: 'Fecha fabricación', value: formatDate(data.fecha_fabricacion) },
      ],
    },
    {
      title: 'Auditoría',
      items: [
        { label: 'Creado por', value: data.nombre_usuario_creacion },
        { label: 'Modificado por', value: data.nombre_usuario_modificacion },
        { label: 'Fecha creación', value: formatDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>

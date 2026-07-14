<template>
  <AppModal
    v-model="open"
    title="Detalle de la dirección"
    :subtitle="direccion ? direccion.direccion : undefined"
    size="lg"
  >
    <div v-if="direccion" class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge :color="direccion.estado === 1 ? 'success' : 'error'">
          {{ direccion.estado === 1 ? 'Activo' : 'Inactivo' }}
        </AppBadge>
        <AppBadge v-if="direccion.es_principal" color="primary" :icon="ICONS.star">
          Principal
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
              <template v-if="item.isLink && item.linkHref">
                <AppIcon :name="ICONS.mapPin" :size="14" />
                  {{ item.value }}
                <a
                  :href="item.linkHref"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600"
                >
                Ver en Google Maps
                </a>
              </template>
              <template v-else>
                {{ item.value ?? '—' }}
              </template>
            </dd>
          </div>
        </dl>
      </section>

      <section
        v-if="direccion.latitud && direccion.longitud"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          Ubicación en el mapa
        </h5>
        <MapaLeaflet
          :latitud="direccion.latitud"
          :longitud="direccion.longitud"
          :height="'280px'"
          :searchable="false"
          :draggable-marker="false"
          :readonly="true"
          :zoom="30"
        />
      </section>

      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Auditoría</h5>
        <dl class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Creado por</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ direccion.nombre_usuario_creacion ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Fecha de creación</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ formatDateTime(direccion.fecha_creacion) }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Modificado por</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ direccion.nombre_usuario_modificacion ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Última modificación</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ formatDateTime(direccion.fecha_modificacion) }}
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
import type { Direccion } from '@/modules/direcciones/interfaces/direccion.interface'
import { useDireccionDetailQuery } from '@/modules/direcciones/composables/useDireccionDetailQuery'
import { AppBadge, AppModal, MapaLeaflet } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { formatDateTime } from '@/shared/utils/date'

interface DireccionDetailModalProps {
  direccion?: Direccion | null
}

const props = defineProps<DireccionDetailModalProps>()

const open = defineModel<boolean>({ default: false })

const idReferencia = computed(() => props.direccion?.id)
const direccionDetailQuery = useDireccionDetailQuery(idReferencia, open)
const direccion = computed<Direccion | null>(
  () => direccionDetailQuery.data.value ?? props.direccion ?? null,
)

const getClienteNombreEmbebido = (d: Direccion): string | null => {
  if (d.cliente_razon_social) return d.cliente_razon_social

  const nombreCompleto = [d.cliente_nombres, d.cliente_apellido_paterno, d.cliente_apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || d.cliente_numero_documento || null
}

const getUbigeoTexto = (dir: Direccion) => {
  const partes = [dir.nombre_distrito, dir.nombre_provincia, dir.nombre_departamento, dir.nombre_pais].filter(
    Boolean,
  )
  return partes.length ? partes.join(', ') : null
}

interface DetailItem {
  label: string
  value: string | null
  fullWidth?: boolean
  isLink?: boolean
  linkHref?: string
}

interface DetailSection {
  title: string
  items: DetailItem[]
}

const sections = computed<DetailSection[]>(() => {
  const d = direccion.value
  if (!d) return []

  return [
    {
      title: 'Datos generales',
      items: [
        { label: 'Cliente / Proveedor', value: getClienteNombreEmbebido(d) ?? null },
        { label: 'Descripción', value: d.descripcion ?? null },
        { label: 'Dirección', value: d.direccion, fullWidth: true },
        { label: 'Referencia', value: d.referencia ?? null, fullWidth: true },
        {
          label: 'Coordenadas',
          value: d.latitud && d.longitud
            ? `${d.latitud}, ${d.longitud}`
            : null,
          fullWidth: true,
          isLink: true,
          linkHref: d.latitud && d.longitud
            ? `https://www.google.com/maps/search/?api=1&query=${d.latitud},${d.longitud}`
            : undefined,
        },
      ],
    },
    {
      title: 'Ubicación',
      items: [
        { label: 'Ubigeo', value: getUbigeoTexto(d), fullWidth: true },
        { label: 'País', value: d.nombre_pais ?? null },
        { label: 'Departamento', value: d.nombre_departamento ?? null },
        { label: 'Provincia', value: d.nombre_provincia ?? null },
        { label: 'Distrito', value: d.nombre_distrito ?? null },
      ],
    },
  ]
})
</script>

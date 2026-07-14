<template>
  <AppModal
    v-model="open"
    title="Detalle del chofer"
    :subtitle="chofer ? getChoferNombre(chofer) : undefined"
    size="lg"
  >
    <div v-if="chofer" class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge :color="chofer.estado === 1 ? 'success' : 'error'">
          {{ chofer.estado === 1 ? 'Activo' : 'Inactivo' }}
        </AppBadge>
        <AppBadge v-if="chofer.nombre_tipo_licencia" color="neutral">
          {{ chofer.nombre_tipo_licencia }}
        </AppBadge>
        <AppBadge v-if="chofer.nombre_categoria_licencia" color="neutral">
          Categoría {{ chofer.nombre_categoria_licencia }}
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
import type { Chofer } from '@/modules/choferes/interfaces/chofer.interface'
import { useChoferDetailQuery } from '@/modules/choferes/composables/useChoferDetailQuery'
import { AppBadge, AppModal } from '@/shared/components'
import { formatDateTime } from '@/shared/utils/date'

interface ChoferDetailModalProps {
  chofer?: Chofer | null
}

const props = defineProps<ChoferDetailModalProps>()

const open = defineModel<boolean>({ default: false })

const idReferencia = computed(() => props.chofer?.id)
const choferDetailQuery = useChoferDetailQuery(idReferencia, open)
const chofer = computed<Chofer | null>(() => choferDetailQuery.data.value ?? props.chofer ?? null)

const getClienteNombreEmbebido = (c: Chofer): string | null => {
  if (c.cliente_razon_social) return c.cliente_razon_social

  const nombreCompleto = [c.cliente_nombres, c.cliente_apellido_paterno, c.cliente_apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || c.cliente_numero_documento || null
}

const getChoferNombre = (chofer: Chofer) =>
  [chofer.nombres, chofer.apellido_paterno, chofer.apellido_materno].filter(Boolean).join(' ').trim()

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
  const c = chofer.value
  if (!c) return []

  return [
    {
      title: 'Datos generales',
      items: [
        { label: 'Nombre completo', value: getChoferNombre(c) },
        { label: 'Documento', value: `${c.nombre_tipo_documento ?? 'Doc.'} ${c.numero_documento}` },
        { label: 'Teléfono', value: c.telefono ?? null },
        { label: 'Cliente / Proveedor', value: getClienteNombreEmbebido(c) ?? 'Sin cliente asignado' },
      ],
    },
    {
      title: 'Licencia de conducir',
      items: [
        { label: 'N° de licencia (brevete)', value: c.codigo_licencia ?? null },
        { label: 'Tipo de licencia', value: c.nombre_tipo_licencia ?? null },
        { label: 'Categoría', value: c.nombre_categoria_licencia ?? null },
        { label: 'Fecha de emisión', value: c.fecha_emision ?? null },
        { label: 'Fecha de vencimiento', value: c.fecha_vencimiento ?? null },
      ],
    },
    {
      title: 'Auditoría',
      items: [
        { label: 'Creado por', value: c.nombre_usuario_creacion ?? null },
        { label: 'Fecha de creación', value: formatDateTime(c.fecha_creacion) },
        { label: 'Modificado por', value: c.nombre_usuario_modificacion ?? null },
        { label: 'Última modificación', value: formatDateTime(c.fecha_modificacion) },
      ],
    },
  ]
})
</script>

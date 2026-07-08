<template>
  <AppModal
    v-model="open"
    title="Detalle de categoría"
    :subtitle="categoria?.nombre"
    size="lg"
  >
    <DetailCardsLayout :loading="false" :sections="sections">
      <template #badges>
        <AppBadge variant="light" color="primary">
          {{ categoria?.total_sub_categorias ?? 0 }} subcategorías
        </AppBadge>
      </template>
    </DetailCardsLayout>

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
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import { formatDetailDateTime } from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { AppBadge, AppModal } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  categoria?: CategoriaProducto | null
}>()

const open = defineModel<boolean>({ default: false })

const sections = computed<DetailSection[]>(() => {
  const data = props.categoria
  if (!data) return []

  return [
    {
      title: 'Datos generales',
      icon: ICONS.layers,
      items: [
        { label: 'Nombre', value: data.nombre },
        { label: 'Descripción', value: data.descripcion },
        { label: 'Subcategorías', value: data.total_sub_categorias?.toString() },
      ],
    },
    {
      title: 'Auditoría',
      icon: ICONS.userCircle,
      items: [
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>

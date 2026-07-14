<template>
  <AppModal
    v-model="open"
    title="Detalle del ítem de catálogo"
    :subtitle="catalogoPrecio?.nombre_item"
    size="lg"
  >
    <DetailCardsLayout :loading="false" :sections="sections">
      <template #badges>
        <ListaOpcionBadge
          v-if="catalogoPrecio?.nombre_tipo_catalogo"
          :value="catalogoPrecio.nombre_tipo_catalogo"
          raw
        />
        <AppBadge v-if="catalogoPrecio?.periodo" color="neutral">
          {{ catalogoPrecio.periodo }}
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
import {
  formatDetailCapacity,
  formatDetailDateTime,
  formatDetailPrecio,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import type { CatalogoPrecio } from '@/modules/productos/catalogo-precios/interfaces/catalogo-precio.interface'
import { AppBadge, AppModal, ListaOpcionBadge } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  catalogoPrecio?: CatalogoPrecio | null
}>()

const open = defineModel<boolean>({ default: false })

const sections = computed<DetailSection[]>(() => {
  const data = props.catalogoPrecio
  if (!data) return []

  return [
    {
      title: 'Identificación',
      icon: ICONS.clipboardList,
      items: [
        { label: 'Tipo de catálogo', value: data.nombre_tipo_catalogo },
        { label: 'Periodo', value: data.periodo },
        { label: 'Ítem', value: data.nombre_item },
        { label: 'Clasificación', value: data.clasificacion },
        { label: 'Modelo', value: data.modelo },
      ],
    },
    {
      title: 'Producto asociado',
      icon: ICONS.package,
      items: [
        { label: 'Producto', value: data.nombre_producto },
        { label: 'Código', value: data.codigo_producto },
        { label: 'Tipo de balón', value: data.nombre_tipo_balon },
        { label: 'Proveedor', value: data.nombre_proveedor },
        {
          label: 'Capacidad',
          value: formatDetailCapacity(data.capacidad, data.nombre_unidad_medida),
        },
        { label: 'Presentación', value: data.descripcion_presentacion },
      ],
    },
    {
      title: 'Precios',
      icon: ICONS.creditCard,
      items: [
        { label: 'Costo producto', value: formatDetailPrecio(data.costo_producto) },
        { label: 'Costo flete', value: formatDetailPrecio(data.costo_flete) },
        {
          label: 'Margen',
          value: data.porcentaje_margen != null ? `${data.porcentaje_margen}%` : undefined,
        },
        { label: 'Precio final', value: formatDetailPrecio(data.precio_final) },
        { label: 'Precio garantía', value: formatDetailPrecio(data.precio_garantia) },
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

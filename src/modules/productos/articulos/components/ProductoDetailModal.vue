<template>
  <AppModal
    v-model="open"
    title="Detalle del producto"
    :subtitle="producto?.nombre"
    size="lg"
  >
    <DetailCardsLayout :loading="false" :sections="sections">
      <template #badges>
        <AppBadge
          v-if="producto?.es_servicio"
          color="warning"
          title="Servicio"
        >
          Servicio
        </AppBadge>
        <AppBadge
          v-else-if="producto?.es_gas"
          color="success"
          title="Catálogo/precio POS · inventario en Balones"
        >
          Gas · catálogo
        </AppBadge>
        <AppBadge v-else color="primary">Accesorio</AppBadge>
        <AppBadge
          v-if="producto && esProductoSistema(producto)"
          color="primary"
          title="Producto de sistema para facturación del POS"
        >
          Sistema
        </AppBadge>
        <AppBadge v-if="producto?.es_alquilable" color="neutral" variant="light">
          Alquilable
        </AppBadge>
        <AppBadge v-if="producto?.afecta_stock" color="success" variant="light">
          Stock almacén
        </AppBadge>
        <AppHelpTip
          v-if="producto?.es_gas"
          text="Solo sirve para el precio de venta. La cantidad disponible está en Balones / Stock de gas."
        />
      </template>

      <template #extra>
        <DetailSectionCard
          v-if="producto?.id"
          title="Imágenes"
          :icon="ICONS.images"
          full-width
        >
          <ProductoImagenesManager :id-producto="producto.id" />
        </DetailSectionCard>
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
import ProductoImagenesManager from '@/modules/productos/articulos/components/ProductoImagenesManager.vue'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import { esProductoSistema } from '@/modules/productos/articulos/utils/productosSistema'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import {
  formatDetailDateTime,
  formatDetailPrecio,
  formatDetailYesNo,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { AppBadge, AppHelpTip, AppModal } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const props = defineProps<{
  producto?: Producto | null
}>()

const open = defineModel<boolean>({ default: false })

const sections = computed<DetailSection[]>(() => {
  const data = props.producto
  if (!data) return []

  return [
    {
      title: 'Identificación',
      icon: ICONS.package,
      items: [
        { label: 'Código', value: data.codigo },
        { label: 'Nombre', value: data.nombre },
        { label: 'Código de barras', value: data.codigo_barra },
        { label: 'Código de ubicación', value: data.codigo_ubicacion },
        { label: 'Marca', value: data.marca },
        { label: 'Presentación', value: data.presentacion },
      ],
    },
    {
      title: 'Clasificación',
      icon: ICONS.tags,
      items: [
        { label: 'Categoría', value: data.nombre_categoria },
        { label: 'Subcategoría', value: data.nombre_sub_categoria },
        { label: 'Unidad de medida', value: data.nombre_unidad_medida },
      ],
    },
    {
      title: 'Comercial',
      icon: ICONS.creditCard,
      items: [
        { label: 'Precio de venta', value: formatDetailPrecio(data.precio) },
        { label: 'Precio de compra', value: formatDetailPrecio(data.precio_compra) },
        ...(data.es_alquilable
          ? [
              {
                label: 'Precio de garantía',
                value: formatDetailPrecio(data.precio_garantia),
              },
            ]
          : []),
        {
          label: 'Tipo',
          value: data.es_servicio
            ? 'Servicio'
            : data.es_gas
              ? 'Gas (solo precio)'
              : 'Accesorio',
        },
        { label: 'Es alquilable', value: formatDetailYesNo(data.es_alquilable) },
        {
          label: 'Inventario',
          value: data.es_gas
            ? 'Balones / Stock de gas'
            : data.es_servicio
              ? 'No aplica'
              : data.afecta_stock
                ? 'Productos / Stock accesorios'
                : 'Sin stock',
        },
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

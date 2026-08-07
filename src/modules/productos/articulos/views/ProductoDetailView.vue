<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <RouterLink
          :to="{ name: 'admin-productos-articulos' }"
          class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
        >
          <AppIcon :name="ICONS.chevronLeft" :size="16" />
          Volver al catálogo
        </RouterLink>
        <AppHelpTip
          text="Aquí ves la ficha del producto y su galería. Para cambiar la cantidad de stock usa Movimientos (accesorios)."
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <RouterLink
          v-if="canEdit && producto"
          :to="{ name: 'admin-productos-articulos-editar', params: { id: String(producto.id) } }"
          class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
          Editar
        </RouterLink>
      </div>
    </div>

    <div
      v-if="productoQuery.isError.value"
      class="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
    >
      No se pudo cargar el detalle del producto.
    </div>

    <template v-else>
      <div v-if="isLoading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando detalle...
      </div>

      <div v-else class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
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
          <AppBadge v-else-if="producto" color="primary">Accesorio</AppBadge>
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
        </div>

        <DetailSectionCard
          v-if="producto?.id"
          title="Imágenes"
          :icon="ICONS.images"
          full-width
        >
          <ProductoImagenesManager
            :id-producto="producto.id"
            :editable="canEdit"
          />
        </DetailSectionCard>

        <DetailCardsLayout :loading="false" :sections="sections" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ProductoImagenesManager from '@/modules/productos/articulos/components/ProductoImagenesManager.vue'
import { useProductoDetailQuery } from '@/modules/productos/articulos/composables/useProductoDetailQuery'
import { esProductoSistema } from '@/modules/productos/articulos/utils/productosSistema'
import { productosArticulosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import {
  formatDetailDateTime,
  formatDetailPrecio,
  formatDetailYesNo,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { AppBadge, AppHelpTip } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'

const route = useRoute()
const authStore = useAuthStore()

const productoId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : undefined
})

const productoQuery = useProductoDetailQuery(productoId)
const producto = computed(() => productoQuery.data.value ?? null)
const isLoading = computed(() => productoQuery.isLoading.value)

const pageTitle = computed(() => producto.value?.nombre || 'Detalle de producto')
const breadcrumbItems = computed(() => productosArticulosBreadcrumbItems(pageTitle.value))

const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.PRODUCTOS_EDITAR))

const sections = computed<DetailSection[]>(() => {
  const data = producto.value
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
        {
          label: 'Precio de garantía',
          value: formatDetailPrecio(data.precio_garantia),
        },
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

<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5">
      <RouterLink
        :to="{ name: 'admin-productos-articulos' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>
    </div>

    <ProductoForm
      :mode="isEdit ? 'edit' : 'create'"
      :producto-id="productoId"
      :active="true"
      @saved="goToList"
      @cancel="goToList"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ProductoForm from '@/modules/productos/articulos/components/ProductoForm.vue'
import { productosArticulosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.name === 'admin-productos-articulos-editar')
const productoId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : undefined
})

const pageTitle = computed(() => (isEdit.value ? 'Editar producto' : 'Nuevo producto'))
const breadcrumbItems = computed(() => productosArticulosBreadcrumbItems(pageTitle.value))

const goToList = () => {
  void router.push({ name: 'admin-productos-articulos' })
}
</script>

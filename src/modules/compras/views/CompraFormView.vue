<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="{ name: 'admin-compras' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>
      <AppHelpTip :text="pageHelpText" />
    </div>

    <CompraForm
      :mode="mode"
      :compra-id="compraId"
      :referencia-compra-id="referenciaCompraId"
      :active="true"
      @cancel="goToList"
      @saved="goToList"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import CompraForm from '@/modules/compras/components/CompraForm.vue'
import { comprasFormBreadcrumbItems } from '@/modules/compras/config/compras-breadcrumb'
import type { CompraFormMode } from '@/modules/compras/interfaces/compra.interface'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppHelpTip } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.name === 'admin-compras-editar')
const mode = computed<CompraFormMode>(() => (isEdit.value ? 'edit' : 'create'))

const compraId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const referenciaCompraId = computed(() => {
  const raw = Number(route.query.referencia)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const pageTitle = computed(() => {
  if (isEdit.value) return 'Editar compra'
  if (referenciaCompraId.value) return 'Corregir compra'
  return 'Nueva compra'
})

const pageHelpText = computed(() =>
  isEdit.value
    ? 'Puedes ajustar categoría, condición de pago, glosa y las líneas. Si cambias cantidades de productos con stock, se genera el movimiento diferencial.'
    : 'Registra el comprobante del proveedor (productos, accesorios, gas o gastos). Recarga externa solo si la factura es el costo de una orden en planta.',
)

const breadcrumbItems = computed(() => comprasFormBreadcrumbItems(pageTitle.value))

const goToList = () => {
  router.push({ name: 'admin-compras' })
}
</script>

<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="{ name: 'admin-productos-movimientos' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>
      <AppHelpTip :text="pageHelpText" />
    </div>

    <MovimientoInventarioForm
      :mode="mode"
      :movimiento-id="movimientoId"
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
import MovimientoInventarioForm from '@/modules/productos/movimientos/components/MovimientoInventarioForm.vue'
import type { MovimientoInventarioFormMode } from '@/modules/productos/movimientos/interfaces/movimiento-inventario.interface'
import { productosMovimientosBreadcrumbItems } from '@/modules/productos/config/productos-breadcrumb'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppHelpTip } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const route = useRoute()
const router = useRouter()

const mode = computed<MovimientoInventarioFormMode>(() =>
  route.name === 'admin-productos-movimientos-editar' ? 'edit' : 'create',
)

const movimientoId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const pageTitle = computed(() =>
  mode.value === 'edit' ? 'Editar movimiento' : 'Nuevo movimiento',
)

const pageHelpText = computed(() =>
  mode.value === 'edit'
    ? 'Solo puedes modificar fecha, documento de referencia y glosa.'
    : 'Registra ingresos, salidas o ajustes. El producto y el almacén definen dónde se actualiza el stock.',
)

const breadcrumbItems = computed(() => productosMovimientosBreadcrumbItems(pageTitle.value))

const goToList = () => {
  void router.push({ name: 'admin-productos-movimientos' })
}
</script>

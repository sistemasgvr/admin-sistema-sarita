<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="{ name: 'admin-balones-movimientos' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>
      <AppHelpTip :text="pageHelpText" />
    </div>

    <MovimientoBalonForm
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
import MovimientoBalonForm from '@/modules/balones/movimientos/components/MovimientoBalonForm.vue'
import type { MovimientoBalonFormMode } from '@/modules/balones/movimientos/interfaces/movimiento-balon.interface'
import { balonesMovimientosBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppHelpTip } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const route = useRoute()
const router = useRouter()

const mode = computed<MovimientoBalonFormMode>(() =>
  route.name === 'admin-balones-movimientos-editar' ? 'edit' : 'create',
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
    ? 'El cilindro no se cambia. Actualiza tipo, fecha, almacenes o observación.'
    : 'Elige el tipo; luego solo aparecen los cilindros válidos para ese movimiento.',
)

const breadcrumbItems = computed(() => balonesMovimientosBreadcrumbItems(pageTitle.value))

const goToList = () => {
  void router.push({ name: 'admin-balones-movimientos' })
}
</script>

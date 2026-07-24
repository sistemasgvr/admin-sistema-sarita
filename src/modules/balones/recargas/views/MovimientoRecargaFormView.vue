<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="{ name: 'admin-balones-recargas' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>
      <AppHelpTip :text="pageHelpText" />
    </div>

    <MovimientoRecargaForm
      :mode="mode"
      :recarga-id="recargaId"
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
import MovimientoRecargaForm from '@/modules/balones/recargas/components/MovimientoRecargaForm.vue'
import type { MovimientoRecargaFormMode } from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'
import { balonesSectionBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppHelpTip } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const route = useRoute()
const router = useRouter()

const mode = computed<MovimientoRecargaFormMode>(() =>
  route.name === 'admin-balones-recargas-planta-editar' ? 'edit' : 'create',
)

const recargaId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const pageTitle = computed(() =>
  mode.value === 'edit' ? 'Editar recarga planta externa' : 'Recarga planta externa',
)

const pageHelpText = computed(() =>
  mode.value === 'edit'
    ? 'Actualiza los datos del envío a planta externa.'
    : 'Envío del cilindro propio a un tercero (GRE, factura compra, lote y P.H.).',
)

const breadcrumbItems = computed(() =>
  balonesSectionBreadcrumbItems('Recargas', '/admin/balones/recargas', pageTitle.value),
)

const goToList = () => {
  void router.push({ name: 'admin-balones-recargas' })
}
</script>

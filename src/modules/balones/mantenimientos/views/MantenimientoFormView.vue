<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="{ name: 'admin-balones-mantenimientos' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>
      <AppHelpTip :text="pageHelpText" />
    </div>

    <MantenimientoForm
      :mode="mode"
      :mantenimiento-id="mantenimientoId"
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
import MantenimientoForm from '@/modules/balones/mantenimientos/components/MantenimientoForm.vue'
import type { MantenimientoFormMode } from '@/modules/balones/mantenimientos/interfaces/mantenimiento.interface'
import { balonesSectionBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppHelpTip } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const route = useRoute()
const router = useRouter()

const mode = computed<MantenimientoFormMode>(() =>
  route.name === 'admin-balones-mantenimientos-editar' ? 'edit' : 'create',
)

const mantenimientoId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const pageTitle = computed(() =>
  mode.value === 'edit' ? 'Editar mantenimiento' : 'Nuevo mantenimiento',
)

const pageHelpText = computed(() =>
  mode.value === 'edit'
    ? 'Actualiza datos operativos. Para cerrar el ciclo use Finalizar en el listado.'
    : 'Ingreso a taller: cilindro de inventario o servicio al cilindro que trae el cliente.',
)

const breadcrumbItems = computed(() =>
  balonesSectionBreadcrumbItems('Mantenimientos', '/admin/balones/mantenimientos', pageTitle.value),
)

const goToList = () => {
  void router.push({ name: 'admin-balones-mantenimientos' })
}
</script>

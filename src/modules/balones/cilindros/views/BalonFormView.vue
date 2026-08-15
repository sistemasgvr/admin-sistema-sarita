<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="{ name: 'admin-balones-cilindros' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>
      <AppHelpTip :text="pageHelpText" />
    </div>

    <BalonForm
      :mode="mode"
      :balon-id="balonId"
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
import BalonForm from '@/modules/balones/cilindros/components/BalonForm.vue'
import type { BalonFormMode } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { balonesCilindrosBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppHelpTip } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.name === 'admin-balones-cilindros-editar')
const mode = computed<BalonFormMode>(() => (isEdit.value ? 'edit' : 'create'))

const balonId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const pageTitle = computed(() => (isEdit.value ? 'Editar cilindro' : 'Nuevo cilindro'))
const pageHelpText = computed(() =>
  isEdit.value
    ? 'Actualiza datos, ubicación y P.H. El historial de movimientos está en el detalle.'
    : 'Código y tipo son obligatorios. El tipo sugiere el gas y la vigencia de P.H.',
)
const breadcrumbItems = computed(() => balonesCilindrosBreadcrumbItems(pageTitle.value))

const goToList = () => {
  router.push({ name: 'admin-balones-cilindros' })
}
</script>

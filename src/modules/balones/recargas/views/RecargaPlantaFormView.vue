<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="{ name: 'admin-balones-recargas', query: { tab: 'planta' } }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver a órdenes planta
      </RouterLink>
      <AppHelpTip :text="pageHelpText" />
    </div>

    <RecargaPlantaForm
      :mode="mode"
      :recarga-id="recargaId"
      :active="true"
      :initial-id-guia-salida="initialIdGuiaSalida"
      :initial-id-guia-retorno="initialIdGuiaRetorno"
      @saved="goToList"
      @cancel="goToList"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import RecargaPlantaForm from '@/modules/balones/recargas/components/RecargaPlantaForm.vue'
import type { RecargaPlantaFormMode } from '@/modules/balones/recargas/interfaces/recarga-planta.interface'
import { balonesSectionBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppHelpTip } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const route = useRoute()
const router = useRouter()

const mode = computed<RecargaPlantaFormMode>(() =>
  route.name === 'admin-balones-recargas-planta-editar' ? 'edit' : 'create',
)

const recargaId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

function queryId(key: string) {
  const raw = route.query[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

const initialIdGuiaSalida = ref(queryId('idGuiaSalida'))
const initialIdGuiaRetorno = ref(queryId('idGuiaRetorno'))

onMounted(() => {
  if (!initialIdGuiaSalida.value && !initialIdGuiaRetorno.value) return
  const nextQuery = { ...route.query }
  delete nextQuery.idGuiaSalida
  delete nextQuery.idGuiaRetorno
  void router.replace({ query: nextQuery })
})

const pageTitle = computed(() =>
  mode.value === 'edit' ? 'Editar orden planta externa' : 'Nueva orden planta externa',
)

const pageHelpText = computed(() =>
  mode.value === 'edit'
    ? 'Registra retorno, lote, P.H. y vínculo a la compra del proveedor.'
    : 'Jalá la GRE de vacíos para armar el checklist y confirmar la salida a planta.',
)

const breadcrumbItems = computed(() =>
  balonesSectionBreadcrumbItems(
    'Recargas',
    '/admin/balones/recargas?tab=planta',
    pageTitle.value,
  ),
)

const goToList = () => {
  void router.push({ name: 'admin-balones-recargas', query: { tab: 'planta' } })
}
</script>

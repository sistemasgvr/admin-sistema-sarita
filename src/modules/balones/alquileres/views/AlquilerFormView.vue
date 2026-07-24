<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 space-y-2">
      <RouterLink
        :to="{ name: 'admin-balones-alquileres' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>
      <p v-if="!isEdit" class="text-sm text-gray-500 dark:text-gray-400">
        Primero se registra la cabecera; al crear, en esta misma pantalla podrás agregar los
        cilindros.
      </p>
    </div>

    <AlquilerForm
      :mode="mode"
      :alquiler-id="alquilerId"
      :active="true"
      @cancel="goToList"
      @created="onCreated"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import AlquilerForm, {
  type AlquilerFormSavedPayload,
} from '@/modules/balones/alquileres/components/AlquilerForm.vue'
import type { AlquilerFormMode } from '@/modules/balones/alquileres/interfaces/alquiler.interface'
import { balonesAlquileresBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.name === 'admin-balones-alquileres-editar')
const mode = computed<AlquilerFormMode>(() => (isEdit.value ? 'edit' : 'create'))

const alquilerId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const pageTitle = computed(() => (isEdit.value ? 'Editar alquiler' : 'Nuevo alquiler'))
const breadcrumbItems = computed(() => balonesAlquileresBreadcrumbItems(pageTitle.value))

const goToList = () => {
  router.push({ name: 'admin-balones-alquileres' })
}

const onCreated = (payload: AlquilerFormSavedPayload) => {
  router.replace({
    name: 'admin-balones-alquileres-editar',
    params: { id: String(payload.id) },
  })
}

/** Stay on page after header/detalle saves so cilindros can still be managed. */
const onSaved = (_payload?: AlquilerFormSavedPayload) => {
  // no-op: leave via Cancelar/Cerrar or back link
}
</script>

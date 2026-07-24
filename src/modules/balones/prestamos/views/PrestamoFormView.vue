<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 space-y-2">
      <RouterLink
        :to="{ name: 'admin-balones-prestamos' }"
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

    <PrestamoForm
      :mode="mode"
      :prestamo-id="prestamoId"
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
import PrestamoForm, {
  type PrestamoFormSavedPayload,
} from '@/modules/balones/prestamos/components/PrestamoForm.vue'
import type { PrestamoFormMode } from '@/modules/balones/prestamos/interfaces/prestamo.interface'
import { balonesPrestamosBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.name === 'admin-balones-prestamos-editar')
const mode = computed<PrestamoFormMode>(() => (isEdit.value ? 'edit' : 'create'))

const prestamoId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const pageTitle = computed(() => (isEdit.value ? 'Editar préstamo' : 'Nuevo préstamo'))
const breadcrumbItems = computed(() => balonesPrestamosBreadcrumbItems(pageTitle.value))

const goToList = () => {
  router.push({ name: 'admin-balones-prestamos' })
}

const onCreated = (payload: PrestamoFormSavedPayload) => {
  router.replace({
    name: 'admin-balones-prestamos-editar',
    params: { id: String(payload.id) },
  })
}

/** Stay on page after header/detalle saves so cilindros can still be managed. */
const onSaved = (_payload?: PrestamoFormSavedPayload) => {
  // no-op: leave via Cancelar/Cerrar or back link
}
</script>

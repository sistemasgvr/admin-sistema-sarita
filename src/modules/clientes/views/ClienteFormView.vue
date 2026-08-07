<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="{ name: 'admin-clientes' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>
      <AppHelpTip :text="pageHelpText" />
    </div>

    <ClienteForm
      :mode="isEdit ? 'edit' : 'create'"
      :cliente-id="clienteId"
      :active="true"
      :show-related-tabs="true"
      @saved="onSaved"
      @cancel="goToList"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ClienteForm from '@/modules/clientes/components/ClienteForm.vue'
import { clientesBreadcrumbItems } from '@/modules/clientes/config/clientes-breadcrumb'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppHelpTip } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.name === 'admin-clientes-editar')
const clienteId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : undefined
})

const pageTitle = computed(() => (isEdit.value ? 'Editar cliente' : 'Nuevo cliente'))
const pageHelpText =
  'Persona o empresa. El documento (DNI/RUC) se usa en ventas, GRE y alquileres/préstamos.'
const breadcrumbItems = computed(() => clientesBreadcrumbItems(pageTitle.value))

const goToList = () => {
  void router.push({ name: 'admin-clientes' })
}

const onSaved = (cliente: Cliente) => {
  if (!isEdit.value) {
    // Tras crear, abrir ficha para gestionar direcciones/contactos y relacionados.
    void router.replace({ name: 'admin-clientes-detalle', params: { id: String(cliente.id) } })
    return
  }
  void router.push({ name: 'admin-clientes-detalle', params: { id: String(cliente.id) } })
}
</script>

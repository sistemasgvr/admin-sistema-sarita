<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="{ name: 'admin-operativa-actividades' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>
    </div>

    <p class="mb-5 text-sm text-gray-500 dark:text-gray-400">
      {{ pageSubtitle }}
    </p>

    <ActividadForm
      :mode="mode"
      :actividad-id="actividadId"
      :default-fecha="defaultFecha"
      :lock-tipo-reparto="lockTipoReparto"
      :default-titulo="defaultTitulo"
      :default-cliente-id="defaultClienteId"
      :default-cliente-label="defaultClienteLabel"
      :default-id-doc-salida="defaultIdDocSalida"
      @saved="goToList"
      @cancel="goToList"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ActividadForm from '@/modules/operativa/actividades/components/ActividadForm.vue'
import type { ActividadFormMode } from '@/modules/operativa/actividades/interfaces/actividad.interface'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

const route = useRoute()
const router = useRouter()

const mode = computed<ActividadFormMode>(() =>
  route.name === 'admin-operativa-actividades-editar' ? 'edit' : 'create',
)

const actividadId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const defaultFecha = computed(() => {
  const v = route.query.fecha
  return typeof v === 'string' && v ? v : null
})

const defaultTitulo = computed(() => {
  const v = route.query.titulo
  return typeof v === 'string' && v ? v : null
})

const defaultClienteId = computed(() => {
  const raw = Number(route.query.clienteId)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const defaultClienteLabel = computed(() => {
  const v = route.query.clienteLabel
  return typeof v === 'string' && v ? v : null
})

const defaultIdDocSalida = computed(() => {
  const raw = Number(route.query.idDocSalida)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const lockTipoReparto = computed(
  () =>
    route.query.lockTipoReparto === '1' ||
    route.query.lockTipoReparto === 'true' ||
    Boolean(defaultIdDocSalida.value),
)

const pageTitle = computed(() => {
  if (mode.value === 'edit') return 'Editar actividad'
  return lockTipoReparto.value ? 'Nuevo reparto' : 'Nueva actividad'
})

const pageSubtitle = computed(() => {
  if (mode.value === 'edit') return 'Actualiza los datos de la actividad seleccionada.'
  if (lockTipoReparto.value) return 'Programa la entrega a partir de la orden de salida.'
  return 'Programa una actividad de la agenda operativa. Si eliges tipo REPARTO, selecciona una orden de salida disponible.'
})

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: 'Operativa' },
  { label: 'Actividades', to: '/admin/operativa/actividades' },
  { label: pageTitle.value },
])

const goToList = () => {
  void router.push({ name: 'admin-operativa-actividades' })
}
</script>

<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <RouterLink
        :to="{ name: 'admin-clientes' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>

      <div v-if="cliente && !esVarios" class="flex flex-wrap items-center gap-2">
        <button
          v-if="canEdit && cliente.estado === 1 && !cliente.estado_baja_aprobacion"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 dark:border-amber-500/40 dark:bg-gray-900 dark:text-amber-300 dark:hover:bg-amber-500/10"
          @click="bajaModalOpen = true"
        >
          <AppIcon :name="ICONS.archive" :size="16" />
          Solicitar baja
        </button>
        <button
          v-if="canSolicitarBaja && cliente.estado !== 1"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-success-300 bg-white px-3 py-2 text-sm font-medium text-success-700 transition hover:bg-success-50 dark:border-success-500/40 dark:bg-gray-900 dark:text-success-300 dark:hover:bg-success-500/10"
          @click="reactivacionModalOpen = true"
        >
          <AppIcon :name="ICONS.refreshCw" :size="16" />
          Solicitar reactivación
        </button>
        <RouterLink
          v-if="canEdit"
          :to="{ name: 'admin-clientes-editar', params: { id: String(cliente.id) } }"
          class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
          Editar datos
        </RouterLink>
      </div>
    </div>

    <div
      v-if="clienteQuery.isError.value"
      class="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
    >
      No se pudo cargar la ficha del cliente.
    </div>

    <DetailCardsLayout v-else :loading="isLoading" :sections="sections">
      <template #badges>
        <AppBadge v-if="esVarios" color="primary" size="sm">Sistema</AppBadge>
        <AppBadge :color="cliente?.estado === 1 ? 'success' : 'error'">
          {{ cliente?.estado === 1 ? 'Activo' : 'Inactivo' }}
        </AppBadge>
        <AppBadge v-if="cliente?.nombre_tipo_persona" color="neutral" size="sm">
          {{ formatListaOpcionLabel(cliente.nombre_tipo_persona) }}
        </AppBadge>
        <AppBadge v-if="cliente?.estado_baja_aprobacion" color="warning">
          Baja pendiente
        </AppBadge>
        <AppBadge v-if="cliente?.es_buen_contribuyente" color="success" size="sm" variant="light">
          Buen contribuyente
        </AppBadge>
        <AppBadge v-if="cliente?.es_agente_retenedor" color="warning" size="sm" variant="light">
          Agente retenedor
        </AppBadge>
        <AppBadge v-if="cliente?.es_agente_percepcion" color="warning" size="sm" variant="light">
          Agente percepción
        </AppBadge>
      </template>

      <template #extra>
        <div
          v-if="cliente?.estado_baja_aprobacion"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <p class="font-medium">Solicitud de baja pendiente de aprobación</p>
          <p v-if="cliente.motivo_baja_opciones" class="mt-1">
            Motivo: {{ formatListaOpcionLabel(cliente.motivo_baja_opciones) }}
          </p>
          <p v-if="cliente.motivo_baja_detalle" class="mt-1">
            Comentario: {{ cliente.motivo_baja_detalle }}
          </p>
        </div>

        <DetailSectionCard
          v-if="tieneCoords"
          title="Ubicación en mapa"
          :icon="ICONS.mapPin"
          :full-width="true"
        >
          <div class="overflow-hidden rounded-lg">
            <MapaLeaflet
              :latitud="cliente!.latitud"
              :longitud="cliente!.longitud"
              height="280px"
              :searchable="false"
              :draggable-marker="false"
            />
          </div>
        </DetailSectionCard>

        <div v-if="cliente && !esVarios" class="space-y-3">
          <div class="flex items-center gap-2">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
              Direcciones, contactos y relacionados
            </h3>
            <AppHelpTip
              text="Agrega o edita direcciones, contactos, choferes, vehículos y cuentas desde esta ficha."
            />
          </div>
          <ClienteRelatedTabs :id-cliente="cliente.id" />
        </div>
      </template>
    </DetailCardsLayout>

    <ClienteBajaModal
      v-model="bajaModalOpen"
      :cliente="cliente"
      @saved="onBajaSaved"
    />
    <ClienteReactivacionModal
      v-model="reactivacionModalOpen"
      :cliente="cliente"
      @saved="onReactivacionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import ClienteBajaModal from '@/modules/clientes/bajas-cliente/components/ClienteBajaModal.vue'
import ClienteReactivacionModal from '@/modules/clientes/bajas-cliente/components/ClienteReactivacionModal.vue'
import ClienteRelatedTabs from '@/modules/clientes/components/ClienteRelatedTabs.vue'
import { useClienteDetailQuery } from '@/modules/clientes/composables/useClienteDetailQuery'
import { clientesBreadcrumbItems } from '@/modules/clientes/config/clientes-breadcrumb'
import { getClienteNombrePrincipal } from '@/modules/clientes/utils/clienteNombre'
import { esClientesVarios } from '@/modules/clientes/utils/clientesVarios'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppHelpTip, MapaLeaflet } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatDateTime } from '@/shared/utils/date'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const route = useRoute()
const authStore = useAuthStore()

const clienteId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : undefined
})

const enabled = computed(() => Boolean(clienteId.value))
const clienteQuery = useClienteDetailQuery(clienteId, enabled)
const cliente = computed(() => clienteQuery.data.value ?? null)
const isLoading = computed(() => clienteQuery.isLoading.value || clienteQuery.isFetching.value)

const pageTitle = computed(() =>
  cliente.value ? getClienteNombrePrincipal(cliente.value) : 'Ficha de cliente',
)
const breadcrumbItems = computed(() => clientesBreadcrumbItems(pageTitle.value))

const esVarios = computed(() => (cliente.value ? esClientesVarios(cliente.value) : false))
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.CLIENTES_EDITAR))
const canSolicitarBaja = computed(() =>
  authStore.hasPermission(PermisoBanderas.BAJAS_CLIENTE_SOLICITAR),
)

const tieneCoords = computed(
  () =>
    cliente.value?.latitud != null &&
    cliente.value?.longitud != null &&
    Number.isFinite(cliente.value.latitud) &&
    Number.isFinite(cliente.value.longitud),
)

const bajaModalOpen = ref(false)
const reactivacionModalOpen = ref(false)

const onBajaSaved = () => {
  void clienteQuery.refetch()
}
const onReactivacionSaved = () => {
  void clienteQuery.refetch()
}

const formatId = (id?: number | null) => (id ? `#${id}` : null)

const sections = computed<DetailSection[]>(() => {
  const c = cliente.value
  if (!c) return []

  const nombreCompleto = [c.nombres, c.apellido_paterno, c.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  const generales = [
    { label: 'Código interno', value: c.codigo_interno || '—' },
    ...(c.razon_social ? [{ label: 'Razón social', value: c.razon_social }] : []),
    ...(c.nombre_comercial ? [{ label: 'Nombre comercial', value: c.nombre_comercial }] : []),
    ...(nombreCompleto ? [{ label: 'Nombre completo', value: nombreCompleto }] : []),
    {
      label: 'Documento',
      value: `${formatListaOpcionLabel(c.nombre_tipo_documento) || 'Doc.'} ${c.numero_documento || '—'}`,
    },
    {
      label: 'Tipo de cliente',
      value: formatListaOpcionLabel(c.nombre_tipo_cliente) || '—',
    },
  ]

  const contacto = [
    { label: 'Teléfono', value: c.telefono || '—' },
    { label: 'Correo', value: c.email || '—' },
    { label: 'Dirección principal', value: c.direccion || '—', fullWidth: true },
    { label: 'Referencia', value: c.referencia || '—', fullWidth: true },
    { label: 'País', value: c.nombre_pais ?? formatId(c.id_pais) ?? '—' },
    {
      label: 'Departamento',
      value: c.nombre_departamento ?? formatId(c.id_departamento) ?? '—',
    },
    { label: 'Provincia', value: c.nombre_provincia ?? formatId(c.id_provincia) ?? '—' },
    { label: 'Distrito', value: c.nombre_distrito ?? formatId(c.id_distrito) ?? '—' },
  ]

  const result: DetailSection[] = [
    { title: 'Datos generales', icon: ICONS.building2, items: generales },
    { title: 'Contacto y ubicación', icon: ICONS.mapPin, items: contacto },
  ]

  if (c.observacion) {
    result.push({
      title: 'Observación',
      icon: ICONS.fileText,
      fullWidth: true,
      items: [{ label: 'Nota', value: c.observacion, fullWidth: true }],
    })
  }

  result.push({
    title: 'Auditoría',
    icon: ICONS.history,
    items: [
      { label: 'Creado por', value: c.nombre_usuario_creacion || '—' },
      { label: 'Fecha de creación', value: formatDateTime(c.fecha_creacion) || '—' },
      { label: 'Modificado por', value: c.nombre_usuario_modificacion || '—' },
      { label: 'Última modificación', value: formatDateTime(c.fecha_modificacion) || '—' },
    ],
  })

  return result
})
</script>

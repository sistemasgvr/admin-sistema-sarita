<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <RouterLink
          :to="{ name: 'admin-balones-movimientos' }"
          class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
        >
          <AppIcon :name="ICONS.chevronLeft" :size="16" />
          Volver al listado
        </RouterLink>
        <AppHelpTip :text="pageHelpText" />
      </div>

      <RouterLink
        v-if="canEdit && movimiento"
        :to="{ name: 'admin-balones-movimientos-editar', params: { id: String(movimiento.id) } }"
        class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
      >
        <AppIcon :name="ICONS.pencil" :size="16" />
        Editar
      </RouterLink>
    </div>

    <div
      v-if="movimientoQuery.isError.value"
      class="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
    >
      No se pudo cargar el detalle del movimiento.
    </div>

    <DetailCardsLayout v-else :loading="isLoading" :sections="sections">
      <template #badges>
        <ListaOpcionBadge
          v-if="movimiento?.nombre_tipo_movimiento"
          :value="movimiento.nombre_tipo_movimiento"
        />
      </template>

      <template #extra>
        <BalonFichaResumen
          :balon="balon"
          :codigo-fallback="movimiento?.codigo_balon"
          :snapshot="fichaSnapshot"
        />

        <DetailSectionCard
          v-if="movimiento?.observacion"
          title="Observación"
          :icon="ICONS.messageSquare"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ movimiento.observacion }}</p>
        </DetailSectionCard>
      </template>
    </DetailCardsLayout>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import BalonFichaResumen from '@/modules/balones/components/BalonFichaResumen.vue'
import { useBalonQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { useMovimientoBalonQuery } from '@/modules/balones/movimientos/composables/useMovimientosBalonQuery'
import { balonesMovimientosBreadcrumbItems } from '@/modules/balones/config/balones-breadcrumb'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import {
  formatDetailDate,
  formatDetailDateTime,
  formatDetailListaOpcion,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { AppHelpTip, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'

const route = useRoute()
const authStore = useAuthStore()

const movimientoId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const movimientoQuery = useMovimientoBalonQuery(movimientoId)
const movimiento = computed(() => movimientoQuery.data.value ?? null)
const isLoading = computed(
  () => movimientoQuery.isLoading.value || movimientoQuery.isFetching.value,
)

const balonId = computed(() => movimiento.value?.id_balon ?? null)
const balonQuery = useBalonQuery(balonId)
const balon = computed(() => balonQuery.data.value ?? null)

const fichaSnapshot = computed(() => {
  const data = movimiento.value
  if (!data) return null
  return {
    nombre_estado_balon: data.nombre_estado_balon,
    nombre_almacen_ubicacion: data.nombre_almacen_ubicacion,
    nombre_cliente_ubicacion: data.nombre_cliente_ubicacion,
  }
})

const canEdit = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_BALON_EDITAR),
)

const pageTitle = computed(() =>
  movimiento.value?.codigo_balon
    ? `Movimiento · ${movimiento.value.codigo_balon}`
    : 'Detalle del movimiento',
)
const pageHelpText =
  'Historial de un cilindro: tipo de movimiento, documento vinculado y ficha del envase al momento del movimiento.'
const breadcrumbItems = computed(() => balonesMovimientosBreadcrumbItems(pageTitle.value))

const sections = computed<DetailSection[]>(() => {
  const data = movimiento.value
  if (!data) return []

  const movimientoItems = [
    { label: 'Fecha', value: formatDetailDateTime(data.fecha_movimiento) },
    { label: 'Cliente / proveedor', value: data.nombre_cliente },
    { label: 'Almacén origen', value: data.nombre_almacen_origen },
    { label: 'Almacén destino', value: data.nombre_almacen_destino },
  ]

  const sectionsList: DetailSection[] = [
    {
      title: 'Movimiento',
      icon: ICONS.arrowLeftRight,
      items: movimientoItems,
    },
  ]

  if (data.id_documento_ref) {
    sectionsList.push({
      title: 'Documento',
      icon: ICONS.fileKey,
      items: [
        {
          label: 'Tipo',
          value: formatDetailListaOpcion(data.nombre_tipo_documento_ref),
        },
        { label: 'Número', value: data.documento_numero },
        { label: 'Fecha', value: formatDetailDate(data.documento_fecha) },
        { label: 'Cliente', value: data.documento_cliente },
        { label: 'Lote', value: data.documento_lote },
        { label: 'Detalle', value: data.documento_detalle, fullWidth: true },
      ],
    })
  }

  sectionsList.push({
    title: 'Auditoría',
    icon: ICONS.userCircle,
    items: [
      { label: 'Creado por', value: data.nombre_usuario_creacion },
      { label: 'Modificado por', value: data.nombre_usuario_modificacion },
      { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
      {
        label: 'Última modificación',
        value: formatDetailDateTime(data.fecha_modificacion),
      },
    ],
  })

  return sectionsList
})
</script>

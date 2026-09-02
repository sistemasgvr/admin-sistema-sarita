<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5">
      <RouterLink
        :to="{ name: 'admin-balones-cilindros' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al libro
      </RouterLink>
    </div>

    <div
      v-if="balonQuery.isError.value"
      class="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
    >
      No se pudo cargar la ficha del cilindro.
    </div>

    <DetailCardsLayout v-else :loading="isLoading" :sections="sections">
      <template #badges>
        <BalonEstadoBadge v-if="balon" :balon="balon" size="md" />
        <AppBadge v-if="balon?.estado_ph" :color="phBadgeColor">
          PH {{ phBadgeLabel }}
        </AppBadge>
        <AppBadge v-if="alertaPsiBajo" color="warning">PSI bajo / vacío</AppBadge>
      </template>

      <template #extra>
        <div
          v-if="alertaPsiBajo"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          Presión actual
          <strong>{{ Number(balon?.presion_actual) }} PSI</strong>
          por debajo del mínimo útil
          (<strong>{{ psiMinimoUtil }} PSI</strong>). Considerar envío a planta de llenado.
        </div>

        <div
          v-if="balon?.tiene_solicitud_baja_pendiente"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          Este cilindro tiene una <strong>solicitud de baja pendiente</strong> de aprobación por un
          administrador en la pestaña <strong>Aprobar bajas</strong>.
        </div>

        <DetailSectionCard
          v-if="balon?.baja"
          title="Baja vigente"
          :icon="ICONS.archive"
          :full-width="true"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium text-gray-800 dark:text-white/90">Motivo:</span>
              {{ balon.baja.nombre_motivo_baja }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium text-gray-800 dark:text-white/90">Fecha:</span>
              {{ formatDetailDate(balon.baja.fecha_baja) }}
            </p>
            <p
              v-if="balon.baja.nombre_cliente_comprador"
              class="text-sm text-gray-600 dark:text-gray-400"
            >
              <span class="font-medium text-gray-800 dark:text-white/90">Comprador:</span>
              {{ balon.baja.nombre_cliente_comprador }}
            </p>
            <p
              v-if="balon.baja.serie_comprobante || balon.baja.numero_comprobante"
              class="text-sm text-gray-600 dark:text-gray-400"
            >
              <span class="font-medium text-gray-800 dark:text-white/90">Comprobante:</span>
              {{
                [balon.baja.serie_comprobante, balon.baja.numero_comprobante]
                  .filter(Boolean)
                  .join('-')
              }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium text-gray-800 dark:text-white/90">Autorizó:</span>
              {{ balon.baja.nombre_usuario_autoriza }}
            </p>
            <p
              v-if="balon.baja.motivo_detalle"
              class="sm:col-span-2 text-sm text-gray-600 dark:text-gray-400"
            >
              {{ balon.baja.motivo_detalle }}
            </p>
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="Historial de movimientos"
          :icon="ICONS.history"
          :full-width="true"
        >
          <template #actions>
            <RouterLink
              to="/admin/inventario/movimientos?naturaleza=BALON"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              <AppIcon :name="ICONS.list" :size="14" />
              Movimientos
            </RouterLink>
          </template>
          <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Salidas, entradas y recargas (incl. planta externa) registradas para este cilindro.
          </p>
          <div
            v-if="movimientoHistorialRows.length"
            class="custom-scrollbar max-h-72 overflow-auto"
          >
            <table class="min-w-full text-sm">
              <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
                <tr
                  class="border-b border-gray-100 text-left text-theme-xs uppercase text-gray-500 dark:border-gray-800"
                >
                  <th class="pb-2 pr-4">Fecha</th>
                  <th class="pb-2 pr-4">Tipo</th>
                  <th class="pb-2 pr-4">Origen / destino</th>
                  <th class="pb-2 pr-4">Cliente</th>
                  <th class="pb-2">Glosa</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in movimientoHistorialRows"
                  :key="item.id"
                  class="border-b border-gray-50 dark:border-gray-800/80"
                >
                  <td class="py-2 pr-4 whitespace-nowrap">
                    {{ formatDetailDateTime(item.fecha) }}
                  </td>
                  <td class="py-2 pr-4 whitespace-nowrap">
                    <ListaOpcionBadge
                      v-if="item.nombre_tipo_movimiento"
                      :value="item.nombre_tipo_movimiento"
                    />
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="py-2 pr-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {{ item.nombre_almacen_origen || '—' }}
                    <span class="text-gray-400">/</span>
                    {{ item.nombre_almacen_destino || '—' }}
                  </td>
                  <td
                    class="py-2 pr-4 max-w-[10rem] truncate"
                    :title="item.nombre_cliente || undefined"
                  >
                    {{ item.nombre_cliente || '—' }}
                  </td>
                  <td class="py-2 max-w-[14rem] truncate" :title="item.glosa || undefined">
                    {{ item.glosa || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-gray-400">Sin movimientos registrados.</p>
        </DetailSectionCard>

        <DetailSectionCard
          title="Historial de préstamos"
          :icon="ICONS.arrowLeftRight"
          :full-width="true"
        >
          <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Custodia del envase (comodato / garantía). El cilindro se presta; no se alquila.
          </p>
          <div
            v-if="prestamoHistorialRows.length"
            class="custom-scrollbar max-h-72 overflow-auto"
          >
            <table class="min-w-full text-sm">
              <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
                <tr
                  class="border-b border-gray-100 text-left text-theme-xs uppercase text-gray-500 dark:border-gray-800"
                >
                  <th class="pb-2 pr-4">N° préstamo</th>
                  <th class="pb-2 pr-4">Tipo</th>
                  <th class="pb-2 pr-4">Cliente</th>
                  <th class="pb-2 pr-4">Préstamo</th>
                  <th class="pb-2 pr-4">Vence</th>
                  <th class="pb-2 pr-4">Devolución</th>
                  <th class="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in prestamoHistorialRows"
                  :key="item.id"
                  class="border-b border-gray-50 dark:border-gray-800/80"
                >
                  <td class="py-2 pr-4 whitespace-nowrap font-medium text-gray-800 dark:text-white/90">
                    {{ item.numero_prestamo || `#${item.id_prestamo}` }}
                  </td>
                  <td class="py-2 pr-4 whitespace-nowrap">
                    {{ formatDetailListaOpcion(item.nombre_tipo_prestamo) || '—' }}
                  </td>
                  <td
                    class="py-2 pr-4 max-w-[10rem] truncate"
                    :title="item.nombre_cliente || undefined"
                  >
                    {{ item.nombre_cliente || '—' }}
                  </td>
                  <td class="py-2 pr-4 whitespace-nowrap">
                    {{ formatDetailDate(item.fecha_prestamo) || '—' }}
                  </td>
                  <td class="py-2 pr-4 whitespace-nowrap">
                    {{ formatDetailDate(item.fecha_vencimiento) || '—' }}
                  </td>
                  <td class="py-2 pr-4 whitespace-nowrap">
                    {{ formatDetailDate(item.fecha_devolucion) || '—' }}
                  </td>
                  <td class="py-2 whitespace-nowrap">
                    <ListaOpcionBadge
                      v-if="item.nombre_estado"
                      :value="item.nombre_estado"
                    />
                    <span v-else class="text-gray-400">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-gray-400">Sin préstamos registrados.</p>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="alquilerHistorialRows.length"
          title="Alquiler de regulador (legado)"
          :icon="ICONS.receipt"
          :full-width="true"
        >
          <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Vínculos antiguos donde el cilindro figuraba en un detalle de alquiler. Hoy el regulador
            se alquila aparte y el envase va por préstamo.
          </p>
          <div class="custom-scrollbar max-h-72 overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
                <tr
                  class="border-b border-gray-100 text-left text-theme-xs uppercase text-gray-500 dark:border-gray-800"
                >
                  <th class="pb-2 pr-4">N° alquiler</th>
                  <th class="pb-2 pr-4">Cliente</th>
                  <th class="pb-2 pr-4">Inicio</th>
                  <th class="pb-2 pr-4">Fin pactado</th>
                  <th class="pb-2 pr-4">Fin real</th>
                  <th class="pb-2 pr-4">Tarifa/día</th>
                  <th class="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in alquilerHistorialRows"
                  :key="item.id"
                  class="border-b border-gray-50 dark:border-gray-800/80"
                >
                  <td class="py-2 pr-4 whitespace-nowrap font-medium text-gray-800 dark:text-white/90">
                    {{ item.numero_alquiler || `#${item.id_alquiler}` }}
                  </td>
                  <td
                    class="py-2 pr-4 max-w-[10rem] truncate"
                    :title="item.nombre_cliente || undefined"
                  >
                    {{ item.nombre_cliente || '—' }}
                  </td>
                  <td class="py-2 pr-4 whitespace-nowrap">
                    {{ formatDetailDate(item.fecha_inicio) || '—' }}
                  </td>
                  <td class="py-2 pr-4 whitespace-nowrap">
                    {{ formatDetailDate(item.fecha_fin_pactada) || '—' }}
                  </td>
                  <td class="py-2 pr-4 whitespace-nowrap">
                    {{ formatDetailDate(item.fecha_fin_real) || '—' }}
                  </td>
                  <td class="py-2 pr-4 whitespace-nowrap">
                    {{ formatDetailMoney(item.tarifa_diaria) || '—' }}
                  </td>
                  <td class="py-2 whitespace-nowrap">
                    <ListaOpcionBadge
                      v-if="item.nombre_estado"
                      :value="item.nombre_estado"
                    />
                    <span v-else class="text-gray-400">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="Historial de baja y activación"
          :icon="ICONS.refreshCw"
          :full-width="true"
        >
          <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Registro de solicitudes, aprobaciones, rechazos y reactivaciones del cilindro.
          </p>
          <div
            v-if="estadoHistorialRows.length"
            class="custom-scrollbar max-h-72 overflow-auto"
          >
            <table class="min-w-full text-sm">
              <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
                <tr
                  class="border-b border-gray-100 text-left text-theme-xs uppercase text-gray-500 dark:border-gray-800"
                >
                  <th class="pb-2 pr-4">Fecha</th>
                  <th class="pb-2 pr-4">Evento</th>
                  <th class="pb-2 pr-4">Motivo</th>
                  <th class="pb-2 pr-4">Estado</th>
                  <th class="pb-2 pr-4">Usuario</th>
                  <th class="pb-2">Observación</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in estadoHistorialRows"
                  :key="item.id"
                  class="border-b border-gray-50 dark:border-gray-800/80"
                >
                  <td class="py-2 pr-4 whitespace-nowrap">
                    {{ formatDetailDateTime(item.fecha_evento) }}
                  </td>
                  <td class="py-2 pr-4 whitespace-nowrap">
                    <AppBadge :color="eventoBadgeColor(item.tipo_evento)">
                      {{ item.nombre_tipo_evento || item.tipo_evento }}
                    </AppBadge>
                  </td>
                  <td class="py-2 pr-4">
                    {{ formatDetailListaOpcion(item.nombre_motivo_baja) || '—' }}
                  </td>
                  <td class="py-2 pr-4">
                    <div
                      v-if="item.nombre_estado_anterior || item.nombre_estado_nuevo"
                      class="inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>{{ formatDetailListaOpcion(item.nombre_estado_anterior) || '—' }}</span>
                      <AppIcon
                        :name="ICONS.chevronRight"
                        :size="14"
                        class="shrink-0 text-gray-400 dark:text-gray-500"
                      />
                      <span>{{ formatDetailListaOpcion(item.nombre_estado_nuevo) || '—' }}</span>
                    </div>
                    <template v-else>—</template>
                  </td>
                  <td class="py-2 pr-4">{{ item.nombre_usuario || '—' }}</td>
                  <td class="py-2 max-w-[14rem] truncate" :title="item.observacion || undefined">
                    {{ item.observacion || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-gray-400">Sin eventos de baja o reactivación.</p>
        </DetailSectionCard>

        <DetailSectionCard
          title="Historial de pruebas hidrostáticas"
          :icon="ICONS.history"
          :full-width="true"
        >
          <template #actions>
            <RouterLink
              to="/admin/balones/mantenimientos"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              <AppIcon :name="ICONS.construction" :size="14" />
              Mantenimientos
            </RouterLink>
          </template>

          <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Las renovaciones se registran con tipo <strong>Prueba hidrostática</strong> o
            <strong>Recertificación</strong> y fecha de salida.
          </p>
          <div
            v-if="phHistorialRows.length"
            class="custom-scrollbar max-h-72 overflow-auto"
          >
            <table class="min-w-full text-sm">
              <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
                <tr
                  class="border-b border-gray-100 text-left text-theme-xs uppercase text-gray-500 dark:border-gray-800"
                >
                  <th class="pb-2 pr-4">Prueba</th>
                  <th class="pb-2 pr-4">Vigencia</th>
                  <th class="pb-2 pr-4">Próxima</th>
                  <th class="pb-2 pr-4">Órgano</th>
                  <th class="pb-2 pr-4">Certificado</th>
                  <th class="pb-2">Observación</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in phHistorialRows"
                  :key="item.id"
                  class="border-b border-gray-50 dark:border-gray-800/80"
                >
                  <td class="py-2 pr-4 whitespace-nowrap">{{ formatMonthYear(item.fecha_prueba) }}</td>
                  <td class="py-2 pr-4">{{ item.vigencia_anios }} años</td>
                  <td class="py-2 pr-4 whitespace-nowrap">
                    {{ formatMonthYear(item.fecha_proxima) }}
                  </td>
                  <td class="py-2 pr-4">
                    {{
                      item.organo_inspector_no_aplica
                        ? 'No aplica'
                        : item.nombre_organo_inspector || '—'
                    }}
                  </td>
                  <td class="py-2 pr-4">{{ item.numero_certificado || '—' }}</td>
                  <td class="py-2 max-w-[14rem] truncate" :title="item.observacion || undefined">
                    {{ item.observacion || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-gray-400">Sin renovaciones registradas.</p>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="balon?.observacion"
          title="Observación"
          :icon="ICONS.messageSquare"
          :full-width="true"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ balon.observacion }}</p>
        </DetailSectionCard>
      </template>
    </DetailCardsLayout>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useRoute } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import BalonEstadoBadge from '@/modules/balones/components/BalonEstadoBadge.vue'
import { BALONES_HUB_PATH } from '@/modules/balones/config/balones-breadcrumb'
import { useAlquileresDetalleQuery } from '@/modules/balones/alquileres/composables/useAlquileresDetalleQuery'
import {
  useBalonQuery,
  useEstadoHistorialQuery,
  usePhHistorialQuery,
} from '@/modules/balones/cilindros/composables/useBalonesQuery'
import type { TipoEventoEstadoBalon } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { useInventarioMovimientosQuery } from '@/modules/inventario/composables/useInventarioMovimientosQuery'
import { usePrestamosDetalleQuery } from '@/modules/balones/prestamos/composables/usePrestamosDetalleQuery'
import { formatMonthYear } from '@/modules/balones/utils/formatMonthYear'
import { useEmpresaActualQuery } from '@/modules/configuracion/empresas/composables/useEmpresaActualQuery'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import {
  formatDetailDate,
  formatDetailDateTime,
  formatDetailListaOpcion,
  formatDetailMoney,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { AppBadge, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'
import type { BreadcrumbItem } from '@/shared/interfaces/breadcrumb.interface'

const route = useRoute()

const balonIdRef = toRef(() => {
  const raw = route.params.id
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(id) && id > 0 ? id : null
})

const balonQuery = useBalonQuery(balonIdRef)
const phHistorialQuery = usePhHistorialQuery(balonIdRef)
const estadoHistorialQuery = useEstadoHistorialQuery(balonIdRef)
const empresaQuery = useEmpresaActualQuery()

const movimientosFilters = computed(() => ({
  naturaleza: 'BALON' as const,
  idBalon: balonIdRef.value ?? undefined,
  pagina: 1,
  limite: 50,
}))
const prestamosFilters = computed(() => ({
  idBalon: balonIdRef.value ?? undefined,
  pagina: 1,
  limite: 50,
}))
const alquileresFilters = computed(() => ({
  idBalon: balonIdRef.value ?? undefined,
  pagina: 1,
  limite: 50,
}))
const movimientosHistorialQuery = useInventarioMovimientosQuery(movimientosFilters)
const prestamosHistorialQuery = usePrestamosDetalleQuery(prestamosFilters)
const alquileresHistorialQuery = useAlquileresDetalleQuery(alquileresFilters)

const isLoading = computed(
  () =>
    balonQuery.isFetching.value ||
    phHistorialQuery.isFetching.value ||
    estadoHistorialQuery.isFetching.value ||
    movimientosHistorialQuery.isFetching.value ||
    prestamosHistorialQuery.isFetching.value ||
    alquileresHistorialQuery.isFetching.value,
)

const balon = computed(() => balonQuery.data.value ?? null)

const psiMinimoUtil = computed(() => {
  const raw = empresaQuery.data.value?.psi_minimo_util
  const n = raw != null ? Number(raw) : 100
  return Number.isFinite(n) ? n : 100
})

const alertaPsiBajo = computed(() => {
  const psi = balon.value?.presion_actual
  if (psi == null) return false
  return Number(psi) < psiMinimoUtil.value
})

const phHistorialRows = computed(() => phHistorialQuery.data.value?.data ?? [])
const estadoHistorialRows = computed(() => estadoHistorialQuery.data.value?.data ?? [])
const movimientoHistorialRows = computed(() => movimientosHistorialQuery.data.value?.data ?? [])
const prestamoHistorialRows = computed(() => prestamosHistorialQuery.data.value?.data ?? [])
const alquilerHistorialRows = computed(() => alquileresHistorialQuery.data.value?.data ?? [])

const pageTitle = computed(() => balon.value?.codigo_balon || 'Ficha del cilindro')

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { label: 'Balones', to: BALONES_HUB_PATH },
  { label: 'Libro de cilindros', to: '/admin/balones/cilindros' },
  { label: 'Ficha' },
])

const serieDistinta = computed(() => {
  const codigo = balon.value?.codigo_balon?.trim()
  const serie = balon.value?.numero_serie?.trim()
  return Boolean(serie && serie !== codigo)
})

const phBadgeLabel = computed(() => {
  const estado = balon.value?.estado_ph
  if (estado === 'VENCIDA') return 'vencida'
  if (estado === 'POR_VENCER') return 'por vencer'
  return 'vigente'
})

const phBadgeColor = computed((): BadgeColor => {
  const estado = balon.value?.estado_ph
  if (estado === 'VENCIDA') return 'error'
  if (estado === 'POR_VENCER') return 'warning'
  return 'success'
})

const eventoBadgeColor = (tipo: TipoEventoEstadoBalon | string): BadgeColor => {
  if (tipo === 'BAJA_APROBADA') return 'error'
  if (tipo === 'BAJA_RECHAZADA') return 'warning'
  if (tipo === 'REACTIVACION') return 'success'
  return 'neutral'
}

const sections = computed<DetailSection[]>(() => {
  const data = balon.value
  if (!data) return []

  return [
    {
      title: 'Identificación',
      icon: ICONS.idCard,
      items: [
        ...(serieDistinta.value
          ? [{ label: 'N° serie', value: data.numero_serie }]
          : []),
        { label: 'Marca', value: data.nombre_marca_cilindro },
        { label: 'Tipo de válvula', value: data.tipo_valvula },
        { label: 'Tipo de balón', value: data.nombre_tipo_balon },
        { label: 'Gas', value: data.nombre_producto_gas },
        {
          label: 'Capacidad',
          value:
            data.capacidad != null
              ? `${data.capacidad}${data.nombre_unidad_medida ? ` ${data.nombre_unidad_medida}` : ''}`
              : undefined,
        },
        {
          label: 'Peso aproximado',
          value:
            data.peso_aproximado_kg != null
              ? `${Number(data.peso_aproximado_kg)} kg`
              : undefined,
        },
        {
          label: 'Peso del tipo',
          value:
            data.peso_tipo_balon != null ? `${Number(data.peso_tipo_balon)} kg` : undefined,
        },
        { label: 'Libro', value: data.libro_cilindro },
        { label: 'Página', value: data.pagina_libro?.toString() },
        { label: 'Fecha registro', value: formatDetailDate(data.fecha_registro) },
        { label: 'N° recepción', value: data.numero_recepcion },
      ],
    },
    {
      title: 'Ubicación y propiedad',
      icon: ICONS.mapPin,
      items: [
        { label: 'Propietario', value: formatDetailListaOpcion(data.nombre_propietario) },
        ...(data.nombre_planta
          ? [{ label: 'Proveedor (planta)', value: data.nombre_planta }]
          : []),
        { label: 'Referencia', value: formatDetailListaOpcion(data.nombre_referencia) },
        { label: 'Almacén', value: data.nombre_almacen },
        { label: 'Cliente ubicación', value: data.nombre_cliente_ubicacion },
        { label: 'Cliente propietario', value: data.nombre_cliente_propietario },
      ],
    },
    {
      title: 'Prueba hidrostática',
      icon: ICONS.gauge,
      items: [
        {
          label: 'Fabricación (lomo)',
          value: formatMonthYear(
            data.fecha_fabricacion,
            data.mes_fabricacion,
            data.anio_fabricacion,
          ),
        },
        { label: 'Última P.H.', value: formatMonthYear(data.fecha_ultima_prueba_hidrostatica) },
        {
          label: 'Vigencia',
          value: data.vigencia_prueba_hidrostatica_anios
            ? `${data.vigencia_prueba_hidrostatica_anios} años`
            : undefined,
        },
        { label: 'Próxima P.H.', value: formatMonthYear(data.fecha_proxima_prueba_hidrostatica) },
        {
          label: 'Órgano inspector',
          value: data.organo_inspector_no_aplica
            ? 'No aplica'
            : data.nombre_organo_inspector,
        },
        { label: 'Sello de inspección', value: data.sello_inspeccion },
        {
          label: 'Presión actual',
          value:
            data.presion_actual != null
              ? `${Number(data.presion_actual)} PSI`
              : undefined,
        },
      ],
    },
    {
      title: 'Auditoría',
      icon: ICONS.userCircle,
      items: [
        { label: 'Creado por', value: data.nombre_usuario_creacion },
        { label: 'Modificado por', value: data.nombre_usuario_modificacion },
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>

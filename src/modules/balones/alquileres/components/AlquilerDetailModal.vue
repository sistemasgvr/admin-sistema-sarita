<template>
  <AppModal
    v-model="open"
    title="Detalle del alquiler"
    :subtitle="alquiler?.numero_alquiler"
    size="xl"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <ListaOpcionBadge v-if="alquiler?.nombre_estado" :value="alquiler.nombre_estado" />
        <AppBadge color="neutral">{{ detalleRows.length }} cilindros</AppBadge>
        <AppBadge color="primary">{{ periodoRows.length }} periodos</AppBadge>
      </template>

      <template #extra>
        <DetailSectionCard
          title="Periodos / renovaciones"
          :icon="ICONS.calendar"
          :full-width="true"
          help="Periodo 1 = kit inicial (línea regulador). Los siguientes son renovaciones quincenales."
        >
          <template #actions>
            <button
              v-if="canRenovar"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
              @click="renovarOpen = true"
            >
              <AppIcon :name="ICONS.refreshCw" :size="14" />
              Renovar regulador
            </button>
          </template>

          <div
            v-if="!periodoRows.length"
            class="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            Sin periodos registrados.
          </div>
          <AppTable
            v-else
            bare
            :columns="periodoColumns"
            :rows="periodoRows"
            row-key="id"
          >
            <template #cell-monto="{ value }">
              {{ formatDetailMoney(value as number) }}
            </template>
            <template #cell-fecha_inicio="{ value }">
              {{ formatDetailDate(value as string) }}
            </template>
            <template #cell-fecha_fin="{ value }">
              {{ formatDetailDate(value as string) }}
            </template>
          </AppTable>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="detalleRows.length"
          title="Cilindros vinculados"
          :icon="ICONS.boxes"
          :full-width="true"
        >
          <AppTable bare :columns="detalleColumns" :rows="detalleRows" row-key="id">
            <template #cell-fecha_devolucion="{ row }">
              <span
                v-if="row.fecha_devolucion"
                class="whitespace-nowrap text-success-600 dark:text-success-400"
              >
                {{ String(row.fecha_devolucion).slice(0, 10) }}
              </span>
              <AppBadge v-else size="sm" color="warning">Pendiente</AppBadge>
            </template>
          </AppTable>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="alquiler?.observacion"
          title="Observación"
          :icon="ICONS.messageSquare"
          :full-width="true"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ alquiler.observacion }}</p>
        </DetailSectionCard>
      </template>
    </DetailCardsLayout>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="open = false"
      >
        Cerrar
      </button>
    </template>

    <AlquilerRenovarModal
      v-model="renovarOpen"
      :alquiler="alquiler"
      @saved="onRenovado"
    />
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import AlquilerRenovarModal from '@/modules/balones/alquileres/components/AlquilerRenovarModal.vue'
import { useAlquilerQuery } from '@/modules/balones/alquileres/composables/useAlquileresQuery'
import { useAlquileresDetalleQuery } from '@/modules/balones/alquileres/composables/useAlquileresDetalleQuery'
import type { AlquilerDetalleListFilters } from '@/modules/balones/alquileres/interfaces/alquiler-detalle.interface'
import { alquileresService } from '@/modules/balones/alquileres/services/alquileres.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import {
  formatDetailDate,
  formatDetailDateTime,
  formatDetailDocument,
  formatDetailListaOpcion,
  formatDetailMoney,
} from '@/shared/components/detail/detailFormatters'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppBadge, AppModal, AppTable, ListaOpcionBadge } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const props = defineProps<{ alquilerId?: number | null }>()
const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const renovarOpen = ref(false)

const alquilerIdRef = toRef(() => props.alquilerId)
const alquilerQuery = useAlquilerQuery(alquilerIdRef)

const detalleFilters = ref<AlquilerDetalleListFilters>({ pagina: 1, limite: 100 })
const detallesQuery = useAlquileresDetalleQuery(detalleFilters)

const periodosQuery = useQuery({
  queryKey: computed(() => ['balones', 'alquileres', 'periodos', props.alquilerId]),
  enabled: computed(() => open.value && Boolean(props.alquilerId)),
  queryFn: () =>
    alquileresService.listarPeriodos(Number(props.alquilerId), { pagina: 1, limite: 100 }),
})

const isLoading = computed(
  () => alquilerQuery.isFetching.value || periodosQuery.isFetching.value,
)
const alquiler = computed(() => alquilerQuery.data.value ?? null)
const detalleRows = computed(() => detallesQuery.data.value?.data ?? [])
const periodoRows = computed(() => periodosQuery.data.value?.data ?? [])

const canRenovar = computed(
  () =>
    authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_EDITAR) &&
    Boolean(alquiler.value?.id_producto_regulador),
)

const detalleColumns: TableColumn[] = [
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'fecha_devolucion', label: 'Devolución' },
]

const periodoColumns: TableColumn[] = [
  { key: 'numero_periodo', label: '#' },
  { key: 'nombre_producto', label: 'Producto' },
  { key: 'fecha_inicio', label: 'Inicio' },
  { key: 'fecha_fin', label: 'Fin' },
  { key: 'monto', label: 'Monto' },
  { key: 'comprobante', label: 'Comprobante' },
  { key: 'nombre_estado', label: 'Estado' },
]

watch(
  () => [open.value, props.alquilerId] as const,
  ([isOpen, id]) => {
    if (isOpen && id) {
      detalleFilters.value = { idAlquiler: id, pagina: 1, limite: 100 }
    }
  },
  { immediate: true },
)

async function onRenovado() {
  await Promise.all([alquilerQuery.refetch(), periodosQuery.refetch()])
}

const sections = computed<DetailSection[]>(() => {
  const data = alquiler.value
  if (!data) return []

  return [
    {
      title: 'Datos del alquiler',
      icon: ICONS.clipboardList,
      items: [
        { label: 'Número', value: data.numero_alquiler },
        { label: 'Cliente', value: data.nombre_cliente },
        { label: 'Almacén', value: data.nombre_almacen },
        { label: 'Estado', value: formatDetailListaOpcion(data.nombre_estado) },
      ],
    },
    {
      title: 'Regulador (contrato)',
      icon: ICONS.gauge,
      items: [
        {
          label: 'Producto',
          value: data.nombre_producto_regulador
            ? `${data.codigo_producto_regulador ? `${data.codigo_producto_regulador} — ` : ''}${data.nombre_producto_regulador}`
            : 'Sin regulador vinculado',
        },
        { label: 'Tarifa periodo', value: formatDetailMoney(data.tarifa_diaria) },
        { label: 'Días periodo', value: String(data.dias_periodo ?? 14) },
      ],
    },
    {
      title: 'Vigencia',
      icon: ICONS.calendar,
      items: [
        { label: 'Inicio', value: formatDetailDate(data.fecha_inicio) },
        { label: 'Fin pactado', value: formatDetailDate(data.fecha_fin_pactada) },
        { label: 'Fin real', value: formatDetailDate(data.fecha_fin_real) },
      ],
    },
    {
      title: 'Cobro',
      icon: ICONS.creditCard,
      items: [{ label: 'Total cobrado', value: formatDetailMoney(data.total_cobrado) }],
    },
    {
      title: 'Comprobante venta',
      icon: ICONS.fileKey,
      items: data.id_comprobante_venta
        ? [
            {
              label: 'Número',
              value: formatDetailDocument(
                data.serie_comprobante_venta,
                data.numero_comprobante_venta,
              ),
            },
            { label: 'Fecha', value: formatDetailDate(data.fecha_comprobante_venta) },
            { label: 'Cliente', value: data.nombre_cliente_comprobante_venta },
            { label: 'Total', value: formatDetailMoney(data.total_comprobante_venta) },
          ]
        : [{ label: 'Comprobante', value: 'Sin comprobante vinculado' }],
    },
    {
      title: 'Auditoría',
      icon: ICONS.userCircle,
      items: [
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>

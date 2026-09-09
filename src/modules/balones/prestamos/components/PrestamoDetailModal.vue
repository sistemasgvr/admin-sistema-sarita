<template>
  <AppModal
    v-model="open"
    title="Detalle del préstamo"
    :subtitle="prestamo?.numero_prestamo || prestamo?.titulo || undefined"
    size="xl"
  >
    <DetailCardsLayout :loading="isLoading" :sections="sections">
      <template #badges>
        <ListaOpcionBadge
          v-if="prestamo?.nombre_tipo_prestamo"
          :value="prestamo.nombre_tipo_prestamo"
        />
        <ListaOpcionBadge v-if="prestamo?.nombre_estado" :value="prestamo.nombre_estado" />
        <AppBadge color="neutral">{{ detalleRows.length }} cilindros</AppBadge>
      </template>

      <template #extra>
        <DetailSectionCard
          v-if="detalleRows.length"
          title="Cilindros del préstamo"
          :icon="ICONS.boxes"
          :full-width="true"
        >
          <AppTable bare :columns="detalleColumns" :rows="detalleRows" row-key="id">
            <template #cell-rol="{ row }">
              <AppBadge :color="row.rol === 'GARANTIA' ? 'warning' : 'primary'">
                {{ row.rol === 'GARANTIA' ? 'Garantía' : 'Entregado' }}
              </AppBadge>
            </template>
            <template #actions="{ row }">
              <button
                v-if="row.id_balon"
                type="button"
                title="Ver detalle del cilindro"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="verCilindro(row)"
              >
                <AppIcon :name="ICONS.eye" :size="15" />
              </button>
            </template>
          </AppTable>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="prestamo?.observacion"
          title="Observación"
          :icon="ICONS.messageSquare"
          :full-width="true"
        >
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ prestamo.observacion }}</p>
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
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useRouter } from 'vue-router'
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
import { usePrestamoQuery } from '@/modules/balones/prestamos/composables/usePrestamosQuery'
import { usePrestamosDetalleQuery } from '@/modules/balones/prestamos/composables/usePrestamosDetalleQuery'
import type {
  PrestamoDetalle,
  PrestamoDetalleListFilters,
} from '@/modules/balones/prestamos/interfaces/prestamo-detalle.interface'
import { AppBadge, AppModal, AppTable, ListaOpcionBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { TableColumn } from '@/shared/interfaces/table.interface'

const props = defineProps<{ prestamoId?: number | null }>()
const open = defineModel<boolean>({ default: false })

const router = useRouter()

const prestamoIdRef = toRef(() => props.prestamoId)
const prestamoQuery = usePrestamoQuery(prestamoIdRef)

const detalleFilters = ref<PrestamoDetalleListFilters>({ pagina: 1, limite: 100 })
const detallesQuery = usePrestamosDetalleQuery(detalleFilters)

const isLoading = computed(() => prestamoQuery.isFetching.value)
const prestamo = computed(() => prestamoQuery.data.value ?? null)
const detalleRows = computed(() => detallesQuery.data.value?.data ?? [])

const detalleColumns: TableColumn[] = [
  { key: 'codigo_balon', label: 'Cilindro' },
  { key: 'rol', label: 'Rol' },
  { key: 'nombre_producto', label: 'Gas' },
  { key: 'fecha_prestamo', label: 'Préstamo' },
  { key: 'fecha_vencimiento', label: 'Vencimiento' },
  { key: 'nombre_estado', label: 'Estado' },
]

/**
 * El detalle del cilindro vive en su propia pantalla (libro del cilindro), así
 * que el modal se cierra al navegar: dejarlo abierto encima de la ruta nueva
 * bloquea el scroll de la página que se acaba de abrir.
 */
function verCilindro(row: PrestamoDetalle) {
  if (!row.id_balon) return
  open.value = false
  void router.push({
    name: 'admin-balones-cilindros-detalle',
    params: { id: String(row.id_balon) },
  })
}

watch(
  () => [open.value, props.prestamoId] as const,
  ([isOpen, id]) => {
    if (isOpen && id) {
      detalleFilters.value = { idPrestamo: id, pagina: 1, limite: 100 }
    }
  },
  { immediate: true },
)

const sections = computed<DetailSection[]>(() => {
  const data = prestamo.value
  if (!data) return []

  return [
    { title: 'Datos generales', icon: ICONS.clipboardList, items: [
        { label: 'Número', value: data.numero_prestamo },
        { label: 'Título', value: data.titulo },
        { label: 'Tipo', value: formatDetailListaOpcion(data.nombre_tipo_prestamo) },
        { label: 'Estado', value: formatDetailListaOpcion(data.nombre_estado) },
        { label: 'Almacén', value: data.nombre_almacen },
      ],
    },
    { title: 'Partes involucradas', icon: ICONS.users, items: [
        { label: 'Cliente', value: data.nombre_cliente },
        { label: 'Proveedor / tercero', value: data.nombre_proveedor },
      ],
    },
    { title: 'Fechas', icon: ICONS.calendar, items: [
        { label: 'Salida', value: formatDetailDate(data.fecha_salida) },
        { label: 'Retorno pactado', value: formatDetailDate(data.fecha_retorno_pactada) },
        { label: 'Retorno real', value: formatDetailDate(data.fecha_retorno_real) },
      ],
    },
    { title: 'Comprobante venta', icon: ICONS.creditCard, items: data.id_comprobante_venta
        ? [
            {
              label: 'Número',
              value: formatDetailDocument(data.serie_comprobante_venta, data.numero_comprobante_venta),
            },
            { label: 'Fecha', value: formatDetailDate(data.fecha_comprobante_venta) },
            { label: 'Cliente', value: data.nombre_cliente_comprobante_venta },
            { label: 'Total', value: formatDetailMoney(data.total_comprobante_venta) },
          ]
        : [{ label: 'Comprobante', value: 'Sin comprobante vinculado' }],
    },
    { title: 'Comprobante compra', icon: ICONS.fileKey, items: data.id_comprobante_compra
        ? [
            {
              label: 'Número',
              value: formatDetailDocument(data.serie_comprobante_compra, data.numero_comprobante_compra),
            },
            { label: 'Fecha', value: formatDetailDate(data.fecha_comprobante_compra) },
            { label: 'Proveedor', value: data.nombre_proveedor_comprobante_compra },
            { label: 'Total', value: formatDetailMoney(data.total_comprobante_compra) },
          ]
        : [{ label: 'Comprobante', value: 'Sin comprobante vinculado' }],
    },
    { title: 'Auditoría', icon: ICONS.userCircle, items: [
        { label: 'Fecha creación', value: formatDetailDateTime(data.fecha_creacion) },
        { label: 'Última modificación', value: formatDetailDateTime(data.fecha_modificacion) },
      ],
    },
  ]
})
</script>

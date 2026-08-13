<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <RouterLink
        :to="{ name: 'admin-compras' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver al listado
      </RouterLink>

      <div v-if="cabecera" class="flex flex-wrap items-center gap-2">
        <RouterLink
          v-if="canEdit && cabecera.estado === 1 && cabecera.puede_modificarse_parcial"
          :to="{ name: 'admin-compras-editar', params: { id: String(cabecera.id) } }"
          class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <AppIcon :name="ICONS.pencil" :size="16" />
          Editar
        </RouterLink>
        <RouterLink
          v-if="cuentaPorPagar"
          :to="{ name: 'admin-finanzas-pagar' }"
          class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <AppIcon :name="ICONS.wallet" :size="16" />
          Ir a cuentas por pagar
        </RouterLink>
      </div>
    </div>

    <div
      v-if="compraQuery.isError.value"
      class="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
    >
      No se pudo cargar el detalle de la compra.
    </div>

    <DetailCardsLayout v-else :loading="isLoading" :sections="sections">
      <template #badges>
        <AppBadge :color="cabecera?.estado === 1 ? 'success' : 'error'">
          {{ cabecera?.estado === 1 ? 'Activo' : 'Anulado' }}
        </AppBadge>
        <AppBadge v-if="cabecera?.estado_pago" color="neutral" size="sm">
          {{ formatCatalogo(cabecera.estado_pago) }}
        </AppBadge>
        <AppBadge v-if="cabecera?.declarar_sunat" color="primary" size="sm" :icon="ICONS.check">
          Declarar SUNAT
        </AppBadge>
        <AppBadge
          v-if="cabecera?.tiene_movimientos_inventario"
          color="warning"
          size="sm"
          :icon="ICONS.alertTriangle"
        >
          Afectó inventario
        </AppBadge>
        <AppBadge v-else-if="cabecera" color="neutral" size="sm">
          Sin mov. inventario producto
        </AppBadge>
        <AppBadge v-if="cuentaPorPagar" color="warning" size="sm" :icon="ICONS.wallet">
          CxP generada
        </AppBadge>
        <AppBadge v-if="cabecera?.id_recarga_planta" color="primary" size="sm" :icon="ICONS.cylinder">
          Recarga planta
        </AppBadge>
      </template>

      <template #extra>
        <div
          v-if="cabecera?.id_comprobante_referencia"
          class="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
        >
          Esta compra corrige a la compra anulada
          <RouterLink
            class="font-medium underline"
            :to="{
              name: 'admin-compras-detalle',
              params: { id: String(cabecera.id_comprobante_referencia) },
            }"
          >
            #{{ cabecera.id_comprobante_referencia }}
          </RouterLink>
        </div>

        <DetailSectionCard
          v-if="cabecera?.glosa"
          title="Glosa / observación"
          :icon="ICONS.messageSquare"
          :full-width="true"
        >
          <p class="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">{{ cabecera.glosa }}</p>
        </DetailSectionCard>

        <DetailSectionCard title="Totales" :icon="ICONS.receipt" :full-width="true">
          <div class="grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Sub total</p>
              <p class="font-semibold text-gray-800 dark:text-white/90">
                {{ formatMoney(cabecera?.sub_total ?? 0) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">IGV</p>
              <p class="font-semibold text-gray-800 dark:text-white/90">
                {{ formatMoney(cabecera?.igv ?? 0) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p class="font-semibold text-gray-800 dark:text-white/90">
                {{ formatMoney(cabecera?.total_importe ?? 0) }}
              </p>
            </div>
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          v-if="cuentaPorPagar"
          title="Cuenta por pagar"
          :icon="ICONS.wallet"
          :full-width="true"
        >
          <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ cuentaDetalle?.descripcion || cuentaPorPagar.descripcion || 'Obligación vinculada' }}
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <AppBadge
                  v-if="cuentaDetalle?.estado_calculado"
                  :color="estadoCuentaColor(cuentaDetalle.estado_calculado)"
                  size="sm"
                >
                  {{ cuentaDetalle.estado_calculado }}
                </AppBadge>
                <AppBadge
                  v-if="(cuentaDetalle?.numero_cuotas_total ?? cuentaPorPagar.numero_cuotas_total) != null"
                  color="neutral"
                  size="sm"
                >
                  {{ cuentaDetalle?.numero_cuotas_total ?? cuentaPorPagar.numero_cuotas_total }}
                  {{
                    (cuentaDetalle?.numero_cuotas_total ?? cuentaPorPagar.numero_cuotas_total) === 1
                      ? 'cuota'
                      : 'cuotas'
                  }}
                </AppBadge>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500 dark:text-gray-400">Saldo por pagar</p>
              <p class="text-lg font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                {{ formatMoney(cuentaDetalle?.saldo ?? cuentaPorPagar.saldo) }}
              </p>
            </div>
          </div>

          <div class="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Monto plan</p>
              <p class="font-medium tabular-nums text-gray-800 dark:text-white/90">
                {{ formatMoney(cuentaDetalle?.monto_pendiente ?? cuentaPorPagar.monto_pendiente) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Abonado</p>
              <p class="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                {{ formatMoney(cuentaDetalle?.monto_abonado ?? cuentaPorPagar.monto_abonado) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Vencimiento</p>
              <p class="font-medium text-gray-800 dark:text-white/90">
                {{
                  formatListDate(
                    cuentaDetalle?.fecha_vencimiento ?? cuentaPorPagar.fecha_vencimiento,
                  ) || '—'
                }}
              </p>
            </div>
            <div v-if="cuentaDetalle?.comprobante || cuentaDetalle?.numero_comprobante">
              <p class="text-xs text-gray-500 dark:text-gray-400">Comprobante CxP</p>
              <p class="font-medium text-gray-800 dark:text-white/90">
                {{ cuentaDetalle?.comprobante || cuentaDetalle?.numero_comprobante || '—' }}
              </p>
            </div>
          </div>

          <div v-if="cuotasVisibles.length" class="mb-4">
            <div class="mb-2 flex items-center justify-between gap-2">
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Cuotas</h4>
              <p v-if="cuotasPagadasLabel" class="text-xs text-gray-500 dark:text-gray-400">
                {{ cuotasPagadasLabel }}
              </p>
            </div>
            <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Cuota
                    </th>
                    <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Vence
                    </th>
                    <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                      Monto
                    </th>
                    <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                      Abonado
                    </th>
                    <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                      Saldo
                    </th>
                    <th class="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="cuota in cuotasVisibles"
                    :key="cuota.id"
                    class="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td class="px-3 py-2">
                      {{ cuota.numero }} / {{ cuota.totalCuotas }}
                    </td>
                    <td class="px-3 py-2">{{ formatListDate(cuota.vence) || '—' }}</td>
                    <td class="px-3 py-2 text-right tabular-nums">
                      {{ formatMoney(cuota.monto) }}
                    </td>
                    <td class="px-3 py-2 text-right tabular-nums">
                      {{ formatMoney(cuota.abonado) }}
                    </td>
                    <td class="px-3 py-2 text-right tabular-nums font-medium">
                      {{ formatMoney(cuota.saldo) }}
                    </td>
                    <td class="px-3 py-2 text-center">
                      <AppBadge
                        v-if="cuota.estado"
                        :color="estadoCuentaColor(cuota.estado)"
                        size="sm"
                      >
                        {{ cuota.estado }}
                      </AppBadge>
                      <span v-else class="text-gray-400">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 class="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
              Historial de pagos
            </h4>
            <div
              v-if="cuentaDetalleQuery.isFetching.value && !pagosVisibles.length"
              class="py-4 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              Cargando pagos...
            </div>
            <div
              v-else-if="!pagosVisibles.length"
              class="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500"
            >
              Sin pagos registrados aún.
              <span v-if="esPlanCuotas" class="block mt-1">
                Los abonos se aplican por cuota desde Finanzas → Cuentas por pagar.
              </span>
            </div>
            <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 px-3">
              <li
                v-for="pago in pagosVisibles"
                :key="pago.id"
                class="flex items-center justify-between gap-3 py-2.5"
              >
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                    {{ formatMoney(pago.monto) }}
                    <span class="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
                      {{ pago.medioPago || 'Sin medio' }}
                    </span>
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500">
                    {{ formatListDate(pago.fechaPago) }}
                    <span v-if="pago.numeroOperacion"> · Op. {{ pago.numeroOperacion }}</span>
                    <span v-if="pago.referencia"> · {{ pago.referencia }}</span>
                  </p>
                  <p
                    v-if="pago.observacion"
                    class="mt-1 whitespace-pre-wrap text-xs italic text-gray-500 dark:text-gray-400"
                  >
                    “{{ pago.observacion }}”
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </DetailSectionCard>

        <RecargaPlantaBalonesCard
          :id-recarga-planta="cabecera?.id_recarga_planta ?? null"
          :numero="cabecera?.numero_recarga_planta"
        />

        <div
          v-if="cabecera?.id_recarga_planta"
          class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/5 dark:text-gray-300"
        >
          El retorno de cilindros genera
          <strong>nuevos movimientos</strong> en el historial del balón
          (<code class="text-xs">ENTRADA_PLANTA_EXTERNA</code>), no reemplaza los de salida.
        </div>

        <DetailSectionCard title="Detalle de productos" :icon="ICONS.clipboardList" :full-width="true">
          <div
            v-if="!compraDetalle.length"
            class="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500"
          >
            Sin líneas de detalle.
          </div>
          <div v-else class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">#</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Producto
                  </th>
                  <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Almacén
                  </th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                    Cant.
                  </th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                    P. unit.
                  </th>
                  <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                    Importe
                  </th>
                  <th class="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="det in compraDetalle"
                  :key="det.id"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td class="px-3 py-2 text-gray-500">{{ det.item }}</td>
                  <td class="px-3 py-2">
                    <p class="font-medium text-gray-800 dark:text-white/90">
                      {{ det.nombre_producto ?? det.descripcion }}
                    </p>
                    <p v-if="det.codigo_producto" class="text-xs text-gray-400">
                      Código: {{ det.codigo_producto }}
                    </p>
                    <p v-if="det.unidad_medida" class="text-xs text-gray-400">
                      {{ det.unidad_medida }}
                    </p>
                  </td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                    {{ det.almacen ?? '—' }}
                  </td>
                  <td class="px-3 py-2 text-right tabular-nums">{{ det.cantidad }}</td>
                  <td class="px-3 py-2 text-right tabular-nums">
                    {{ det.precio_unitario != null ? formatMoney(det.precio_unitario) : '—' }}
                  </td>
                  <td class="px-3 py-2 text-right tabular-nums font-medium">
                    {{ formatMoney(det.importe) }}
                  </td>
                  <td class="px-3 py-2 text-center">
                    <AppBadge v-if="det.afecta_stock" color="warning" size="sm">Ingreso</AppBadge>
                    <span v-else class="text-xs text-gray-400">No</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </DetailSectionCard>
      </template>
    </DetailCardsLayout>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useCompraQuery } from '@/modules/compras/composables/useComprasQuery'
import RecargaPlantaBalonesCard from '@/modules/compras/components/ResumenRecarga.vue'
import { comprasFormBreadcrumbItems } from '@/modules/compras/config/compras-breadcrumb'
import { useCuentaDetalleQuery } from '@/modules/finanzas/composables/useCuentaDetalleQuery'
import type { EstadoCuenta } from '@/modules/finanzas/interfaces/cuenta.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailCardsLayout from '@/shared/components/detail/DetailCardsLayout.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import type { DetailSection } from '@/shared/components/detail/detail.types'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'
import { formatDateTime, formatListDate } from '@/shared/utils/date'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const route = useRoute()
const authStore = useAuthStore()

const compraId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

const compraQuery = useCompraQuery(compraId)
const compra = computed(() => compraQuery.data.value ?? null)
const cabecera = computed(() => compra.value?.cabecera ?? null)
const compraDetalle = computed(() => compra.value?.detalle ?? [])
const cuentaPorPagar = computed(() => compra.value?.cuenta_por_pagar ?? null)

const cuentaIdRef = computed(() => cuentaPorPagar.value?.id ?? null)
const cuentaDetalleQuery = useCuentaDetalleQuery('PAGAR', cuentaIdRef)
const cuentaDetalle = computed(() => cuentaDetalleQuery.data.value ?? null)

const isLoading = computed(() => compraQuery.isLoading.value || compraQuery.isFetching.value)
const canEdit = computed(() => authStore.hasPermission(PermisoBanderas.COMPRAS_EDITAR))

const pageTitle = computed(() => {
  if (!cabecera.value) return 'Detalle de compra'
  return `${cabecera.value.serie ?? '—'}-${cabecera.value.numero ?? '—'}`
})
const breadcrumbItems = computed(() => comprasFormBreadcrumbItems(pageTitle.value))

const esPlanCuotas = computed(
  () => (cuentaDetalle.value?.numero_cuotas_total ?? cuentaPorPagar.value?.numero_cuotas_total ?? 0) > 1,
)

type CuotaVista = {
  id: number
  numero: number
  totalCuotas: number
  vence: string | null
  monto: number
  abonado: number
  saldo: number
  estado?: EstadoCuenta | null
}

const cuotasVisibles = computed<CuotaVista[]>(() => {
  const total =
    cuentaDetalle.value?.numero_cuotas_total ??
    cuentaPorPagar.value?.numero_cuotas_total ??
    1

  if (cuentaDetalle.value?.cuotas?.length) {
    return cuentaDetalle.value.cuotas.map((c) => ({
      id: c.id,
      numero: c.numeroCuota,
      totalCuotas: total,
      vence: c.fechaVencimiento,
      monto: c.montoPendiente,
      abonado: c.montoAbonado,
      saldo: c.saldo,
      estado: c.estadoCalculado,
    }))
  }

  return (cuentaPorPagar.value?.cuotas ?? []).map((c) => ({
    id: c.id,
    numero: c.numero_cuota,
    totalCuotas: total,
    vence: c.fecha_vencimiento,
    monto: c.monto_pendiente,
    abonado: c.monto_abonado,
    saldo: c.saldo,
    estado: null,
  }))
})

const cuotasPagadasLabel = computed(() => {
  if (!cuentaDetalle.value?.cuotas?.length) return ''
  const pagadas = cuentaDetalle.value.cuotas.filter((c) => c.estadoCalculado === 'PAGADO').length
  return `${pagadas}/${cuentaDetalle.value.cuotas.length} pagadas`
})

const pagosVisibles = computed(() => cuentaDetalle.value?.pagos ?? [])

function formatCatalogo(value?: string | null) {
  return formatListaOpcionLabel(value) || '—'
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function estadoCuentaColor(estado: EstadoCuenta): BadgeColor {
  switch (estado) {
    case 'PAGADO':
      return 'success'
    case 'VENCIDO':
      return 'error'
    case 'PARCIAL':
      return 'warning'
    default:
      return 'neutral'
  }
}

const sections = computed<DetailSection[]>(() => {
  const c = cabecera.value
  if (!c) return []

  return [
    {
      title: 'Comprobante',
      icon: ICONS.receipt,
      items: [
        { label: 'Serie-Número', value: `${c.serie ?? '—'}-${c.numero ?? '—'}` },
        { label: 'Tipo', value: formatCatalogo(c.tipo_comprobante) },
        { label: 'Fecha', value: c.fecha },
        { label: 'Tipo registro', value: formatCatalogo(c.tipo_registro) },
        { label: 'Categoría gasto', value: formatCatalogo(c.categoria_gasto) },
        { label: 'Condición de pago', value: c.condicion_pago ?? '—' },
        { label: 'Moneda', value: formatCatalogo(c.moneda) },
        {
          label: 'Creado',
          value: c.fecha_creacion ? formatDateTime(c.fecha_creacion) : '—',
        },
      ],
    },
    {
      title: 'Proveedor y almacén',
      icon: ICONS.building2,
      items: [
        { label: 'Proveedor', value: c.proveedor ?? '—' },
        { label: 'Documento', value: c.proveedor_documento ?? '—' },
        { label: 'Sucursal', value: c.sucursal ?? '—' },
        { label: 'Almacén', value: c.almacen ?? '—' },
        {
          label: 'Orden recarga planta',
          value: c.numero_recarga_planta
            ? c.numero_recarga_planta
            : c.id_recarga_planta
              ? `#${c.id_recarga_planta}`
              : '—',
        },
      ],
    },
  ]
})
</script>

<template>
  <div>
    <PageBreadcrumb page-title="Punto de venta" :items="breadcrumbItems" />

    <AppTabs
      v-model="activeTab"
      :tabs="visibleTabs"
      inline
      full-width
      aria-label="Operaciones de punto de venta"
      class="mb-4"
    />

    <KeepAlive>
      <PosAccesoriosPanel v-if="activeTab === 'accesorios'" />
      <PosRecargaPanel v-else-if="activeTab === 'recarga'" />
      <PosAlquilerPanel v-else-if="activeTab === 'medicinal'" />
      <PosIndustrialPanel v-else-if="activeTab === 'industrial'" />
      <PosMantenimientoPanel v-else-if="activeTab === 'mantenimiento'" />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import PosAccesoriosPanel from '@/modules/ventas/comprobantes/components/PosAccesoriosPanel.vue'
import PosAlquilerPanel from '@/modules/ventas/comprobantes/components/PosAlquilerPanel.vue'
import PosIndustrialPanel from '@/modules/ventas/comprobantes/components/PosIndustrialPanel.vue'
import PosMantenimientoPanel from '@/modules/ventas/comprobantes/components/PosMantenimientoPanel.vue'
import PosRecargaPanel from '@/modules/ventas/comprobantes/components/PosRecargaPanel.vue'
import { ventasBreadcrumbItems } from '@/modules/ventas/config/ventas-breadcrumb'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppTabs } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const breadcrumbItems = ventasBreadcrumbItems('Punto de venta')

/** `alquiler` se mantiene como alias de `medicinal` por enlaces antiguos. */
const TAB_KEYS = ['accesorios', 'recarga', 'medicinal', 'industrial', 'mantenimiento'] as const
type TabKey = (typeof TAB_KEYS)[number]

const canAccesorios = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_CREAR))
const canRecarga = computed(() =>
  authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR),
)
const canMedicinal = computed(() =>
  authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR),
)
const canIndustrial = computed(
  () =>
    authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_CREAR) ||
    authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_LISTAR) ||
    authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR),
)
const canMantenimiento = computed(
  () =>
    authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_CREAR) &&
    authStore.hasPermission(PermisoBanderas.COMPROBANTES_CREAR),
)

const allTabs = computed<AppTabItem[]>(() => [
  {
    key: 'accesorios',
    label: 'Accesorios',
    icon: ICONS.package,
    disabled: !canAccesorios.value,
  },
  {
    key: 'recarga',
    label: 'Recarga',
    icon: ICONS.cylinder,
    disabled: !canRecarga.value,
  },
  {
    key: 'medicinal',
    label: 'Medicinal',
    icon: ICONS.boxes,
    disabled: !canMedicinal.value,
  },
  {
    key: 'industrial',
    label: 'Industrial',
    icon: ICONS.building2,
    disabled: !canIndustrial.value,
  },
  {
    key: 'mantenimiento',
    label: 'Mantenimiento',
    icon: ICONS.construction,
    disabled: !canMantenimiento.value,
  },
])

const visibleTabs = computed(() => allTabs.value.filter((tab) => !tab.disabled))

const resolveTab = (tab: LocationQueryValue | LocationQueryValue[]): TabKey => {
  const value = Array.isArray(tab) ? tab[0] : tab
  const normalized =
    value === 'alquiler' ? 'medicinal' : value
  const allowed = visibleTabs.value.map((item) => item.key)
  if (normalized && allowed.includes(normalized)) return normalized as TabKey
  return (allowed[0] ?? 'accesorios') as TabKey
}

const activeTab = ref<TabKey>(resolveTab(route.query.tab))

watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = resolveTab(tab)
  },
)

watch(activeTab, (tab) => {
  if (route.query.tab === tab) return
  // Normaliza alias antiguo `alquiler` → `medicinal` en la URL
  router.replace({ query: { ...route.query, tab } })
})

watch(visibleTabs, (tabs) => {
  if (!tabs.some((tab) => tab.key === activeTab.value)) {
    activeTab.value = (tabs[0]?.key ?? 'accesorios') as TabKey
  }
})
</script>

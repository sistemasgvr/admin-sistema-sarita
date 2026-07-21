<template>
  <div>
    <PageBreadcrumb
      page-title="Mapa de clientes"
      :items="[{ label: 'Clientes', to: '/admin/clientes' }, { label: 'Mapa' }]"
    />

    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="w-full sm:max-w-sm">
          <AppInput
            v-model="buscar"
            type="search"
            placeholder="Buscar cliente por nombre o documento..."
          />
        </div>
        <div class="w-full sm:w-56">
          <AppSelect v-model="mostrarClientes" :options="estadoFiltroOptions" />
        </div>
      </div>

      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ clientesConCoordenadas }} cliente{{ clientesConCoordenadas !== 1 ? 's' : '' }} con ubicación
      </p>
    </div>

    <div class="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <div ref="mapContainer" class="z-0 h-[600px] w-full"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { getClienteNombrePrincipal } from '@/modules/clientes/utils/clienteNombre'
import type {
  Cliente,
  ClienteEstadoFiltro,
  ClienteListFilters,
} from '@/modules/clientes/interfaces/cliente.interface'
import { AppInput, AppSelect } from '@/shared/components'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const route = useRoute()

const initialBuscar =
  typeof route.query.buscar === 'string'
    ? route.query.buscar
    : typeof route.query.idCliente === 'string'
      ? ''
      : ''

const buscar = ref(initialBuscar)
const mostrarClientes = ref<ClienteEstadoFiltro>('activos')
const pagina = ref(1)
const focusClienteId = ref<number | null>(
  typeof route.query.idCliente === 'string' && Number(route.query.idCliente) > 0
    ? Number(route.query.idCliente)
    : null,
)

const estadoFiltroOptions: SelectOption[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]

const buildSoloActivos = (value: ClienteEstadoFiltro): number | undefined => {
  switch (value) {
    case 'activos':
      return 1
    case 'inactivos':
      return 0
    case 'todos':
    default:
      return undefined
  }
}

const filters = ref<ClienteListFilters>({
  buscar: buscar.value.trim(),
  pagina: 1,
  limite: 200,
  soloActivos: 1,
})

const clientesQuery = useClientesQuery(filters)

const clientesConUbicacion = computed(() => {
  const data = clientesQuery.data.value?.data ?? []
  const withCoords = data.filter((c) => c.latitud != null && c.longitud != null)
  if (focusClienteId.value == null) return withCoords
  const focused = withCoords.filter((c) => c.id === focusClienteId.value)
  return focused.length ? focused : withCoords
})

const clientesConCoordenadas = computed(() => clientesConUbicacion.value.length)

const mapContainer = ref<HTMLDivElement>()
let map: L.Map | null = null
let markersLayer: L.LayerGroup | null = null

function getClienteNombre(cliente: Cliente): string {
  return getClienteNombrePrincipal(cliente)
}

function initMap() {
  if (!mapContainer.value || map) return

  map = L.map(mapContainer.value, {
    center: [-12.0464, -77.0428],
    zoom: 6,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
  updateMarkers()

  setTimeout(() => map?.invalidateSize(), 400)
}

function updateMarkers() {
  if (!markersLayer || !map) return

  markersLayer.clearLayers()
  const clientes = clientesConUbicacion.value

  if (clientes.length === 0) return

  const bounds = L.latLngBounds([])

  for (const cliente of clientes) {
    if (cliente.latitud == null || cliente.longitud == null) continue

    const nombre = getClienteNombre(cliente)
    const popupContent = `
      <div style="font-family: Outfit, sans-serif; min-width: 180px;">
        <p style="font-weight: 600; margin: 0 0 4px; color: #1565c0;">${nombre}</p>
        <p style="margin: 0 0 2px; font-size: 12px; color: #6b7280;">
          ${cliente.numero_documento}
        </p>
        <p style="margin: 0 0 2px; font-size: 12px; color: #6b7280;">
          ${cliente.nombre_tipo_persona ?? ''}
        </p>
        ${
          cliente.direccion
            ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${cliente.direccion}</p>
          ${cliente.latitud && cliente.longitud ? `<a href="https://www.google.com/maps/search/?api=1&query=${cliente.latitud},${cliente.longitud}" target="_blank" style="font-size: 12px; color: #1565c0;">Ver en Google Maps</a>` : ''}`
            : ''
        }
      </div>
    `

    const icon = L.icon({
      iconUrl: '/images/marcador-mapa.png',
      iconSize: [40, 60],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    })

    const marker = L.marker([cliente.latitud, cliente.longitud], { icon })
    marker.bindPopup(popupContent, { closeButton: true })
    markersLayer.addLayer(marker)
    bounds.extend([cliente.latitud, cliente.longitud])
  }

  if (clientes.length === 1) {
    const c = clientes[0]
    map.setView([c.latitud!, c.longitud!], 15)
  } else if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
  }
}

let buscarTimeout: ReturnType<typeof setTimeout> | undefined

watch(buscar, (value) => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    pagina.value = 1
    filters.value = {
      ...filters.value,
      buscar: value.trim(),
      pagina: 1,
    }
  }, 350)
})

watch(mostrarClientes, (value) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    soloActivos: buildSoloActivos(value),
    pagina: 1,
  }
})

watch(
  () => clientesQuery.data.value?.data,
  () => {
    updateMarkers()
  },
)

watch(
  () => [route.query.idCliente, route.query.buscar] as const,
  ([idCliente, buscarQuery]) => {
    focusClienteId.value =
      typeof idCliente === 'string' && Number(idCliente) > 0 ? Number(idCliente) : null
    if (typeof buscarQuery === 'string' && buscarQuery.trim()) {
      buscar.value = buscarQuery
      filters.value = {
        ...filters.value,
        buscar: buscarQuery.trim(),
        pagina: 1,
      }
    }
  },
)

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
    markersLayer = null
  }
})
</script>

<style scoped>
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.leaflet-popup-content) {
  margin: 10px 14px;
}
</style>

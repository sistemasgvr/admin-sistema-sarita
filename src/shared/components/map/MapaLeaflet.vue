<template>
  <div class="space-y-3">
    <div v-if="searchable" class="relative">
      <AppIcon
        :name="ICONS.search"
        :size="16"
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar dirección en el mapa..."
        class="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-20 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-400 dark:disabled:bg-white/[0.03] dark:disabled:text-white/30"
        @keydown.enter.prevent="searchAddress"
      />
      <button
        type="button"
        class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
        :disabled="isSearching"
        @click="searchAddress"
      >
        {{ isSearching ? 'Buscando...' : 'Buscar' }}
      </button>
    </div>

    <div class="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <div ref="mapContainer" :style="{ height }" class="z-0"></div>

      <div
        v-if="!latitud && !longitud && !readonly"
        class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] dark:bg-gray-900/60"
      >
        <p class="rounded-lg bg-white px-4 py-2 text-sm text-gray-500 shadow-theme-md dark:bg-gray-800 dark:text-gray-400">
          Busca una dirección o haz clic en el mapa para colocar un marcador
        </p>
      </div>
    </div>

    <div
      v-if="latitud && longitud"
      class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800/50"
    >
      <AppIcon :name="ICONS.mapPin" :size="14" class="shrink-0 text-sarita-500" />
      <span class="text-gray-600 dark:text-gray-400">
        {{ latitud.toFixed(6) }}, {{ longitud.toFixed(6) }}
      </span>
      <span v-if="searchResult" class="ml-1 truncate text-gray-400" :title="searchResult">
        — {{ searchResult }}
      </span>
      <button
        v-if="!readonly"
        type="button"
        class="ml-auto shrink-0 text-gray-400 transition hover:text-error-500"
        title="Limpiar coordenadas"
        @click="clearMarker"
      >
        <AppIcon :name="ICONS.x" :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

const props = withDefaults(
  defineProps<{
    latitud?: number | null
    longitud?: number | null
    height?: string
    zoom?: number
    searchable?: boolean
    draggableMarker?: boolean
    readonly?: boolean
  }>(),
  {
    latitud: null,
    longitud: null,
    height: '400px',
    zoom: 15,
    searchable: true,
    draggableMarker: true,
    readonly: false,
  },
)

const emit = defineEmits<{
  'update:latitud': [value: number | null]
  'update:longitud': [value: number | null]
}>()

const mapContainer = ref<HTMLDivElement>()
const searchQuery = ref('')
const isSearching = ref(false)
const searchResult = ref<string | null>(null)

let map: L.Map | null = null
let marker: L.Marker | null = null

const peruBounds: [number, number][] = [
  [-18.5, -81.5],
  [-0.5, -68.5],
]

function initMap() {
  if (!mapContainer.value || map) return

  map = L.map(mapContainer.value, {
    center: props.latitud && props.longitud
      ? [props.latitud, props.longitud]
      : [-6.78, -79.87],
    zoom: props.zoom,
    zoomControl: true,
    maxBounds: peruBounds,
    maxBoundsViscosity: 1.0,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  if (props.latitud && props.longitud) {
    placeMarker(props.latitud, props.longitud)
  }

  if (!props.readonly) {
    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng)
    })
  }

  setTimeout(() => map?.invalidateSize(), 300)
}

function createMarkerIcon() {
  return L.icon({
    iconUrl: '/images/marcador-mapa.png',
    iconSize: [40, 60],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  })
}

function placeMarker(lat: number, lng: number) {
  if (!map) return

  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], {
      icon: createMarkerIcon(),
      draggable: props.draggableMarker && !props.readonly,
    }).addTo(map)

    if (props.draggableMarker && !props.readonly) {
      marker.on('dragend', () => {
        const pos = marker?.getLatLng()
        if (pos) {
          emit('update:latitud', pos.lat)
          emit('update:longitud', pos.lng)
          searchResult.value = null
        }
      })
    }
  }

  emit('update:latitud', lat)
  emit('update:longitud', lng)
}

function clearMarker() {
  if (marker) {
    marker.remove()
    marker = null
  }
  searchResult.value = null
  emit('update:latitud', null)
  emit('update:longitud', null)
}

async function searchAddress() {
  const query = searchQuery.value.trim()
  if (!query || !map) return

  isSearching.value = true
  try {
    const params = new URLSearchParams({
      format: 'json',
      q: query,
      limit: '8',
      countrycodes: 'pe',
      addressdetails: '1',
      'accept-language': 'es',
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'AdminSistemaSarita/1.0',
        },
      },
    )

    if (!response.ok) return

    const results: NominatimResult[] = await response.json()

    if (results.length === 0) return

    const result = results[0]
    const lat = Number.parseFloat(result.lat)
    const lng = Number.parseFloat(result.lon)

    placeMarker(lat, lng)
    map.setView([lat, lng], 18)
    searchResult.value = result.display_name
  } finally {
    isSearching.value = false
  }
}

watch(
  () => props.latitud,
  (newLat) => {
    if (newLat && props.longitud && map) {
      if (!marker) {
        placeMarker(newLat, props.longitud)
      }
      map.setView([newLat, props.longitud], props.zoom)
    }
  },
)

watch(
  () => props.zoom,
  (newZoom) => {
    if (map) {
      map.setZoom(newZoom)
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
    marker = null
  }
})
</script>

<style>
.leaflet-container {
  font-family: 'Outfit', sans-serif;
  border-radius: 0.75rem;
}

.leaflet-control-zoom a {
  color: #374151 !important;
}

.dark .leaflet-tile-pane {
  filter: brightness(0.85) invert(0.15);
}

.dark .leaflet-control-zoom a {
  background: #1f2937 !important;
  color: #f3f4f6 !important;
  border-color: #4b5563 !important;
}

.dark .leaflet-control-attribution {
  background: rgba(31, 41, 55, 0.8) !important;
  color: #9ca3af !important;
}

.dark .leaflet-control-attribution a {
  color: #64b5f6 !important;
}
</style>

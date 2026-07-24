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

      <button
        v-if="!readonly"
        type="button"
        class="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-theme-md transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        title="Usar mi ubicación actual"
        :disabled="isLocating"
        @click="goToCurrentLocation"
      >
        <AppIcon :name="ICONS.locateFixed" :size="18" :class="isLocating ? 'animate-pulse' : ''" />
      </button>

      <div
        v-if="!latitud && !longitud && !readonly"
        class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] dark:bg-gray-900/60"
      >
        <p class="rounded-lg bg-white px-4 py-2 text-sm text-gray-500 shadow-theme-md dark:bg-gray-800 dark:text-gray-400">
          Busca una dirección, usa tu ubicación o haz clic en el mapa para colocar un marcador
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
      <span v-if="isResolvingLocation" class="ml-1 text-gray-400">— Resolviendo ubicación...</span>
      <span v-else-if="searchResult" class="ml-1 truncate text-gray-400" :title="searchResult">
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
    <p v-if="locationError" class="text-theme-xs text-error-500">{{ locationError }}</p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

export interface MapaLocationAddress {
  road?: string
  house_number?: string
  suburb?: string
  neighbourhood?: string
  quarter?: string
  city_district?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  province?: string
  state?: string
  state_district?: string
  region?: string
  country?: string
  country_code?: string
  postcode?: string
}

export interface MapaLocationConfirmed {
  lat: number
  lng: number
  displayName?: string | null
  address?: MapaLocationAddress | null
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address?: MapaLocationAddress
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
    resolveGoogleMapsLink?: (link: string) => Promise<{ lat: number; lng: number } | null>
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
  'location-confirmed': [value: MapaLocationConfirmed]
}>()

const mapContainer = ref<HTMLDivElement>()
const searchQuery = ref('')
const isSearching = ref(false)
const isLocating = ref(false)
const isResolvingLocation = ref(false)
const searchResult = ref<string | null>(null)
const locationError = ref<string | null>(null)

let map: L.Map | null = null
let marker: L.Marker | null = null
let resolveSeq = 0
/** Evita que el watch de props recentre/aleje el mapa tras un click propio. */
let ignoreNextPropCenter = false

const peruBounds: [number, number][] = [
  [-18.5, -81.5],
  [-0.5, -68.5],
]

const nominatimHeaders = {
  'User-Agent': 'AdminSistemaSarita/1.0',
}

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
    placeMarker(props.latitud, props.longitud, { resolve: false, center: false })
  }

  if (!props.readonly) {
    map.on('click', (e: L.LeafletMouseEvent) => {
      // Solo mueve el marcador; no cambia zoom ni centra (evita “alejar” el mapa).
      void placeMarker(e.latlng.lat, e.latlng.lng, { resolve: true, center: false })
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

async function reverseGeocode(lat: number, lng: number): Promise<MapaLocationConfirmed> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    zoom: '18',
    addressdetails: '1',
    'accept-language': 'es',
  })

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    { headers: nominatimHeaders },
  )

  if (!response.ok) {
    return { lat, lng }
  }

  const result = (await response.json()) as NominatimResult
  return {
    lat,
    lng,
    displayName: result.display_name ?? null,
    address: result.address ?? null,
  }
}

async function confirmLocation(
  lat: number,
  lng: number,
  seed?: Partial<MapaLocationConfirmed>,
) {
  const seq = ++resolveSeq
  isResolvingLocation.value = true
  locationError.value = null
  try {
    let payload: MapaLocationConfirmed = {
      lat,
      lng,
      displayName: seed?.displayName ?? null,
      address: seed?.address ?? null,
    }

    if (!payload.address) {
      payload = await reverseGeocode(lat, lng)
    }

    if (seq !== resolveSeq) return

    if (payload.displayName) {
      searchResult.value = payload.displayName
    }
    emit('location-confirmed', payload)
  } catch {
    if (seq !== resolveSeq) return
    emit('location-confirmed', { lat, lng, displayName: seed?.displayName ?? null, address: null })
  } finally {
    if (seq === resolveSeq) isResolvingLocation.value = false
  }
}

async function placeMarker(
  lat: number,
  lng: number,
  options: {
    resolve?: boolean
    seed?: Partial<MapaLocationConfirmed>
    /** Si true, centra/acercar. Por defecto false en click. */
    center?: boolean
    zoom?: number
  } = {},
) {
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
        if (!pos) return
        ignoreNextPropCenter = true
        emit('update:latitud', pos.lat)
        emit('update:longitud', pos.lng)
        searchResult.value = null
        void confirmLocation(pos.lat, pos.lng)
      })
    }
  }

  ignoreNextPropCenter = true
  emit('update:latitud', lat)
  emit('update:longitud', lng)

  if (options.center) {
    map.setView([lat, lng], options.zoom ?? Math.max(map.getZoom(), 16))
  }

  if (options.resolve !== false) {
    await confirmLocation(lat, lng, options.seed)
  }
}

function clearMarker() {
  resolveSeq += 1
  if (marker) {
    marker.remove()
    marker = null
  }
  searchResult.value = null
  locationError.value = null
  isResolvingLocation.value = false
  ignoreNextPropCenter = true
  emit('update:latitud', null)
  emit('update:longitud', null)
}

async function goToCurrentLocation() {
  if (!map || !navigator.geolocation) {
    locationError.value = 'Geolocalización no disponible en este navegador'
    return
  }

  isLocating.value = true
  locationError.value = null
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000,
      })
    })

    const lat = position.coords.latitude
    const lng = position.coords.longitude
    await placeMarker(lat, lng, { resolve: true, center: true, zoom: 17 })
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error
      ? Number((error as GeolocationPositionError).code)
      : 0
    if (code === 1) {
      locationError.value = 'Permiso de ubicación denegado'
    } else if (code === 2) {
      locationError.value = 'No se pudo obtener la ubicación'
    } else if (code === 3) {
      locationError.value = 'Tiempo de espera al obtener ubicación'
    } else {
      locationError.value = 'No se pudo obtener tu ubicación actual'
    }
  } finally {
    isLocating.value = false
  }
}

const googleMapsUrlRegex = /google\.[a-z]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i

function parseCoordsInput(value: string): { lat: number; lng: number } | null {
  const cleaned = value.replace(/\s+/g, '').replace(/[−–—]/g, '-')
  const match = cleaned.match(/^(-?\d+\.?\d*)\s*[,;]\s*(-?\d+\.?\d*)$/)
  if (match) {
    const lat = Number.parseFloat(match[1])
    const lng = Number.parseFloat(match[2])
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
  }
  return null
}

function extractCoordsFromGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (atMatch) {
    const lat = Number.parseFloat(atMatch[1])
    const lng = Number.parseFloat(atMatch[2])
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  }
  const queryMatch = url.match(/[?&]q=(-?\d+\.?\d*)\s*%2C\s*(-?\d+\.?\d*)/)
  if (queryMatch) {
    const lat = Number.parseFloat(queryMatch[1])
    const lng = Number.parseFloat(queryMatch[2])
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  }
  const dMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/)
  if (dMatch) {
    const lat = Number.parseFloat(dMatch[1])
    const lng = Number.parseFloat(dMatch[2])
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  }
  return null
}

async function searchAddress() {
  const query = searchQuery.value.trim()
  if (!query || !map) return

  isSearching.value = true
  locationError.value = null
  try {
    const coords = parseCoordsInput(query)
    if (coords) {
      await placeMarker(coords.lat, coords.lng, { resolve: true, center: true, zoom: 18 })
      return
    }

    const isGoogleMaps = googleMapsUrlRegex.test(query)
    if (isGoogleMaps && props.resolveGoogleMapsLink) {
      const result = await props.resolveGoogleMapsLink(query)
      if (result) {
        await placeMarker(result.lat, result.lng, { resolve: true, center: true, zoom: 18 })
      }
      return
    }

    if (isGoogleMaps) {
      const coordsFromUrl = extractCoordsFromGoogleMapsUrl(query)
      if (coordsFromUrl) {
        await placeMarker(coordsFromUrl.lat, coordsFromUrl.lng, { resolve: true, center: true, zoom: 18 })
        return
      }
    }

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
      { headers: nominatimHeaders },
    )

    if (!response.ok) return

    const results: NominatimResult[] = await response.json()

    if (results.length === 0) return

    const result = results[0]
    const lat = Number.parseFloat(result.lat)
    const lng = Number.parseFloat(result.lon)

    await placeMarker(lat, lng, {
      resolve: true,
      center: true,
      zoom: 18,
      seed: {
        displayName: result.display_name,
        address: result.address ?? null,
      },
    })
  } finally {
    isSearching.value = false
  }
}

watch(
  () => [props.latitud, props.longitud] as const,
  ([newLat, newLng]) => {
    if (!newLat || !newLng || !map) return

    if (ignoreNextPropCenter) {
      ignoreNextPropCenter = false
      if (!marker) {
        void placeMarker(newLat, newLng, { resolve: false, center: false })
      } else {
        marker.setLatLng([newLat, newLng])
      }
      return
    }

    // Solo recentrar si el cambio viene de fuera (form sync / edición).
    if (!marker) {
      void placeMarker(newLat, newLng, { resolve: false, center: true })
    } else {
      marker.setLatLng([newLat, newLng])
      map.setView([newLat, newLng], map.getZoom())
    }
  },
)

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  resolveSeq += 1
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

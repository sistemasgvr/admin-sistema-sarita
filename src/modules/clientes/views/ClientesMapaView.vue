<template>
  <div>
    <PageBreadcrumb
      page-title="Mapa de clientes"
      :items="[{ label: 'Clientes', to: '/admin/clientes' }, { label: 'Mapa' }]"
    />

    <div
      class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4"
    >
      <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <div class="min-w-0 flex-1 sm:max-w-sm">
          <AppInput
            v-model="buscar"
            type="search"
            placeholder="Buscar cliente por nombre o documento..."
          />
        </div>

        <div class="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:gap-2">
          <div class="min-w-0 sm:w-36">
            <AppSelect
              v-model="mostrarClientes"
              label="Estado"
              :options="estadoFiltroOptions"
            />
          </div>
          <div class="min-w-0 sm:w-48">
            <AppSelect
              v-model="filtroBalones"
              label="Balones"
              :options="balonesFiltroOptions"
            />
          </div>
        </div>
      </div>

      <p class="shrink-0 text-sm text-gray-500 sm:pb-2.5 dark:text-gray-400">
        {{ clientesConCoordenadas }} cliente{{ clientesConCoordenadas !== 1 ? 's' : '' }}
        <span v-if="clientesConBalones > 0"> · {{ clientesConBalones }} con balones</span>
      </p>
    </div>

    <div
      class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400"
    >
      <span class="inline-flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full bg-gray-400"></span>
        Sin balones
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full bg-brand-500"></span>
        Con balones
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
        Atención / vencido
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full bg-error-500"></span>
        Crítico (180+ días)
      </span>
    </div>

    <div class="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <div ref="mapContainer" class="z-0 h-[520px] w-full sm:h-[600px]"></div>
      <div
        v-if="clientesQuery.isFetching.value"
        class="pointer-events-none absolute inset-x-0 top-0 z-[500] bg-white/70 px-3 py-1.5 text-center text-xs text-gray-600 dark:bg-gray-900/70 dark:text-gray-300"
      >
        Actualizando mapa...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import { useClientesMapaQuery } from '@/modules/clientes/composables/useClientesMapaQuery'
import { getClienteNombrePrincipal } from '@/modules/clientes/utils/clienteNombre'
import type {
  ClienteBalonMapa,
  ClienteEstadoFiltro,
  ClienteMapa,
  ClienteMapaFiltroBalones,
  ClienteMapaFilters,
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
const filtroBalones = ref<ClienteMapaFiltroBalones | 'TODOS'>('TODOS')
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

const balonesFiltroOptions: SelectOption[] = [
  { label: 'Todos con ubicación', value: 'TODOS' },
  { label: 'Con balones', value: 'CON_BALONES' },
  { label: 'Solo préstamo', value: 'PRESTADO_CLIENTE' },
  { label: 'Solo alquiler', value: 'ALQUILADO' },
  { label: 'Solo propio cliente', value: 'EN_PODER_CLIENTE' },
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

const filters = ref<ClienteMapaFilters>({
  buscar: buscar.value.trim(),
  pagina: 1,
  limite: 500,
  soloActivos: 1,
  filtroBalones: null,
})

const clientesQuery = useClientesMapaQuery(filters)

const clientesConUbicacion = computed(() => {
  const data = clientesQuery.data.value?.data ?? []
  if (focusClienteId.value == null) return data
  const focused = data.filter((c) => c.id === focusClienteId.value)
  return focused.length ? focused : data
})

const clientesConCoordenadas = computed(() => clientesConUbicacion.value.length)
const clientesConBalones = computed(
  () => clientesConUbicacion.value.filter((c) => (c.total_balones ?? 0) > 0).length,
)

const mapContainer = ref<HTMLDivElement>()
let map: L.Map | null = null
let markersLayer: L.LayerGroup | null = null

type MarkerTone = 'empty' | 'ok' | 'warn' | 'crit'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function labelRelacion(tipo?: string | null): string {
  switch (tipo) {
    case 'PRESTAMO':
      return 'Préstamo'
    case 'ALQUILER':
      return 'Alquiler'
    case 'PROPIO':
      return 'Propio'
    default:
      return tipo ?? 'Balón'
  }
}

function formatFechaCorta(value?: string | null): string {
  if (!value) return ''
  const raw = value.slice(0, 10)
  const [y, m, d] = raw.split('-')
  if (!y || !m || !d) return raw
  return `${d}/${m}/${y}`
}

function textoDias(balon: ClienteBalonMapa): string {
  if (balon.tipo_relacion === 'PROPIO') return 'Propio del cliente'
  if (balon.dias_en_cliente == null) return 'Sin fecha de inicio'
  const n = balon.dias_en_cliente
  return n === 1 ? '1 día' : `${n} días`
}

function textoEstadoBalon(balon: ClienteBalonMapa): { label: string; color: string } {
  if (balon.vencido) {
    return {
      label:
        balon.tipo_relacion === 'ALQUILER' ? 'Alquiler vencido' : 'Plazo vencido',
      color: '#dc2626',
    }
  }
  switch (balon.alerta_antiguedad) {
    case 'CRITICO':
      return { label: 'Crítico 180+', color: '#dc2626' }
    case 'SEGUIMIENTO':
      return { label: 'Seguimiento 90+', color: '#d97706' }
    case 'ATENCION':
      return { label: 'Atención 30+', color: '#ca8a04' }
    case 'RECIENTE':
      return { label: 'Reciente', color: '#059669' }
    default:
      return { label: labelRelacion(balon.tipo_relacion), color: '#1565c0' }
  }
}

function markerTone(cliente: ClienteMapa): MarkerTone {
  const total = cliente.total_balones ?? 0
  if (total <= 0) return 'empty'
  if (cliente.tiene_vencidos) return 'crit'
  const maxDias = cliente.max_dias_en_cliente ?? 0
  if (maxDias >= 180) return 'crit'
  if (maxDias >= 90) return 'warn'
  return 'ok'
}

function abrirRuta(lat: number, lng: number) {
  const destino = `${lat},${lng}`
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=driving`

  if (!navigator.geolocation) {
    window.open(fallback, '_blank', 'noopener,noreferrer')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const origin = `${pos.coords.latitude},${pos.coords.longitude}`
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destino}&travelmode=driving`,
        '_blank',
        'noopener,noreferrer',
      )
    },
    () => {
      window.open(fallback, '_blank', 'noopener,noreferrer')
    },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

function buildPopup(cliente: ClienteMapa): HTMLElement {
  const nombre = escapeHtml(getClienteNombrePrincipal(cliente))
  const documento = escapeHtml(cliente.numero_documento ?? '')
  const tipoPersona = escapeHtml(cliente.nombre_tipo_persona ?? '')
  const direccion = escapeHtml(cliente.direccion ?? '')
  const referencia = escapeHtml(cliente.referencia ?? '')
  const telefono = escapeHtml(cliente.telefono ?? '')
  const balones = cliente.balones ?? []
  const total = cliente.total_balones ?? balones.length

  const root = document.createElement('div')
  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 640
  root.className = 'cliente-mapa-popup'
  root.style.fontFamily = 'Outfit, sans-serif'
  root.style.minWidth = isNarrow ? '0' : '240px'
  root.style.width = isNarrow ? 'min(86vw, 300px)' : 'auto'
  root.style.maxWidth = isNarrow ? 'min(86vw, 300px)' : '300px'

  const balonesHtml =
    balones.length > 0
      ? `<div class="popup-balones">
          <div class="popup-balones-head">
            <span>Balones</span>
            <strong>${total}</strong>
          </div>
          <ul>
            ${balones
              .slice(0, 8)
              .map((b) => {
                const codigo = escapeHtml(b.codigo_balon ?? '')
                const tipo = escapeHtml(b.nombre_tipo_balon ?? '')
                const rel = escapeHtml(labelRelacion(b.tipo_relacion))
                const dias = escapeHtml(textoDias(b))
                const estado = textoEstadoBalon(b)
                const limite = b.fecha_limite
                  ? ` · límite ${escapeHtml(formatFechaCorta(b.fecha_limite))}`
                  : ''
                const inicio = b.fecha_inicio
                  ? `desde ${escapeHtml(formatFechaCorta(b.fecha_inicio))}`
                  : ''
                return `<li>
                  <div class="balon-top">
                    <strong>${codigo}</strong>
                    <span class="chip" style="background:${estado.color}1a;color:${estado.color};">${escapeHtml(estado.label)}</span>
                  </div>
                  <p class="balon-meta">${tipo ? `${tipo} · ` : ''}${rel}</p>
                  <p class="balon-dias">${dias}${inicio ? ` · ${inicio}` : ''}${limite}</p>
                </li>`
              })
              .join('')}
            ${
              balones.length > 8
                ? `<li class="balon-more">+${balones.length - 8} más</li>`
                : ''
            }
          </ul>
        </div>`
      : `<div class="popup-empty">Sin balones en préstamo, alquiler o en poder del cliente.</div>`

  // Una sola línea secundaria: doc · tipo · tel · dir · ref (ahorra alto vs filas sueltas).
  const metaLine = [
    documento,
    tipoPersona,
    telefono ? `Tel ${telefono}` : '',
    direccion,
    referencia ? `Ref: ${referencia}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  // La cantidad va solo en la sección Balones (evita choque con la X de Leaflet).
  root.innerHTML = `
    <div class="popup-body">
      <div class="popup-head">
        <p class="popup-name" title="${nombre}">${nombre}</p>
        ${metaLine ? `<p class="popup-meta" title="${metaLine}">${metaLine}</p>` : ''}
      </div>
      ${balonesHtml}
    </div>
    <div class="popup-footer">
      <div class="popup-actions"></div>
    </div>
  `

  const actions = root.querySelector('.popup-actions') as HTMLDivElement
  if (cliente.latitud != null && cliente.longitud != null) {
    const mapsLink = document.createElement('a')
    mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${cliente.latitud},${cliente.longitud}`
    mapsLink.target = '_blank'
    mapsLink.rel = 'noopener noreferrer'
    mapsLink.textContent = 'Ver en Maps'
    mapsLink.className = 'popup-link'

    const routeBtn = document.createElement('button')
    routeBtn.type = 'button'
    routeBtn.textContent = 'Iniciar ruta'
    routeBtn.className = 'popup-route'
    routeBtn.addEventListener('click', (e) => {
      e.preventDefault()
      abrirRuta(cliente.latitud!, cliente.longitud!)
    })

    actions.append(mapsLink, routeBtn)
  }

  return root
}

function markerIcon(cliente: ClienteMapa): L.DivIcon {
  const total = cliente.total_balones ?? 0
  const tone = markerTone(cliente)
  const badge =
    total > 0
      ? `<span class="cliente-mapa-badge">${total > 99 ? '99+' : total}</span>`
      : ''

  return L.divIcon({
    className: `cliente-mapa-marker tone-${tone}`,
    html: `
      <div class="cliente-mapa-marker-inner">
        ${badge}
        <img src="/images/marcador-mapa.png" alt="" draggable="false" />
      </div>
    `,
    iconSize: [48, 72],
    iconAnchor: [24, 68],
    popupAnchor: [0, -58],
  })
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

  // Esperar layout real del contenedor (evita mapa en blanco tras HMR/altura).
  requestAnimationFrame(() => {
    map?.invalidateSize()
    updateMarkers()
    setTimeout(() => map?.invalidateSize(), 250)
  })
}

function updateMarkers() {
  if (!markersLayer || !map) return

  markersLayer.clearLayers()
  const clientes = clientesConUbicacion.value

  if (clientes.length === 0) return

  const bounds = L.latLngBounds([])

  for (const cliente of clientes) {
    if (cliente.latitud == null || cliente.longitud == null) continue

    const total = cliente.total_balones ?? 0
    const marker = L.marker([cliente.latitud, cliente.longitud], {
      icon: markerIcon(cliente),
      title:
        total > 0
          ? `${getClienteNombrePrincipal(cliente)} · ${total} balón${total === 1 ? '' : 'es'}`
          : getClienteNombrePrincipal(cliente),
    })
    const isNarrow = window.innerWidth < 640
    marker.bindPopup(buildPopup(cliente), {
      closeButton: true,
      autoPan: true,
      keepInView: true,
      // Sin maxHeight de Leaflet: evita scrollbar externo (solo scrollea la lista de balones).
      maxWidth: isNarrow ? Math.min(window.innerWidth - 32, 300) : 320,
      autoPanPaddingTopLeft: L.point(isNarrow ? 12 : 40, isNarrow ? 72 : 48),
      autoPanPaddingBottomRight: L.point(isNarrow ? 12 : 40, isNarrow ? 24 : 40),
      className: 'cliente-mapa-popup-wrap',
    })
    marker.on('popupopen', () => {
      requestAnimationFrame(() => {
        if (!map) return
        map.invalidateSize()
        // En móvil baja el marcador para dejar espacio al popup (sin romper overflow de tiles).
        if (isNarrow) {
          const size = map.getSize()
          const projected = map.project(marker.getLatLng(), map.getZoom())
          const shifted = L.point(projected.x, projected.y - size.y * 0.22)
          map.panTo(map.unproject(shifted, map.getZoom()), { animate: true })
          return
        }
        if (typeof map.panInside === 'function') {
          map.panInside(marker.getLatLng(), {
            paddingTopLeft: [40, 56],
            paddingBottomRight: [40, 48],
            animate: true,
          })
        }
      })
    })
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

watch(filtroBalones, (value) => {
  pagina.value = 1
  filters.value = {
    ...filters.value,
    filtroBalones: value === 'TODOS' ? null : value,
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
  if (
    typeof route.query.filtroBalones === 'string' &&
    route.query.filtroBalones &&
    route.query.filtroBalones !== 'TODOS'
  ) {
    filtroBalones.value = route.query.filtroBalones as ClienteMapaFiltroBalones
  }
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
:deep(.leaflet-container) {
  font: inherit;
  background: #e5e7eb;
}

:deep(.leaflet-popup) {
  margin-bottom: 12px;
}

:deep(.cliente-mapa-popup-wrap .leaflet-popup-content-wrapper) {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  max-width: min(86vw, 320px);
  padding: 0;
  overflow: hidden;
}

:deep(.cliente-mapa-popup-wrap .leaflet-popup-content) {
  margin: 0;
  width: auto !important;
  /* Sin scroll en el contenedor Leaflet */
  max-height: none;
  overflow: visible;
}

:deep(.cliente-mapa-popup-wrap .leaflet-popup-close-button) {
  top: 8px !important;
  right: 8px !important;
  width: 24px !important;
  height: 24px !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f3f4f6 !important;
  color: #4b5563 !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  line-height: 1 !important;
  z-index: 5;
}

:deep(.cliente-mapa-marker) {
  background: transparent;
  border: 0;
}

:deep(.cliente-mapa-marker-inner) {
  position: relative;
  width: 48px;
  height: 72px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

:deep(.cliente-mapa-marker-inner img) {
  width: 40px;
  height: 60px;
  object-fit: contain;
  display: block;
  filter: grayscale(0.55) brightness(1.05);
  transition: filter 0.15s ease;
}

:deep(.cliente-mapa-marker.tone-ok .cliente-mapa-marker-inner img) {
  filter: none;
}

:deep(.cliente-mapa-marker.tone-warn .cliente-mapa-marker-inner img) {
  filter: hue-rotate(35deg) saturate(1.35) brightness(1.05);
}

:deep(.cliente-mapa-marker.tone-crit .cliente-mapa-marker-inner img) {
  filter: hue-rotate(-25deg) saturate(1.55) brightness(1.02);
}

:deep(.cliente-mapa-badge) {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: #1565c0;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  border: 2px solid #fff;
}

:deep(.cliente-mapa-marker.tone-warn .cliente-mapa-badge) {
  background: #d97706;
}

:deep(.cliente-mapa-marker.tone-crit .cliente-mapa-badge) {
  background: #dc2626;
}

:deep(.cliente-mapa-popup) {
  display: flex;
  flex-direction: column;
  max-height: min(52vh, 360px);
}

:deep(.cliente-mapa-popup .popup-body) {
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px 12px 4px 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:deep(.cliente-mapa-popup .popup-head) {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: 4px;
  flex-shrink: 0;
  /* Solo el título deja hueco a la X; la lista usa todo el ancho */
  padding-right: 26px;
}

:deep(.cliente-mapa-popup .popup-name) {
  margin: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: #1565c0;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.cliente-mapa-popup .popup-meta) {
  margin: 0;
  font-size: 10.5px;
  color: #6b7280;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.cliente-mapa-popup .popup-empty) {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #9ca3af;
}

:deep(.cliente-mapa-popup .popup-balones) {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #e5e7eb;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.cliente-mapa-popup .popup-balones-head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #374151;
  flex-shrink: 0;
}

:deep(.cliente-mapa-popup .popup-balones-head strong) {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #e3f2fd;
  color: #1565c0;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

:deep(.cliente-mapa-popup .popup-balones ul) {
  margin: 0;
  padding: 0 2px 0 0;
  list-style: none;
  /* Único scroll del popup */
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

:deep(.cliente-mapa-popup .popup-balones ul::-webkit-scrollbar) {
  width: 4px;
}

:deep(.cliente-mapa-popup .popup-balones ul::-webkit-scrollbar-track) {
  background: transparent;
  margin: 2px 0;
}

:deep(.cliente-mapa-popup .popup-balones ul::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 999px;
}

:deep(.cliente-mapa-popup .popup-balones ul::-webkit-scrollbar-button) {
  display: none;
  width: 0;
  height: 0;
}

:deep(.cliente-mapa-popup .popup-balones li) {
  margin: 0 0 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f9fafb;
}

:deep(.cliente-mapa-popup .popup-balones li:last-child) {
  margin-bottom: 0;
}

:deep(.cliente-mapa-popup .balon-top) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

:deep(.cliente-mapa-popup .balon-top strong) {
  font-size: 12px;
  color: #111827;
}

:deep(.cliente-mapa-popup .chip) {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 600;
}

:deep(.cliente-mapa-popup .balon-meta),
:deep(.cliente-mapa-popup .balon-dias) {
  margin: 3px 0 0;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.35;
}

:deep(.cliente-mapa-popup .balon-dias) {
  color: #374151;
  font-weight: 500;
}

:deep(.cliente-mapa-popup .balon-more) {
  background: transparent !important;
  padding: 0 !important;
  font-size: 11px;
  color: #9ca3af;
}

:deep(.cliente-mapa-popup .popup-footer) {
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  padding: 10px 14px 12px;
}

:deep(.cliente-mapa-popup .popup-actions) {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  margin: 0;
}

:deep(.cliente-mapa-popup .popup-link) {
  font-size: 12px;
  color: #1565c0;
  text-decoration: none;
  white-space: nowrap;
}

:deep(.cliente-mapa-popup .popup-route) {
  margin-left: auto;
  font-size: 12px;
  color: #fff;
  background: #1565c0;
  border: 0;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  white-space: nowrap;
}
</style>

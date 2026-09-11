import {
  TUTORIAL_WAIT_FOR_ELEMENT_MS,
  asyncElement,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

const MAP_CONTAINER_SELECTOR = '[data-tutorial="mapa-contenedor"]'
const MARKER_SELECTOR = '.cliente-mapa-marker'
const POPUP_SELECTOR = '.leaflet-popup'

/** Duración del autoPan de Leaflet al abrir un popup (0.25 s) más margen. */
const POPUP_OPEN_MS = 450

const isInside = (inner: DOMRect, outer: DOMRect) =>
  inner.top >= outer.top &&
  inner.left >= outer.left &&
  inner.bottom <= outer.bottom &&
  inner.right <= outer.right

/**
 * Marcador a usar en la demostración: uno visible dentro del mapa y, de
 * preferencia, con balones en custodia (lleva el badge con la cantidad).
 * Devuelve undefined mientras los marcadores aún no cargan (waitForElement).
 */
const findDemoMarker = (): Element | undefined => {
  const container = document.querySelector(MAP_CONTAINER_SELECTOR)
  const markers = Array.from(document.querySelectorAll<HTMLElement>(MARKER_SELECTOR))
  if (!markers.length) return undefined

  const containerRect = container?.getBoundingClientRect()
  const visible = containerRect
    ? markers.filter((marker) => isInside(marker.getBoundingClientRect(), containerRect))
    : markers
  const candidates = visible.length ? visible : markers

  return candidates.find((marker) => marker.querySelector('.cliente-mapa-badge')) ?? candidates[0]
}

const findPopup = () => document.querySelector(POPUP_SELECTOR) ?? undefined


/**
 * driver.js hace scrollIntoView del elemento resaltado si queda fuera del
 * viewport; dentro del mapa eso desplazaría el contenedor de Leaflet
 * (overflow hidden) y descuadraría los tiles. Se acerca el mapa a la vista
 * antes y se anula cualquier scroll interno que haya quedado.
 */
const bringMapIntoView = () => {
  document.querySelector(MAP_CONTAINER_SELECTOR)?.scrollIntoView({ block: 'center', behavior: 'auto' })
}

const resetLeafletScroll = () => {
  const container = document.querySelector<HTMLElement>('.leaflet-container')
  if (!container) return
  container.scrollTop = 0
  container.scrollLeft = 0
}

/** Abre el detalle del marcador de la demo (si ya está abierto, no lo cierra). */
const openDemoMarkerPopup = () => {
  if (findPopup()) return
  const marker = findDemoMarker()
  if (marker instanceof HTMLElement) marker.click()
}

const legendItem = (color: string, label: string, text: string) =>
  `<li class="flex items-start gap-2">
    <span class="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${color}"></span>
    <span><strong>${label}:</strong> ${text}</span>
  </li>`

const LEGEND_DESCRIPTION = `
  <p>El color del marcador indica la situación de los balones del cliente:</p>
  <ul class="mt-2 space-y-1.5">
    ${legendItem('bg-gray-400', 'Sin balones', 'no tiene balones en préstamo, alquiler ni propios.')}
    ${legendItem('bg-brand-500', 'Con balones', 'tiene balones en custodia dentro del plazo.')}
    ${legendItem('bg-amber-500', 'Atención / vencido', 'lleva 90 días o más con balones, o su plazo venció.')}
    ${legendItem('bg-error-500', 'Crítico', 'lleva 180 días o más con balones; requiere seguimiento urgente.')}
  </ul>
`

export function createClienteMapaTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ tutorial, sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-clientes-mapa"]',
      popover: {
        title: '1. Mapa de clientes',
        description:
          'En el menú Clientes ingresa a Mapa. Aquí ubicas en tiempo real las direcciones de clientes y proveedores, y ves qué balones tiene cada uno en custodia.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="mapa-buscador"]',
      popover: {
        title: '2. Buscar cliente',
        description:
          'Escribe el nombre o número de documento. El mapa se actualiza solo y muestra únicamente los clientes que coinciden.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="mapa-filtros"]',
      popover: {
        title: '3. Filtros',
        description:
          'Limita el mapa por estado (activos o inactivos) y por balones: solo con balones, en préstamo, en alquiler o propios del cliente.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="mapa-leyenda"]',
      popover: {
        title: '4. Leyenda',
        description: LEGEND_DESCRIPTION,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: asyncElement(findDemoMarker),
      // Los marcadores aparecen cuando termina de cargar la consulta del mapa.
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      onHighlightStarted: bringMapIntoView,
      onHighlighted: resetLeafletScroll,
      popover: {
        title: '5. Ubicar un cliente',
        description:
          'Cada marcador es un cliente con ubicación registrada; el número sobre el puntero indica cuántos balones tiene en custodia. Pulsa «Siguiente» para abrir su detalle.',
        side: 'left',
        align: 'center',
        onNextClick: () => {
          openDemoMarkerPopup()
          // Esperar el autoPan de Leaflet para resaltar el popup en su posición final.
          window.setTimeout(() => tutorial.moveNext(), POPUP_OPEN_MS)
        },
      },
    },
    {
      element: asyncElement(findPopup),
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      onHighlightStarted: bringMapIntoView,
      onHighlighted: resetLeafletScroll,
      popover: {
        title: '6. Balones en custodia',
        description:
          'El detalle muestra dirección, documento y teléfono del cliente, y la lista de balones que tiene: código, tipo, si es préstamo, alquiler o propio, y los días que lleva en su poder. Desde aquí puedes abrirlo en Google Maps o iniciar la ruta.',
        side: 'left',
        align: 'start',
        onNextClick: () => finish('mapa-clientes'),
      },
    },
  ])
}

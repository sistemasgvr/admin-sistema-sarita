import { driver, type Config, type DriveStep, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { toastSuccess } from '@/shared/composables/useToast'

export interface TutorialOptions {
  /** Expande o minimiza el sidebar del layout admin durante la ruta. */
  setSidebarExpanded?: (expanded: boolean) => void
}

export interface TutorialContext {
  tutorial: Driver
  /** Marca el paso que resalta el sidebar: lo expande al entrar y lo minimiza al salir. */
  sidebarStep: (step: DriveStep) => DriveStep
  collapseSidebar: () => void
  /** Cierra la ruta, restaura el sidebar y avisa al módulo de soporte que terminó. */
  finish: (tutorialId: string) => void
  /**
   * `onNextClick` que pulsa un elemento (ej. un botón que abre un modal) y avanza
   * cuando termina la transición, para resaltar lo que apareció.
   */
  clickThenNext: (selector: string, delayMs?: number) => () => void
  /** `onNextClick` que cierra el AppModal abierto y avanza al paso siguiente. */
  closeModalThenNext: (delayMs?: number) => () => void
}

/** Tiempo máximo de espera a que aparezca un elemento que se carga de forma asíncrona. */
export const TUTORIAL_WAIT_FOR_ELEMENT_MS = 4000

/** Apertura/cierre de AppModal (transición) antes de resaltar lo que hay dentro o fuera. */
export const MODAL_TRANSITION_MS = 400

/** Botón «Cerrar» del AppModal abierto más arriba (el último en el DOM). */
const MODAL_CLOSE_SELECTOR = '[aria-label="Cerrar modal"]'

/**
 * Primer elemento VISIBLE que coincide con el selector. Necesario para anclas
 * dentro de tablas: AppTable renderiza primero una versión móvil oculta
 * (`md:hidden`) con los mismos slots, y `querySelector` devolvería esa copia
 * (rect 0×0 → popover en la esquina y sin recorte). Devuelve undefined mientras
 * no exista, para combinarlo con `waitForElement`.
 */
export function visibleElement(selector: string): Element | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find(
    (element) => element.getClientRects().length > 0,
  )
}

/**
 * `element` de un paso que se resuelve en runtime. driver.js lo tipa como
 * `() => Element`, pero acepta undefined y reintenta durante `waitForElement`.
 */
export const asyncElement = (find: () => Element | undefined) => find as () => Element

/** Paso anclado a una fila de tabla: primera coincidencia visible, esperando a que cargue. */
export function tableStep(selector: string, step: Omit<DriveStep, 'element'>): DriveStep {
  return {
    ...step,
    element: asyncElement(() => visibleElement(selector)),
    waitForElement: step.waitForElement ?? TUTORIAL_WAIT_FOR_ELEMENT_MS,
    // Las acciones quedan en la última columna; hay que desplazar la tabla horizontalmente.
    onHighlightStarted: (element, ...rest) => {
      scrollIntoScrollableParents(element)
      step.onHighlightStarted?.(element, ...rest)
    },
  }
}

/**
 * Descripción con viñetas para popovers que enumeran opciones o acciones.
 * driver.js inserta la descripción como HTML.
 */
export function bulletList(items: Array<[label: string, text: string]>) {
  return `<ul class="mt-1 space-y-1.5">${items
    .map(([label, text]) => `<li><strong>${label}:</strong> ${text}</li>`)
    .join('')}</ul>`
}

/** Duración de la transición de ancho del sidebar (AppSidebar: duration-300). */
const SIDEBAR_TRANSITION_MS = 350

const baseConfig: Config = {
  animate: true,
  allowClose: true,
  showProgress: true,
  nextBtnText: 'Siguiente',
  prevBtnText: 'Anterior',
  doneBtnText: 'Finalizar',
  progressText: '{{current}} de {{total}}',
  popoverClass: 'sarita-tutorial-popover',
  // Un click fuera del elemento resaltado no interrumpe la ruta.
  overlayClickBehavior: () => {},
}

const EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof Element && target.closest(EDITABLE_SELECTOR) !== null

/**
 * Bloquea la escritura en campos de formulario mientras la ruta está activa:
 * el tutorial es una demostración, no debe registrar datos.
 */
function blockTyping() {
  const onKeydown = (event: KeyboardEvent) => {
    if (!isEditableTarget(event.target)) return
    if (event.key === 'Tab' || event.key === 'Escape') return
    event.preventDefault()
    event.stopPropagation()
  }
  const onInput = (event: Event) => {
    if (!isEditableTarget(event.target)) return
    event.preventDefault()
    event.stopPropagation()
  }

  document.addEventListener('keydown', onKeydown, true)
  document.addEventListener('beforeinput', onInput, true)
  document.addEventListener('paste', onInput, true)
  document.addEventListener('drop', onInput, true)

  return () => {
    document.removeEventListener('keydown', onKeydown, true)
    document.removeEventListener('beforeinput', onInput, true)
    document.removeEventListener('paste', onInput, true)
    document.removeEventListener('drop', onInput, true)
  }
}

/**
 * Desplaza horizontalmente los contenedores con overflow (ej. tablas) para que el
 * elemento quede visible. driver.js solo hace scroll cuando el elemento está fuera
 * del viewport, no cuando lo oculta un contenedor con scroll propio.
 */
export function scrollIntoScrollableParents(element?: Element) {
  if (!element) return
  let parent = element.parentElement
  while (parent && parent !== document.body) {
    const { overflowX } = getComputedStyle(parent)
    if ((overflowX === 'auto' || overflowX === 'scroll') && parent.scrollWidth > parent.clientWidth) {
      const parentRect = parent.getBoundingClientRect()
      const rect = element.getBoundingClientRect()
      parent.scrollLeft += rect.left + rect.width / 2 - (parentRect.left + parentRect.width / 2)
    }
    parent = parent.parentElement
  }
}

/**
 * Crea y arranca una ruta guiada con la configuración común del sistema.
 * Devuelve la función para destruirla.
 */
export function runTutorial(
  options: TutorialOptions,
  buildSteps: (ctx: TutorialContext) => DriveStep[],
): () => void {
  let unblockTyping: (() => void) | undefined
  const cleanup = () => {
    unblockTyping?.()
    unblockTyping = undefined
  }

  const tutorial = driver({ ...baseConfig, onDestroyed: cleanup })

  const setSidebarExpanded = (expanded: boolean) => {
    options.setSidebarExpanded?.(expanded)
    // Los sub-ítems del menú solo existen con el sidebar expandido: reposicionar al terminar.
    window.setTimeout(() => tutorial.refresh(), SIDEBAR_TRANSITION_MS)
  }
  const collapseSidebar = () => setSidebarExpanded(false)

  const ctx: TutorialContext = {
    tutorial,
    collapseSidebar,
    sidebarStep: (step) => ({
      ...step,
      onHighlightStarted: () => setSidebarExpanded(true),
      onDeselected: collapseSidebar,
    }),
    finish: (tutorialId) => {
      tutorial.destroy()
      options.setSidebarExpanded?.(true)
      if (window.parent === window) {
        // Ruta abierta en su propia pestaña («Abrir ruta»): no hay módulo de soporte que muestre el modal.
        toastSuccess('¡Ruta completada!')
        return
      }
      window.parent.postMessage({ type: 'tutorial-completado', tutorialId }, window.location.origin)
    },
    clickThenNext: (selector, delayMs = MODAL_TRANSITION_MS) => () => {
      const target = visibleElement(selector)
      if (target instanceof HTMLElement) target.click()
      window.setTimeout(() => tutorial.moveNext(), delayMs)
    },
    closeModalThenNext: (delayMs = MODAL_TRANSITION_MS) => () => {
      const closeButtons = document.querySelectorAll<HTMLElement>(MODAL_CLOSE_SELECTOR)
      closeButtons[closeButtons.length - 1]?.click()
      window.setTimeout(() => tutorial.moveNext(), delayMs)
    },
  }

  tutorial.setSteps(buildSteps(ctx))
  unblockTyping = blockTyping()
  tutorial.drive()

  return () => {
    tutorial.destroy()
    cleanup()
  }
}

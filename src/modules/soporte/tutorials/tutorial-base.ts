import { driver, type Config, type DriveStep, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'

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
}

/** Tiempo máximo de espera a que aparezca un elemento que se carga de forma asíncrona. */
export const TUTORIAL_WAIT_FOR_ELEMENT_MS = 4000

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

  const collapseSidebar = () => {
    options.setSidebarExpanded?.(false)
    window.setTimeout(() => tutorial.refresh(), SIDEBAR_TRANSITION_MS)
  }

  const ctx: TutorialContext = {
    tutorial,
    collapseSidebar,
    sidebarStep: (step) => ({
      ...step,
      onHighlightStarted: () => options.setSidebarExpanded?.(true),
      onDeselected: collapseSidebar,
    }),
    finish: (tutorialId) => {
      tutorial.destroy()
      options.setSidebarExpanded?.(true)
      window.parent.postMessage({ type: 'tutorial-completado', tutorialId }, window.location.origin)
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

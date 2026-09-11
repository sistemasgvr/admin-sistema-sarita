import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebar } from '@/modules/admin/composables/useSidebar'
import type { TutorialOptions } from '@/modules/soporte/tutorials/tutorial-base'

/** Espera a que el layout termine de montarse antes de resaltar el primer elemento. */
const DEFAULT_START_DELAY_MS = 350

/**
 * Arranca una ruta guiada cuando la vista se abre con `?tutorial=<id>` (desde el
 * módulo Soporte) y la destruye al salir de la vista.
 */
export function useTutorialAutoStart(
  tutorialId: string,
  create: (options: TutorialOptions) => () => void,
  delayMs = DEFAULT_START_DELAY_MS,
) {
  const route = useRoute()
  const { setExpanded: setSidebarExpanded } = useSidebar()

  let destroyTutorial: (() => void) | undefined

  onMounted(async () => {
    if (route.query.tutorial !== tutorialId) return
    await nextTick()
    window.setTimeout(() => {
      destroyTutorial = create({ setSidebarExpanded })
    }, delayMs)
  })

  onBeforeUnmount(() => destroyTutorial?.())
}

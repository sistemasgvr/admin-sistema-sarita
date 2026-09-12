import { runTutorial, type TutorialOptions } from '@/modules/soporte/tutorials/tutorial-base'

export function createSistemaPermisosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-permisos"]',
      popover: {
        title: '1. Permisos',
        description:
          'Catálogo de todas las banderas de permiso del sistema. Cada acción (ver clientes, crear ventas, anular comprobantes…) tiene una bandera.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Por nombre de la bandera (ej. VENTAS_CREAR) o por su descripción.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="permisos-tabla"]',
      popover: {
        title: '3. Solo consulta',
        description:
          'Las banderas se dan de alta en el código del sistema, no desde aquí. Esta pantalla sirve para ver qué existe, su descripción y en cuántos roles está asignada. Para otorgarlas usa Roles › Permisos.',
        side: 'top',
        align: 'start',
        onNextClick: () => finish('sistema-permisos'),
      },
    },
  ])
}

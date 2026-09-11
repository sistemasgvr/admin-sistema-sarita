import { runTutorial, tableStep, type TutorialOptions } from '@/modules/soporte/tutorials/tutorial-base'

export function createClienteRelacionadosListadoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep }) => [
    sidebarStep({
      element: '[data-tutorial="menu-clientes"]',
      popover: {
        title: '1. Módulo Clientes',
        description: 'Ubícate en Clientes y abre Listado General.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="clientes-listado"]',
      popover: {
        title: '2. Listado general',
        description: 'Estás en el listado general de clientes.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="clientes-buscador"]',
      popover: {
        title: '3. Buscar cliente',
        description: 'Busca al cliente al que deseas asociar información adicional.',
        side: 'bottom',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="clientes-editar"]', {
      advanceOnClick: true,
      popover: {
        title: '4. Editar cliente',
        description: 'Pulsa el lápiz del cliente elegido para abrir su ficha y continuar el tutorial.',
        side: 'left',
        align: 'center',
        showButtons: ['close'],
      },
    }),
  ])
}

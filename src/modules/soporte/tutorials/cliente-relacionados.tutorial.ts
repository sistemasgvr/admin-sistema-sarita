import { runTutorial, type TutorialOptions } from '@/modules/soporte/tutorials/tutorial-base'

const selectTab = (key: string) => {
  document.querySelector<HTMLElement>(`[data-tutorial="cliente-tab-${key}"]`)?.click()
}

export function createClienteRelacionadosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ tutorial, collapseSidebar, finish }) => {
    collapseSidebar()

    const goToTab = (key: string) => () => {
      selectTab(key)
      tutorial.moveNext()
    }

    return [
      {
        element: '[data-tutorial="cliente-relacionados"]',
        popover: {
          title: '5. Datos asociados',
          description: 'En esta sección puedes administrar la información vinculada al cliente.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="cliente-tab-contactos"]',
        popover: {
          title: '6. Contactos',
          description: 'Registra y administra los contactos del cliente.',
          side: 'bottom',
          align: 'start',
          onNextClick: goToTab('direcciones'),
        },
      },
      {
        element: '[data-tutorial="cliente-tab-direcciones"]',
        popover: {
          title: '7. Direcciones',
          description: 'Agrega las direcciones y ubicaciones de entrega.',
          side: 'bottom',
          align: 'start',
          onNextClick: goToTab('choferes'),
        },
      },
      {
        element: '[data-tutorial="cliente-tab-choferes"]',
        popover: {
          title: '8. Choferes',
          description: 'Relaciona los choferes que trabajan con este cliente.',
          side: 'bottom',
          align: 'start',
          onNextClick: goToTab('vehiculos'),
        },
      },
      {
        element: '[data-tutorial="cliente-tab-vehiculos"]',
        popover: {
          title: '9. Vehículos',
          description: 'Gestiona los vehículos asociados al cliente.',
          side: 'bottom',
          align: 'start',
          onNextClick: goToTab('cuentas-bancarias'),
        },
      },
      {
        element: '[data-tutorial="cliente-tab-cuentas-bancarias"]',
        popover: {
          title: '10. Cuentas bancarias',
          description: 'Aquí registras las cuentas bancarias del cliente.',
          side: 'bottom',
          align: 'start',
          onNextClick: goToTab('solicitudes'),
        },
      },
      {
        element: '[data-tutorial="cliente-tab-solicitudes"]',
        popover: {
          title: '11. Solicitudes',
          description: 'Consulta las solicitudes de baja o reactivación. Este es el último tab.',
          side: 'bottom',
          align: 'start',
          onNextClick: () => finish('asociar-datos-cliente'),
        },
      },
    ]
  })
}
